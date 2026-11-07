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
