# Library Management System

A library's book catalog and a secure API for it, built with **NestJS**, **Prisma** and **PostgreSQL**.
Patrons and librarians are users, books belong to genres, and patrons can review books.
Anyone can browse the catalog. Only librarians can add, change or remove books and genres.

<!-- FILE-LINKS-START -->
## Where to find the code

Everything lives in the api folder of this repository (branch main), and docs/postman_collection.json holds the Postman collection. Each link below opens one file as plain text, so the files can be read one by one. The same files are also printed in full in the Source code listing at the end of this README.

### Week 2: genres

- [api/src/genres/genres.controller.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/genres/genres.controller.ts)
- [api/src/genres/genres.service.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/genres/genres.service.ts)
- [api/src/genres/genres.module.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/genres/genres.module.ts)
- [api/src/genres/dto/create-genre.dto.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/genres/dto/create-genre.dto.ts)
- [api/src/genres/dto/update-genre.dto.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/genres/dto/update-genre.dto.ts)

### Week 2: books

- [api/src/books/dto/create-book.dto.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/books/dto/create-book.dto.ts)
- [api/src/books/dto/update-book.dto.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/books/dto/update-book.dto.ts)
- [api/src/books/books.controller.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/books/books.controller.ts)
- [api/src/books/books.service.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/books/books.service.ts)
- [api/src/books/books.module.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/books/books.module.ts)

### Week 2: authentication and authorization

- [api/src/auth/auth.controller.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/auth.controller.ts)
- [api/src/auth/auth.service.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/auth.service.ts)
- [api/src/auth/auth.module.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/auth.module.ts)
- [api/src/auth/dto/register.dto.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/dto/register.dto.ts)
- [api/src/auth/dto/login.dto.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/dto/login.dto.ts)
- [api/src/auth/jwt.strategy.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/jwt.strategy.ts)
- [api/src/auth/jwt-auth.guard.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/jwt-auth.guard.ts)
- [api/src/auth/roles.decorator.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/roles.decorator.ts)
- [api/src/auth/roles.guard.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/auth/roles.guard.ts)

### Week 2: app setup, profile endpoint and Postman

