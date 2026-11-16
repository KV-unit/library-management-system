import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { useAuth } from './AuthContext';

// A guest's list lives under STORAGE_KEY. A logged-in user gets their own key, so two people
// sharing one browser never see each other's list.
export const STORAGE_KEY = 'library-reading-list';

export function storageKeyFor(user) {
  return user ? `${STORAGE_KEY}:user:${user.id}` : STORAGE_KEY;
}

// Only what the list page needs, so the saved list stays small.
export function toListItem(book) {
  return { id: book.id, title: book.title, author: book.author, genre: book.genre ? book.genre.name : null };
}

function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item.id === 'number');
  } catch {
    // missing, corrupt or blocked storage: start with an empty list
  }
  return [];
}

function writeList(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // storage full or blocked: the list still works for this visit
  }
}

function removeList(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // nothing to do
  }
}

// base first, then anything in `extra` whose id is not already there.
function mergeItems(base, extra) {
  const seen = new Set(base.map((item) => item.id));
  return [...base, ...extra.filter((item) => !seen.has(item.id))];
}

// The reducer is a pure function: (state, action) -> new state. State is { key, items }, where
// `key` says which saved list the items belong to.
export function readingListReducer(state, action) {
  switch (action.type) {
    case 'ADD_BOOK':
      if (state.items.some((item) => item.id === action.book.id)) return state; // no duplicates
      return { ...state, items: [...state.items, action.book] };
    case 'REMOVE_BOOK':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case 'CLEAR_LIST':
      return { ...state, items: [] };
    case 'MERGE_BOOKS':
      return { ...state, items: mergeItems(state.items, action.books) };
    case 'SWITCH_LIST':
      return { key: action.key, items: action.items };
    default:
      return state;
  }
}

const ReadingListContext = createContext(null);

export function ReadingListProvider({ children }) {
  const { user } = useAuth();
  const key = storageKeyFor(user);

  // The list is restored from localStorage the first time the provider renders.
  const [state, dispatch] = useReducer(readingListReducer, key, (initialKey) => ({
    key: initialKey,
    items: readList(initialKey),
  }));
  const previousKey = useRef(key);

  // Logging in or out changes `key`. Load the list that belongs to the new key. When a guest
  // logs in (stretch task), their guest list is merged into the account's list and then removed.
  useEffect(() => {
    if (previousKey.current === key) return;
    const wasGuest = previousKey.current === STORAGE_KEY;
    previousKey.current = key;

    let items = readList(key);
    if (wasGuest && key !== STORAGE_KEY) {
      items = mergeItems(items, readList(STORAGE_KEY));
      removeList(STORAGE_KEY);
    }
    dispatch({ type: 'SWITCH_LIST', key, items });
  }, [key]);

  // Persist after every change. The key check stops a list from being saved under the wrong key
  // during the render right after a login or logout.
  useEffect(() => {
    if (state.key === key) writeList(key, state.items);
  }, [key, state]);

  const addBook = useCallback((book) => dispatch({ type: 'ADD_BOOK', book: toListItem(book) }), []);
  const removeBook = useCallback((id) => dispatch({ type: 'REMOVE_BOOK', id }), []);
  const clearList = useCallback(() => dispatch({ type: 'CLEAR_LIST' }), []);

  const value = useMemo(
    () => ({
      items: state.items,
      count: state.items.length,
      hasBook: (id) => state.items.some((item) => item.id === id),
      addBook,
      removeBook,
      clearList,
    }),
    [state.items, addBook, removeBook, clearList],
  );

  return <ReadingListContext.Provider value={value}>{children}</ReadingListContext.Provider>;
}

export function useReadingList() {
  const value = useContext(ReadingListContext);
  if (!value) throw new Error('useReadingList must be used inside <ReadingListProvider>');
  return value;
}
