// Stretch: choose whether the books are ordered by title or by author.
export default function SortControl({ value, onChange }) {
  return (
    <div className="field">
      <label htmlFor="sort-control" className="sr-only">
        Sort books
      </label>
      <select id="sort-control" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="title">Sort by title (A to Z)</option>
        <option value="author">Sort by author (A to Z)</option>
      </select>
    </div>
  );
}
