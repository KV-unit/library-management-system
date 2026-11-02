import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// 5 genres
const genres = [
  { name: 'Fiction', description: 'Novels and story collections' },
  { name: 'Science Fiction', description: 'Speculative stories about science, technology and the future' },
  { name: 'Technology', description: 'Software engineering and computer science' },
  { name: 'History', description: 'Books about the past and how societies changed' },
  { name: 'Business & Productivity', description: 'Work, habits, strategy and decision making' },
];

// 20 books, 4 in each genre. `genre` is the genre name, looked up below.
const books = [
  // Fiction
  { title: 'Things Fall Apart', author: 'Chinua Achebe', publishedYear: 1958, copies: 3, genre: 'Fiction' },
  { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', publishedYear: 2006, copies: 2, genre: 'Fiction' },
  { title: 'Petals of Blood', author: "Ngũgĩ wa Thiong'o", publishedYear: 1977, copies: 2, genre: 'Fiction' },
  { title: 'Americanah', author: 'Chimamanda Ngozi Adichie', publishedYear: 2013, copies: 3, genre: 'Fiction' },
  // Science Fiction
  { title: 'Dune', author: 'Frank Herbert', publishedYear: 1965, copies: 4, genre: 'Science Fiction' },
  { title: 'Neuromancer', author: 'William Gibson', publishedYear: 1984, copies: 2, genre: 'Science Fiction' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', publishedYear: 1969, copies: 2, genre: 'Science Fiction' },
  { title: 'Foundation', author: 'Isaac Asimov', publishedYear: 1951, copies: 3, genre: 'Science Fiction' },
  // Technology
  { title: 'Clean Code', author: 'Robert C. Martin', publishedYear: 2008, copies: 3, genre: 'Technology' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt and David Thomas', publishedYear: 1999, copies: 2, genre: 'Technology' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', publishedYear: 2017, copies: 2, genre: 'Technology' },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen and others', publishedYear: 1990, copies: 2, genre: 'Technology' },
  // History
  { title: 'Sapiens', author: 'Yuval Noah Harari', publishedYear: 2011, copies: 3, genre: 'History' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', publishedYear: 1997, copies: 2, genre: 'History' },
  { title: 'The Wretched of the Earth', author: 'Frantz Fanon', publishedYear: 1961, copies: 1, genre: 'History' },
  { title: "A People's History of the United States", author: 'Howard Zinn', publishedYear: 1980, copies: 2, genre: 'History' },
  // Business & Productivity
  { title: 'Atomic Habits', author: 'James Clear', publishedYear: 2018, copies: 4, genre: 'Business & Productivity' },
  { title: 'Deep Work', author: 'Cal Newport', publishedYear: 2016, copies: 2, genre: 'Business & Productivity' },
  { title: 'The Lean Startup', author: 'Eric Ries', publishedYear: 2011, copies: 2, genre: 'Business & Productivity' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', publishedYear: 2011, copies: 3, genre: 'Business & Productivity' },
];

// Sample users (example.com addresses are reserved for examples)
const users = [
  { email: 'librarian@example.com', name: 'Lena Librarian', role: Role.LIBRARIAN },
  { email: 'amani@example.com', name: 'Amani Patron', role: Role.PATRON },
  { email: 'baraka@example.com', name: 'Baraka Patron', role: Role.PATRON },
  { email: 'chebet@example.com', name: 'Chebet Patron', role: Role.PATRON },
];

// A few sample reviews: [user email, book title, rating, comment]
const reviews: Array<[string, string, number, string]> = [
  ['amani@example.com', 'Things Fall Apart', 5, 'A classic that still feels fresh.'],
  ['baraka@example.com', 'Dune', 5, 'Huge world, great pacing.'],
  ['chebet@example.com', 'Clean Code', 4, 'Useful habits, a few dated examples.'],
  ['amani@example.com', 'Atomic Habits', 4, 'Practical and easy to apply.'],
];

async function main() {
  // Genres: upsert by unique name, so running the seed twice is safe.
  const genreIdByName = new Map<string, number>();
  for (const g of genres) {
    const row = await prisma.genre.upsert({
      where: { name: g.name },
      update: { description: g.description },
      create: g,
    });
    genreIdByName.set(g.name, row.id);
  }

  // Books: upsert by the unique (title, author) pair.
  const bookIdByTitle = new Map<string, number>();
  for (const { genre, ...book } of books) {
    const genreId = genreIdByName.get(genre);
    if (genreId === undefined) throw new Error(`Unknown genre: ${genre}`);
    const row = await prisma.book.upsert({
      where: { title_author: { title: book.title, author: book.author } },
      update: { publishedYear: book.publishedYear, copies: book.copies, genreId },
      create: { ...book, genreId },
    });
    bookIdByTitle.set(book.title, row.id);
  }

  // Users: upsert by unique email.
  const userIdByEmail = new Map<string, number>();
  for (const u of users) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: u,
    });
    userIdByEmail.set(u.email, row.id);
  }

  // Reviews: upsert by the unique (bookId, userId) pair.
  for (const [email, title, rating, comment] of reviews) {
    const userId = userIdByEmail.get(email);
    const bookId = bookIdByTitle.get(title);
    if (userId === undefined || bookId === undefined) throw new Error(`Bad review: ${email} / ${title}`);
    await prisma.review.upsert({
      where: { bookId_userId: { bookId, userId } },
      update: { rating, comment },
      create: { bookId, userId, rating, comment },
    });
  }

  const [g, b, u, r] = await Promise.all([
    prisma.genre.count(),
    prisma.book.count(),
    prisma.user.count(),
    prisma.review.count(),
  ]);
  console.log(`Seeded: ${g} genres, ${b} books, ${u} users, ${r} reviews`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