- [api/src/main.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/main.ts)
- [api/src/app.module.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/app.module.ts)
- [api/src/users/users.controller.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/users/users.controller.ts)
- [api/src/users/users.service.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/users/users.service.ts)
- [api/src/users/users.module.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/users/users.module.ts)
- [docs/postman_collection.json](https://raw.githubusercontent.com/KV-unit/library-management-system/main/docs/postman_collection.json)

### Week 1: data layer

- [api/prisma/schema.prisma](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/prisma/schema.prisma)
- [api/prisma/seed.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/prisma/seed.ts)
- [api/src/prisma/prisma.service.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/prisma/prisma.service.ts)
- [api/src/prisma/prisma.module.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/prisma/prisma.module.ts)
- [api/.env.example](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/.env.example)

<!-- FILE-LINKS-END -->

## Tech stack

| Part | Choice |
| --- | --- |
| API framework | NestJS (TypeScript) |
| ORM | Prisma 6 |
| Database | PostgreSQL hosted on Supabase, tables kept in their own `library` schema |
| Seeding | `prisma/seed.ts`, run with `tsx` |
| Validation | `class-validator` DTOs and a global `ValidationPipe({ whitelist: true })` |
| Authentication | JWT (`@nestjs/jwt`, `passport-jwt`), passwords hashed with `bcrypt` |
| Authorization | `@Roles()` decorator and a `RolesGuard` |
| Rate limiting | `@nestjs/throttler` on the login route |
| Frontend | React 19 with Vite 6 and plain CSS |
| Routing | `react-router-dom` v6 (`BrowserRouter`, `Routes`, `Link`, `useParams`) |
| Client state | React Context with `useReducer`, saved to `localStorage` |

## Data model

```mermaid
erDiagram
    GENRE ||--o{ BOOK : "has many"
    BOOK ||--o{ REVIEW : "receives"
    USER ||--o{ REVIEW : "writes"

    USER {
        int id PK
        string email UK
        string name
        string password "bcrypt hash"
        Role role "PATRON or LIBRARIAN"
    }
    GENRE {
        int id PK
        string name UK
        string slug UK
        string description
    }
    BOOK {
        int id PK
        string title
        string author
        string isbn UK
        string description
        int publishedYear
        int totalCopies
        int availableCopies
        int genreId FK
    }
    REVIEW {
        int id PK
        int bookId FK
        int userId FK
        int rating
        string comment
    }
```

The full definition is in [`api/prisma/schema.prisma`](api/prisma/schema.prisma).

## Getting started

You need Node.js 20 or later and a PostgreSQL database.

```bash
cd api
npm install
cp .env.example .env        # on Windows PowerShell: Copy-Item .env.example .env
# edit .env: set DATABASE_URL to your own database and JWT_SECRET to a long random string

npx prisma migrate dev      # apply the migrations and create the tables
npx prisma db seed          # 5 genres, 20 books, 4 users, 4 reviews
npm run start:dev           # start the API on http://localhost:3000
```

`.env` is ignored by git. The repository only contains [`api/.env.example`](api/.env.example), which holds
placeholders and no real credentials.

To look at the data, run `npx prisma studio` from the `api` folder. Run the unit tests with `npm test`.

The seed creates two logins you can use straight away (password `Password123!`):
`librarian@example.com` (role LIBRARIAN) and `amani@example.com` (role PATRON).

## API

| Method and path | Who can call it | What it does |
| --- | --- | --- |
| `POST /auth/register` | anyone | Create a PATRON account. The password is hashed with bcrypt before saving |
| `POST /auth/login` | anyone, 5 tries per minute | Returns `{ access_token }`, a JWT signed with `JWT_SECRET` |
| `GET /users/profile` | any logged-in user | The current user, read from the request (never includes the password) |
| `GET /genres`, `GET /genres/:id` | anyone | List genres with book counts, or one genre with its books |
| `POST /genres`, `PATCH /genres/:id`, `DELETE /genres/:id` | LIBRARIAN | Create, update, remove a genre |
| `GET /books` | anyone | List books. Query: `genreId`, `search` (title or author), `page`, `limit` |
| `GET /books/:id` | anyone | One book with its genre |
| `POST /books`, `PATCH /books/:id`, `DELETE /books/:id` | LIBRARIAN | Create, update, remove a book |
| `GET /spaces` | anyone | List the spaces that can be booked |
| `POST /bookings` | any logged-in user | Book a space for a date and time. 409 if it overlaps an existing booking |
| `GET /bookings` | any logged-in user | Your own bookings |
| `DELETE /bookings/:id` | the owner or a LIBRARIAN | Cancel a booking (its status becomes CANCELLED) |

`GET /books` returns `{ data, meta: { total, page, limit, totalPages } }`. For example,
`GET /books?genreId=2&search=dune&page=1&limit=5`. `page` starts at 1 and `limit` is capped at 100.

Send the token on protected routes as `Authorization: Bearer <access_token>`.
Status codes: 400 invalid data, 401 missing or bad token, 403 wrong role, 404 not found, 409 duplicate or genre still in use.

<!-- BOOKINGS-SECTION-START -->
### Space bookings (week 4)

Patrons can book a room or area for a time slot. The data lives in two new tables: `Space` (name and capacity, seeded with five spaces) and `Booking` (one slot on one day, with a status of `CONFIRMED` or `CANCELLED`).

- **`POST /bookings`** takes `{ spaceId, date, startTime, endTime }` with the date as `YYYY-MM-DD` and the times as 24-hour `HH:MM`. The booking always belongs to the logged-in user, taken from the JWT and never from the request body, so nobody can book on someone else's behalf.
- **Overlaps are rejected with 409.** Two slots overlap when each one starts before the other ends, so the API looks for a confirmed booking of the same space and date that starts before the new end and ends after the new start. A booking that ends at 10:00 does not clash with one that starts at 10:00.
- **No double booking under load.** Checking and saving are two steps, so two simultaneous requests could both pass the check. The check and the insert therefore run inside one `SERIALIZABLE` database transaction, and if the database stops one of the two requests it is also answered with 409.
- **Other errors:** 400 for a bad date or time, an end that is not after the start, or a date in the past; 401 without a token; 404 for an unknown space or booking.
- **`GET /bookings`** lists the caller's own bookings (librarians list everyone's with `GET /bookings/all`), and **`DELETE /bookings/:id`** cancels one by setting its status to `CANCELLED`, which frees the slot. Only the owner or a librarian may cancel, otherwise 403. Keeping the row instead of deleting it leaves a record of what happened.
- **`GET /spaces`** is public. The booking form on the client fills its dropdown from it.
- Date and time are stored as a calendar date plus two `HH:MM` strings instead of timestamps. The library has no time zone concerns for a room slot, and zero-padded 24-hour strings sort and compare correctly as plain text.

<!-- BOOKINGS-SECTION-END -->

<!-- BORROW-SECTION-START -->
### Borrow requests, fines and admin routes (week 5)

