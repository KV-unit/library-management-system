import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Every sample account uses this password so you can log in from Postman.
// It is demo data for a local project, not a real secret.
const SAMPLE_PASSWORD = 'Password123!';

// 5 genres
const genres = [
  { name: 'Fiction', slug: 'fiction', description: 'Novels and story collections' },
  { name: 'Science Fiction', slug: 'science-fiction', description: 'Speculative stories about science, technology and the future' },
  { name: 'Technology', slug: 'technology', description: 'Software engineering and computer science' },
  { name: 'History', slug: 'history', description: 'Books about the past and how societies changed' },
  { name: 'Business & Productivity', slug: 'business-and-productivity', description: 'Work, habits, strategy and decision making' },
];

// 20 books, 4 in each genre. `genre` is the genre name, looked up below.
// The ISBNs are made-up sample numbers with a valid check digit, not real editions.
const books = [
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '9781000000016', publishedYear: 1958, totalCopies: 3, genre: 'Fiction', description: 'A Nigerian village faces the arrival of colonial rule.' },
  { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', isbn: '9781000000023', publishedYear: 2006, totalCopies: 2, genre: 'Fiction', description: 'Three lives are changed by the Biafran war.' },
  { title: 'Petals of Blood', author: "Ngũgĩ wa Thiong'o", isbn: '9781000000030', publishedYear: 1977, totalCopies: 2, genre: 'Fiction', description: 'Four people in a Kenyan village are caught up in a murder case.' },
  { title: 'Americanah', author: 'Chimamanda Ngozi Adichie', isbn: '9781000000047', publishedYear: 2013, totalCopies: 3, genre: 'Fiction', description: 'A young Nigerian woman moves to the United States and returns.' },
  { title: 'Dune', author: 'Frank Herbert', isbn: '9781000000054', publishedYear: 1965, totalCopies: 4, genre: 'Science Fiction', description: 'A desert planet, a spice, and a fight for control of both.' },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '9781000000061', publishedYear: 1984, totalCopies: 2, genre: 'Science Fiction', description: 'A washed-up hacker is hired for one last job in cyberspace.' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9781000000078', publishedYear: 1969, totalCopies: 2, genre: 'Science Fiction', description: 'An envoy visits a world where people have no fixed gender.' },
  { title: 'Foundation', author: 'Isaac Asimov', isbn: '9781000000085', publishedYear: 1951, totalCopies: 3, genre: 'Science Fiction', description: 'A mathematician predicts the fall of an empire and plans to shorten the dark age.' },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9781000000092', publishedYear: 2008, totalCopies: 3, genre: 'Technology', description: 'A handbook of agile software craftsmanship.' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt and David Thomas', isbn: '9781000000108', publishedYear: 1999, totalCopies: 2, genre: 'Technology', description: 'Practical advice for working programmers.' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '9781000000115', publishedYear: 2017, totalCopies: 2, genre: 'Technology', description: 'The big ideas behind reliable, scalable data systems.' },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen and others', isbn: '9781000000122', publishedYear: 1990, totalCopies: 2, genre: 'Technology', description: 'A comprehensive textbook on algorithms.' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9781000000139', publishedYear: 2011, totalCopies: 3, genre: 'History', description: 'A brief history of humankind.' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '9781000000146', publishedYear: 1997, totalCopies: 2, genre: 'History', description: 'Why some societies developed faster than others.' },
  { title: 'The Wretched of the Earth', author: 'Frantz Fanon', isbn: '9781000000153', publishedYear: 1961, totalCopies: 1, genre: 'History', description: 'An analysis of colonialism and decolonisation.' },
  { title: "A People's History of the United States", author: 'Howard Zinn', isbn: '9781000000160', publishedYear: 1980, totalCopies: 2, genre: 'History', description: 'American history told from below.' },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9781000000177', publishedYear: 2018, totalCopies: 4, genre: 'Business & Productivity', description: 'Small changes that build remarkable results.' },
  { title: 'Deep Work', author: 'Cal Newport', isbn: '9781000000184', publishedYear: 2016, totalCopies: 2, genre: 'Business & Productivity', description: 'Rules for focused success in a distracted world.' },
  { title: 'The Lean Startup', author: 'Eric Ries', isbn: '9781000000191', publishedYear: 2011, totalCopies: 2, genre: 'Business & Productivity', description: 'How to build a business with continuous innovation.' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9781000000207', publishedYear: 2011, totalCopies: 3, genre: 'Business & Productivity', description: 'Two systems that drive the way we think.' },
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
  // Genres: insert in one go. skipDuplicates makes a second run harmless,
  // because Genre.name and Genre.slug are unique.
  await prisma.genre.createMany({ data: genres, skipDuplicates: true });
  const genreRows = await prisma.genre.findMany();
  const genreIdByName = new Map<string, number>(genreRows.map((g): [string, number] => [g.name, g.id]));

  // Books: attach each book to its genre through genreId, then insert them all.
  // skipDuplicates relies on the unique isbn and the unique (title, author) pair.
  const bookData = books.map(({ genre, totalCopies, ...book }) => {
    const genreId = genreIdByName.get(genre);
    if (genreId === undefined) throw new Error(`Unknown genre: ${genre}`);
    return { ...book, totalCopies, availableCopies: totalCopies, genreId };
  });
  await prisma.book.createMany({ data: bookData, skipDuplicates: true });
  const bookRows = await prisma.book.findMany();
  const bookIdByTitle = new Map<string, number>(bookRows.map((b): [string, number] => [b.title, b.id]));

  // Users: the password is stored as a bcrypt hash, exactly like POST /auth/register does.
  const passwordHash = await bcrypt.hash(SAMPLE_PASSWORD, 10);
  const userIdByEmail = new Map<string, number>();
  for (const u of users) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { ...u, password: passwordHash },
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
  console.log(`Sample logins (password ${SAMPLE_PASSWORD}): librarian@example.com, amani@example.com`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
