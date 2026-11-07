# Library Management System

A library's book catalog and a secure API for it, built with **NestJS**, **Prisma** and **PostgreSQL**.
Patrons and librarians are users, books belong to genres, and patrons can review books.
Anyone can browse the catalog. Only librarians can add, change or remove books and genres.

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

`GET /books` returns `{ data, meta: { total, page, limit, totalPages } }`. For example,
`GET /books?genreId=2&search=dune&page=1&limit=5`. `page` starts at 1 and `limit` is capped at 100.

Send the token on protected routes as `Authorization: Bearer <access_token>`.
Status codes: 400 invalid data, 401 missing or bad token, 403 wrong role, 404 not found, 409 duplicate or genre still in use.

A ready-made request for every endpoint is in [`docs/postman_collection.json`](docs/postman_collection.json).
Import it into Postman, run `Login (librarian)` first, and the token is saved for the other requests.

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