A patron turns the books on their reading list into borrow requests, and a librarian answers them. The data lives in the `BorrowRequest` table (one row per book requested) with a `BorrowStatus` of `PENDING`, `APPROVED`, `REJECTED` or `RETURNED`.

| Method and path | Who can call it | What it does |
| --- | --- | --- |
| `POST /borrow-requests` | any logged-in user | Body `{ bookIds: [1, 2] }`. Creates one `PENDING` request per book for the logged-in user |
| `GET /borrow-requests/mine` | any logged-in user | The caller's own requests |
| `GET /borrow-requests?status=PENDING` | LIBRARIAN | Every request, optionally for one status |
| `PATCH /borrow-requests/:id` | LIBRARIAN | Body `{ status }`. Approve, reject or mark returned |
| `GET /bookings/all?spaceId=&date=` | LIBRARIAN | Every space booking, optionally for one space and day |

**Status changes.** A request can only move forward: `PENDING` to `APPROVED` or `REJECTED`, and `APPROVED` to `RETURNED`. Anything else, such as returning a request that was never approved, is answered with 409.

- **Approving** takes one copy off the shelf and sets a due date 14 days away. The copy is taken with `updateMany` and the condition `availableCopies > 0`, which the database applies as one step, so two librarians approving the last copy cannot both succeed. If no copy is left the answer is 409.
- **Returning** puts the copy back and works out `fineAmount` with `calculateFine(dueDate, returnDate, ratePerDay)`, using a rate of 0.50 per day. Approving, returning and saving the request all happen in one transaction, so the copy count and the request never disagree.
- **Creating** checks that every book exists (404 if not) and that the patron has no open request for any of them (409 if they do). The requests are saved together or not at all.
- **Admin routes** (`GET` and `PATCH /borrow-requests`, `GET /bookings/all`) use `@Roles(Role.LIBRARIAN)` with `RolesGuard`, so a patron gets 403 even if they call the API directly.
- A book that has borrow requests cannot be deleted (409), so the loan history is never lost.

**Why the fine is a pure function.** `calculateFine` in `fine-calculator.ts` takes two dates and a rate and returns a number. It reads no clock and touches no database, so it is easy to test and the same inputs always give the same fine. It counts whole calendar days late, so returning on the due date at any time of day is on time, and rounds the result to the nearest cent. `fine-calculator.spec.ts` covers on-time, late, month boundaries, rounding and invalid input.

Files:

