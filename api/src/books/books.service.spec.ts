import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BooksService } from './books.service';

describe('BooksService', () => {
  const prisma = {
    book: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    genre: { findUnique: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const service = new BooksService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.book.findMany.mockResolvedValue([]);
    prisma.book.count.mockResolvedValue(0);
  });

  describe('findAll', () => {
    it('uses no filter and the first page of 10 by default', async () => {
      await service.findAll({});
      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 0, take: 10 }),
      );
    });

    it('builds the where clause from genreId and search, and applies skip/take', async () => {
      await service.findAll({ genreId: 2, search: 'dune', page: 3, limit: 5 });
      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            genreId: 2,
            OR: [
              { title: { contains: 'dune', mode: 'insensitive' } },
              { author: { contains: 'dune', mode: 'insensitive' } },
            ],
          },
          skip: 10,
          take: 5,
        }),
      );
    });

    it('caps limit at 100 and returns paging metadata', async () => {
      prisma.book.count.mockResolvedValue(250);
      const result = await service.findAll({ limit: 1000 });
      expect(prisma.book.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
      expect(result.meta).toEqual({ total: 250, page: 1, limit: 100, totalPages: 3 });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for an unknown id', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', totalCopies: 4, genreId: 2 };

    it('rejects a genreId that does not exist', async () => {
      prisma.genre.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(prisma.book.create).not.toHaveBeenCalled();
    });

    it('starts with every copy available', async () => {
      prisma.genre.findUnique.mockResolvedValue({ id: 2 });
      prisma.book.create.mockResolvedValue({ id: 1 });
      await service.create(dto);
      expect(prisma.book.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ totalCopies: 4, availableCopies: 4 }) }),
      );
    });
  });
});