- [api/prisma/schema.prisma](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/prisma/schema.prisma)
- [api/src/borrow-requests/borrow-requests.controller.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/borrow-requests/borrow-requests.controller.ts)
- [api/src/borrow-requests/borrow-requests.service.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/borrow-requests/borrow-requests.service.ts)
- [api/src/borrow-requests/borrow-requests.module.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/borrow-requests/borrow-requests.module.ts)
- [api/src/borrow-requests/dto/create-borrow-request.dto.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/borrow-requests/dto/create-borrow-request.dto.ts)
- [api/src/borrow-requests/fine-calculator.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/borrow-requests/fine-calculator.ts)
- [api/src/borrow-requests/fine-calculator.spec.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/borrow-requests/fine-calculator.spec.ts)
- [api/src/bookings/bookings.controller.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/bookings/bookings.controller.ts)
- [api/src/bookings/bookings.service.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/bookings/bookings.service.ts)
- [api/src/bookings/bookings.module.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/bookings/bookings.module.ts)
- [api/src/bookings/dto/create-booking.dto.ts](https://raw.githubusercontent.com/KV-unit/library-management-system/main/api/src/bookings/dto/create-booking.dto.ts)

<!-- BORROW-SECTION-END -->

A ready-made request for every endpoint is in [`docs/postman_collection.json`](docs/postman_collection.json).
Import it into Postman, run `Login (librarian)` first, and the token is saved for the other requests.

<!-- CLIENT-SECTION-START -->
## Client: catalog browsing and search (Week 3)

A React single-page app in the `client` folder lets patrons browse the catalog, search it, filter by genre and open a book.
It talks to the NestJS API over HTTP and has no backend of its own.

### Run it

Start the API in one terminal and the client in another:

```bash
cd api
npm run start:dev          # API on http://localhost:3000

cd client
npm install
npm run dev                # client on http://localhost:5173
```

The API address comes from `client/.env`:

```
VITE_API_URL=http://localhost:3000
```

This file is committed on purpose. It holds only a public address, not a secret, and Vite exposes only variables that start with `VITE_` to the browser.

### What it does

| Feature | Where |
| --- | --- |
| Routes: `/` (catalog) and `/books/:id` (one book) | `client/src/App.jsx` |
| Responsive grid of book cards (1 column on a phone, 4 or more on a desktop) | `BookGrid.jsx`, `BookCard.jsx`, `index.css` |
| Genre filter, filled from `GET /genres` | `GenreFilter.jsx` |
| Live search by title or author, debounced by 400 ms | `SearchBar.jsx` |
| Book detail page using `useParams()` and `GET /books/:id` | `BookDetail.jsx` |
| Loading, error (with a retry button) and empty states | `BookGrid.jsx`, `BookDetail.jsx` |
| Stretch: sort by title or author | `SortControl.jsx`, `lib/sort.js` |
| Stretch: skeleton cards while loading | `SkeletonCard.jsx` |

### Design decisions

- **The filters live in `HomePage`.** `HomePage` holds the search text, the selected genre and the sort order in one place and passes them down. `SearchBar` and `GenreFilter` only report changes, and `BookGrid` only reads the values and fetches. Keeping the state in their common parent means the pieces never need to know about each other.
- **Debouncing with `setTimeout` and a cleanup.** Every keystroke starts a 400 ms timer in `useEffect`, and the effect's cleanup function cancels the previous timer. The search only reaches the API once the visitor stops typing, so "dune" sends one request instead of four.
- **Stale answers cannot win.** `BookGrid` creates an `AbortController` for each request and aborts it in the effect cleanup. If the filters change before the first answer arrives, the old request is cancelled, so a slow response can never overwrite a newer one.
- **`key={book.id}` on every card.** The id is stable and unique, so React keeps the right card for the right book when the list is filtered or re-sorted. An array index would not.
- **Sorting happens in the browser.** The API returns books ordered by title, and the client asks for up to 100 books at once, which is the API's limit. Sorting by author is therefore done on that list with `localeCompare`. For a much larger catalog the API would need its own sort option and the client would need paging.
- **Filters survive a trip to a book.** `HomePage` saves the filters in `sessionStorage`, so going back from a book page returns to the same search and genre.
- **Errors say what happened.** A server message such as "Book 9 not found" is shown as is, and a network failure says the server could not be reached, instead of showing a blank page.

### Where the client code is

Each link opens one file as plain text.

- [client/src/main.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/main.jsx)
- [client/src/App.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/App.jsx)
- [client/src/pages/HomePage.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/pages/HomePage.jsx)
- [client/src/pages/BookDetail.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/pages/BookDetail.jsx)
- [client/src/components/BookGrid.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/components/BookGrid.jsx)
- [client/src/components/BookCard.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/components/BookCard.jsx)
- [client/src/components/SearchBar.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/components/SearchBar.jsx)
- [client/src/components/GenreFilter.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/components/GenreFilter.jsx)
- [client/.env](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/.env)

<!-- CLIENT-SECTION-END -->

<!-- WEEK4-SECTION-START -->
## Client: reading list, login and space booking (Week 4)

The week 3 catalog now has a saved reading list, login and registration, a protected route and a space booking form.

### Pages and routes

| Route | Page | Who can open it |
| --- | --- | --- |
| `/` | Catalog with search, genre filter and sort | Everyone |
| `/books/:id` | One book, with an add-to-list button | Everyone |
| `/reading-list` | The saved reading list | Everyone |
| `/login` and `/register` | Controlled forms that call the API | Everyone |
| `/book-space` | Space booking form | Logged-in users only |

### Reading list state

`client/src/context/ReadingListContext.jsx` holds the list with `useReducer` and shares it through React Context, so the navbar count, every book card and the list page stay in step without passing props down.

- The reducer handles `ADD_BOOK`, `REMOVE_BOOK` and `CLEAR_LIST`. `ADD_BOOK` ignores a book that is already in the list.
- Every change is saved to `localStorage`, and the list is read back from there when the app starts. A broken or blocked `localStorage` is caught, so the list simply starts empty instead of crashing the page.
- `ReadingListProvider` wraps all the routes in `App.jsx`.
- **Stretch: merging a guest list.** A guest's list is saved under `library-reading-list`. A logged-in user gets their own key, `library-reading-list:user:<id>`. When a guest logs in, the guest list is merged into the account's list without duplicates, and the guest copy is removed. Logging out shows an empty guest list, so one person's list never appears for the next person on the same computer.

### Login flow

1. `LoginPage` and `RegisterPage` are controlled forms: each input shows a value from state and `onChange` updates it on every keystroke.
2. Login posts to `POST /auth/login`. The returned `access_token` and the user are saved in `localStorage` by `AuthContext`, so a refresh keeps you logged in. A token whose `exp` has passed is dropped when the app starts.
3. `POST /auth/register` returns the new user but no token, so the register page logs in with the same details straight afterwards.
4. `ProtectedRoute` checks for a token. Without one it redirects to `/login` and remembers the page the visitor wanted, and the login page sends them back there afterwards. With one it renders its children.
5. If the API answers 401 to a request, the client logs the user out and `ProtectedRoute` sends them to `/login`.

Hiding a route in React is not security on its own: anyone can call the API directly, so the NestJS guards from week 2 still check the token and the role on every request. Keeping the token in `localStorage` is simple and survives a refresh, but any script running on the page could read it, so the page must never inject untrusted HTML.

### Space booking form

`SpaceBookingPage` is a controlled form with a space dropdown and native `date` and `time` inputs, so it needs no date-picker library. `lib/booking.js` checks it before anything is sent: every field is required, the date cannot be in the past, a start time today cannot already have passed, and the end time must be after the start time.

It sends `POST /bookings` with the JWT in an `Authorization: Bearer` header and handles the answers: 409 means the slot is taken, 401 means the session is over, and 404 means the server has no booking route. The space list comes from `GET /spaces`, and the server does the real checking (see Space bookings under API).

### Where the code is

- [client/src/context/ReadingListContext.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/context/ReadingListContext.jsx)
- [client/src/context/AuthContext.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/context/AuthContext.jsx)
- [client/src/App.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/App.jsx)
- [client/src/pages/LoginPage.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/pages/LoginPage.jsx)
- [client/src/pages/RegisterPage.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/pages/RegisterPage.jsx)
- [client/src/components/ProtectedRoute.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/components/ProtectedRoute.jsx)
- [client/src/pages/SpaceBookingPage.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/pages/SpaceBookingPage.jsx)
- [client/src/components/Navbar.jsx](https://raw.githubusercontent.com/KV-unit/library-management-system/main/client/src/components/Navbar.jsx)

<!-- WEEK4-SECTION-END -->

<!-- WEEK5-CLIENT-START -->
## Client: borrow requests and admin pages (Week 5)

- **Requesting books.** A logged-in patron presses "Request to borrow" on the reading list, which sends the book ids to `POST /borrow-requests`. The requested books leave the reading list. If the server refuses (for example a request for that book is already open), its message is shown and the list is left alone. Someone who is not logged in sees a link to log in instead.
- **My requests** (`/my-requests`) shows the patron's own requests with their status, due date and any fine.
- **Admin pages (stretch)** are for librarians. `/admin/borrow-requests` lists the requests with a status filter and Approve, Reject and Mark returned buttons, and shows the fine for late returns. `/admin/bookings` lists every space booking with a space filter and a day filter, and a button to cancel a booking. A server error on one row, such as "No copies of that book are available right now", appears in that row.
- **`ProtectedRoute` takes an optional `role`.** `<ProtectedRoute role="LIBRARIAN">` sends a logged-out visitor to `/login` as before, and shows "Not allowed" to a logged-in patron. This only changes what the screen shows. The API checks the role itself, so a patron calling the admin routes directly still gets 403.
- **`useApiData`** loads a path with the user's token, cancels a request that is still running when a filter changes so an old answer cannot replace a newer one, and logs the user out when the API answers 401.

<!-- WEEK5-CLIENT-END -->

## How authentication and authorization work

1. **Register.** `RegisterDto` checks the email and password. The password is hashed with bcrypt (10 salt rounds)
   and only the hash is stored. New accounts are always `PATRON`.
2. **Login.** The service compares the password with the stored hash and returns a JWT containing the user id,
   email and role. The same error message is used for an unknown email and a wrong password.
3. **JwtAuthGuard** (`AuthGuard('jwt')`) runs `JwtStrategy`, which verifies the token with `JWT_SECRET`, loads
   the user from the database, and puts `{ userId, email, role }` on `req.user`.
4. **RolesGuard** reads the roles named by `@Roles(...)` on the route and compares them with `req.user.role`.
   Book and genre create, update and delete routes use `@Roles(Role.LIBRARIAN)`.
5. **Validation.** Every create and update body is a class-validator DTO. `ValidationPipe({ whitelist: true })`
   removes any property that is not declared on the DTO, so a request cannot sneak in a `role` or an `id`.

Checking the role only in a frontend would not be secure, because anyone can call the API directly. These checks
happen on the server for every request.

## Schema Decisions

### Why Book references Genre instead of embedding it

A `Book` stores only a `genreId` foreign key, and the genre itself lives once in the `Genre` table.
I chose this over copying the genre name or description into every book for these reasons:

- **One source of truth.** A genre's name and description are stored once. Renaming "Science Fiction" is a single
  update, and every book reflects it. Embedded copies would have to be changed on every book, and any copy
  that was missed would silently disagree with the rest.
- **The database protects integrity.** The foreign key means a book cannot point at a genre that does not exist,
  and a genre that still has books cannot be deleted by accident (the default `Restrict` behaviour).
- **Genres are queried in their own right.** Listing all genres, counting books per genre, or finding every book
  in a genre are simple indexed lookups (`@@index([genreId])`) rather than scans through book rows.
- **It fits the database.** PostgreSQL is relational, and relationships between tables are expressed with
  foreign keys. Prisma's `@relation` maps directly onto that and gives typed access in both directions
  (`book.genre` and `genre.books`).

The cost is one extra lookup when reading a book together with its genre. Prisma handles that with
`include: { genre: true }`, so the application code stays simple.

### Other decisions

- **`Role` is an enum (`PATRON`, `LIBRARIAN`).** There are only two roles, and an enum makes the database reject
  any other value. `PATRON` is the default, so a new account never gets elevated access by accident.
- **`@@unique([title, author])` and a unique `isbn` on `Book`.** They stop the same book being added twice, and they
  let the seed script use `createMany` with `skipDuplicates`, so running the seed again does not create duplicates.
- **`totalCopies` and `availableCopies`.** One number is how many copies the library owns and the other is how many are
  on the shelf, which is what lending will need later. A new book starts with every copy available.
- **`User.password` holds a bcrypt hash.** The plain password is never stored, and the API never returns the hash.
- **`Genre.slug`.** A unique URL-friendly name such as `science-fiction`. It is built from the name when not supplied.
- **`Review` has `@@unique([bookId, userId])`.** A user can review a book once. Deleting a book or user removes their
  reviews (`onDelete: Cascade`), because a review has no meaning without both sides.
- **Rating range.** Prisma has no built-in check constraint, so the 1 to 5 limit on `rating` must be enforced in
  the application layer (for example with a DTO validator) when review endpoints are added.
- **A dedicated `library` schema.** The tables are created in their own PostgreSQL schema, selected with
  `?schema=library` in `DATABASE_URL`. This keeps them apart from other projects in the same database, and out of
  the schema that Supabase exposes through its public API.

## Stretch: Prisma versus a document database

In a document database such as MongoDB, my first instinct for a book would be to store the genre inside the book
document, something like `{ title, author, genre: "Fiction" }`. That is quick to write, and reading a book needs
no join. In Prisma the schema made me decide up front that a genre is its own thing and that a book points at it
with `genreId`. What felt most different is that the database itself now enforces the rule: I cannot create a book
with a genre that does not exist, and `include: { genre: true }` returns the joined data with full types. The
trade-off is that I have to think about relationships and run migrations before I can write data, whereas a
document database lets me change the shape of documents as I go.

<!-- CODE-LISTING-START -->
## Source code listing

The working code lives in the api folder. The key files are repeated below so they can be read from this page without opening each folder. The file docs/postman_collection.json has a request for every endpoint.

### Week 2: Book API, auth and authorization

#### api/src/genres/genres.controller.ts

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { GenresService } from './genres.service';

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  // Anyone can read genres. Only librarians can change them.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LIBRARIAN)
  @Post()
  create(@Body() dto: CreateGenreDto) {
    return this.genresService.create(dto);
  }

  @Get()
  findAll() {
    return this.genresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.genresService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LIBRARIAN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGenreDto) {
    return this.genresService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LIBRARIAN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.genresService.remove(id);
  }
}
```

#### api/src/genres/genres.service.ts

```ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGenreDto) {
    try {
      return await this.prisma.genre.create({
        data: { name: dto.name, slug: dto.slug ?? slugify(dto.name), description: dto.description },
      });
    } catch (error) {
      throw this.translate(error);
    }
  }

  findAll() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    });
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: { books: { orderBy: { title: 'asc' } } },
    });
    if (!genre) throw new NotFoundException(`Genre ${id} not found`);
    return genre;
  }

  async update(id: number, dto: UpdateGenreDto) {
    await this.findOne(id);
    const data: Prisma.GenreUpdateInput = { ...dto };
    // Renaming without sending a slug keeps the old slug on purpose, so existing links do not break.
    try {
      return await this.prisma.genre.update({ where: { id }, data });
    } catch (error) {
      throw this.translate(error);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    try {
      return await this.prisma.genre.delete({ where: { id } });
    } catch (error) {
      throw this.translate(error);
    }
  }

  // Turns Prisma's database errors into proper HTTP errors.
  private translate(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return new ConflictException('A genre with that name or slug already exists');
      if (error.code === 'P2003') return new ConflictException('This genre still has books. Move or delete them first');
    }
    return error;
  }
}
```

#### api/src/genres/genres.module.ts

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';

@Module({
  imports: [AuthModule],
  controllers: [GenresController],
  providers: [GenresService],
  exports: [GenresService],
})
export class GenresModule {}
```

#### api/src/genres/dto/create-genre.dto.ts

```ts
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  // Optional. If it is left out, the service builds it from the name ("Science Fiction" -> "science-fiction").
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase letters, numbers and hyphens' })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

#### api/src/genres/dto/update-genre.dto.ts

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateGenreDto } from './create-genre.dto';

// Every field of CreateGenreDto becomes optional, and keeps its validators.
export class UpdateGenreDto extends PartialType(CreateGenreDto) {}
```

#### api/src/books/dto/create-book.dto.ts

```ts
import { IsInt, IsISBN, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  author!: string;

  // A valid ISBN-10 or ISBN-13. Hyphens are allowed.
  @IsISBN()
  isbn!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  totalCopies!: number;

  // Must be the id of an existing genre. The service checks that it exists.
  @IsInt()
  @Min(1)
  genreId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2100)
  publishedYear?: number;
}
```

#### api/src/books/dto/update-book.dto.ts

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';

// Every field of CreateBookDto becomes optional, and keeps its validators.
export class UpdateBookDto extends PartialType(CreateBookDto) {}
```

#### api/src/books/books.controller.ts

```ts
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // Public: GET /books?genreId=2&search=dune&page=1&limit=10
  @Get()
  findAll(
    @Query('genreId', new ParseIntPipe({ optional: true })) genreId?: number,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.booksService.findAll({ genreId, search, page, limit });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  // POST, PATCH and DELETE are guarded: a valid JWT, and the LIBRARIAN role.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LIBRARIAN)
  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LIBRARIAN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LIBRARIAN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
```

#### api/src/books/books.service.ts

```ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    await this.assertGenreExists(dto.genreId);
    const { totalCopies, ...rest } = dto;
    try {
      return await this.prisma.book.create({
        // A new book starts with every copy available.
        data: { ...rest, totalCopies, availableCopies: totalCopies },
        include: { genre: true },
      });
    } catch (error) {
      throw this.translate(error);
    }
  }

  // GET /books?genreId=&search=&page=&limit=
  async findAll(params: { genreId?: number; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));

    // Build the Prisma where clause from the optional filters.
    const where: Prisma.BookWhereInput = {};
    if (params.genreId !== undefined) {
      where.genreId = params.genreId;
    }
    const search = params.search?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    // skip/take do the pagination. count() uses the same where, so the total matches the filter.
    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        include: { genre: true },
      }),
      this.prisma.book.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({ where: { id }, include: { genre: true } });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    const book = await this.findOne(id);
    if (dto.genreId !== undefined) await this.assertGenreExists(dto.genreId);

    const data: Prisma.BookUncheckedUpdateInput = { ...dto };
    if (dto.totalCopies !== undefined) {
      // Keep the number of borrowed copies the same when the total changes.
      const borrowed = book.totalCopies - book.availableCopies;
      data.availableCopies = Math.max(0, dto.totalCopies - borrowed);
    }
    try {
      return await this.prisma.book.update({ where: { id }, data, include: { genre: true } });
    } catch (error) {
      throw this.translate(error);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.book.delete({ where: { id } });
  }

  private async assertGenreExists(genreId: number) {
    const genre = await this.prisma.genre.findUnique({ where: { id: genreId } });
    if (!genre) throw new NotFoundException(`Genre ${genreId} does not exist`);
  }

  private translate(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException('A book with that ISBN, or that title and author, already exists');
    }
    return error;
  }
}
```

#### api/src/books/books.module.ts

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [AuthModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
```

#### api/src/auth/auth.controller.ts

```ts
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Stretch: rate-limit the login route with @nestjs/throttler (5 attempts per minute per IP).
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

#### api/src/auth/auth.service.ts

```ts
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('That email is already registered');

    // The password is hashed with bcrypt before it is saved. The plain text is never stored.
    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // New accounts are always PATRON (the schema default). Only a librarian
    // can be created by editing the database or the seed script.
    const user = await this.prisma.user.create({
      data: { email, password, name: dto.name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return user;
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Same message for "no such user" and "wrong password" so the API does not
    // reveal which emails are registered.
    const passwordOk = user ? await bcrypt.compare(dto.password, user.password) : false;
    if (!user || !passwordOk) throw new UnauthorizedException('Invalid email or password');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwt.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
```

#### api/src/auth/auth.module.ts

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    // Stretch: the limits themselves are set per route with @Throttle().
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
```

#### api/src/auth/dto/register.dto.ts

```ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  // bcrypt only uses the first 72 bytes, so cap the length.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  // There is deliberately no `role` field. With whitelist: true the ValidationPipe
  // strips it from the body, so nobody can register themselves as a LIBRARIAN.
}
```

#### api/src/auth/dto/login.dto.ts

```ts
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}
```

#### api/src/auth/jwt.strategy.ts

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

// Verifies the Bearer token on every protected request, using the JWT_SECRET from .env.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Whatever this returns becomes req.user. We reload the user so a deleted account
  // stops working immediately and the role is always the current one from the database.
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    return { userId: user.id, email: user.email, role: user.role };
  }
}
```

#### api/src/auth/jwt-auth.guard.ts

```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Use as @UseGuards(JwtAuthGuard): rejects the request with 401 unless it carries a valid JWT.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### api/src/auth/roles.decorator.ts

```ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Marks a route with the roles allowed to call it, e.g. @Roles(Role.LIBRARIAN).
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

#### api/src/auth/roles.guard.ts

```ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

// Runs after JwtAuthGuard. Compares req.user.role with the roles named by @Roles().
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // A route without @Roles() is open to any authenticated user.
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    if (!req.user || !required.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to do that');
    }
    return true;
  }
}
```

#### api/src/users/users.controller.ts

```ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Stretch: GET /users/profile reads the authenticated user from the request with @Req().
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: { user: { userId: number } }) {
    return this.usersService.findProfile(req.user.userId);
  }
}
```

#### api/src/users/users.service.ts

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // `select` leaves the password hash out of the result.
  async findProfile(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
```

#### api/src/users/users.module.ts

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

#### api/src/app.module.ts

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { GenresModule } from './genres/genres.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Loads api/.env into the environment (JWT_SECRET, DATABASE_URL) for the whole app.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    GenresModule,
    BooksModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### api/src/main.ts

```ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // whitelist: true strips any property that is not declared on the DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

### Week 1: data layer

#### api/prisma/schema.prisma

```prisma
// Library Management System: data model
// Docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  PATRON
  LIBRARIAN
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  // bcrypt hash, never the plain password.
  password  String
  role      Role     @default(PATRON)
  createdAt DateTime @default(now())

  reviews Review[]
}

model Genre {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  // URL-friendly version of the name, e.g. "science-fiction".
  slug        String  @unique
  description String?

  books Book[]
}

model Book {
  id              Int      @id @default(autoincrement())
  title           String
  author          String
  isbn            String   @unique
  description     String?
  publishedYear   Int?
  totalCopies     Int      @default(1)
  availableCopies Int      @default(1)
  createdAt       DateTime @default(now())

  // Each book belongs to exactly one genre, stored as a foreign key.
  genreId Int
  genre   Genre @relation(fields: [genreId], references: [id])

  reviews Review[]

  @@unique([title, author])
  @@index([genreId])
}

// Stretch: a patron's rating and comment on a book.
model Review {
  id        Int      @id @default(autoincrement())
  rating    Int // 1 to 5, checked in application code
  comment   String?
  createdAt DateTime @default(now())

  bookId Int
  book   Book @relation(fields: [bookId], references: [id], onDelete: Cascade)

  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // One review per user per book.
  @@unique([bookId, userId])
  @@index([userId])
}
```

#### api/src/prisma/prisma.service.ts

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * A single shared Prisma client for the whole app.
 * It connects when Nest starts the module and disconnects on shutdown.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

#### api/src/prisma/prisma.module.ts

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global module: any feature module can inject PrismaService
 * without importing PrismaModule again.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

#### api/.env.example

```
# Copy this file to ".env" in the same folder and fill in your own values.
# The real .env file is ignored by git. Never commit real credentials.

# PostgreSQL connection string. The ?schema=library part keeps this app's
# tables in their own "library" schema.
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?schema=library"

# Secret used to sign and verify login tokens (JWTs). Use a long random string.
JWT_SECRET="replace-with-a-long-random-string"

# Optional. Port the API listens on (default 3000).
PORT=3000
```

<!-- CODE-LISTING-END -->
