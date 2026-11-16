import { ConflictException, NotFoundException } from '@nestjs/common';
import { BorrowStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BorrowRequestsService, FINE_PER_DAY, LOAN_DAYS } from './borrow-requests.service';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('BorrowRequestsService', () => {
  const prisma = {
    book: { findMany: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    borrowRequest: { findMany: jest.fn(), findUnique: jest.fn(), createMany: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new BorrowRequestsService(prisma as unknown as PrismaService);
  let openRequests: unknown[] = [];

  const row = (overrides: Record<string, unknown> = {}) => ({
    id: 4,
    status: 'PENDING',
    requestedAt: new Date('2026-03-01T10:00:00.000Z'),
    borrowedAt: null,
    dueDate: null,
    returnedAt: null,
    fineAmount: 0,
    bookId: 7,
    userId: 5,
    book: { id: 7, title: 'Dune', author: 'Frank Herbert' },
    user: { id: 5, email: 'p@example.com', name: 'Pat' },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Runs the callback straight away with the same fake client, like an interactive transaction.
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => Promise<unknown>) => callback(prisma));
    prisma.book.findMany.mockResolvedValue([{ id: 7 }, { id: 8 }]);
    // The first findMany in create() looks for open requests (a status filter with `in`); the second reads back the new ones.
    openRequests = [];
    prisma.borrowRequest.findMany.mockImplementation(({ where }: { where: { bookId?: { in: number[] }; status?: unknown } }) =>
      where.status && typeof where.status === 'object'
        ? Promise.resolve(openRequests)
        : Promise.resolve((where.bookId?.in ?? []).map((bookId) => row({ id: 100 + bookId, bookId }))),
    );
    prisma.borrowRequest.createMany.mockResolvedValue({ count: 0 });
    prisma.book.updateMany.mockResolvedValue({ count: 1 });
    prisma.book.update.mockResolvedValue({});
    prisma.borrowRequest.update.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve(row(data)));
  });

  describe('create', () => {
    it('creates one PENDING request for each book on the reading list, for the logged-in user', async () => {
      const result = await service.create(5, { bookIds: [7, 8] });
      expect(prisma.borrowRequest.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.borrowRequest.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 5, bookId: 7 },
          { userId: 5, bookId: 8 },
        ],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ status: 'PENDING', fineAmount: 0 });
    });

    it('ignores a book id that is listed twice', async () => {
      prisma.book.findMany.mockResolvedValue([{ id: 7 }]);
      await service.create(5, { bookIds: [7, 7] });
      expect(prisma.borrowRequest.createMany).toHaveBeenCalledWith({ data: [{ userId: 5, bookId: 7 }] });
    });

    it('gives the transaction extra time, so it also works over a slow connection', async () => {
      prisma.book.findMany.mockResolvedValue([{ id: 7 }]);
      await service.create(5, { bookIds: [7] });
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ timeout: 30000, maxWait: 10000 }));
    });

    it('answers 404 and creates nothing when a book does not exist', async () => {
      prisma.book.findMany.mockResolvedValue([{ id: 7 }]);
      await expect(service.create(5, { bookIds: [7, 999] })).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.borrowRequest.createMany).not.toHaveBeenCalled();
    });

    it('answers 409 when the patron already has an open request for one of the books', async () => {
      openRequests = [{ book: { title: 'Dune' } }];
      await expect(service.create(5, { bookIds: [7, 8] })).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.borrowRequest.createMany).not.toHaveBeenCalled();
    });

    it('answers 409 when the database stops one of two simultaneous requests (P2034)', async () => {
      prisma.book.findMany.mockResolvedValue([{ id: 7 }]);
      prisma.borrowRequest.createMany.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('write conflict', { code: 'P2034', clientVersion: 'test' }),
      );
      await expect(service.create(5, { bookIds: [7] })).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('approves a PENDING request: takes a copy off the shelf and sets a due date', async () => {
      prisma.borrowRequest.findUnique.mockResolvedValue(row());
      const before = Date.now();
      await service.updateStatus(4, { status: BorrowStatus.APPROVED });
      expect(prisma.book.updateMany).toHaveBeenCalledWith({
        where: { id: 7, availableCopies: { gt: 0 } },
        data: { availableCopies: { decrement: 1 } },
      });
      const data = prisma.borrowRequest.update.mock.calls[0][0].data;
      expect(data.status).toBe('APPROVED');
      const lent = data.dueDate.getTime() - data.borrowedAt.getTime();
      expect(lent).toBe(LOAN_DAYS * DAY_MS);
      expect(data.borrowedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('answers 409 when no copy is available to lend', async () => {
      prisma.borrowRequest.findUnique.mockResolvedValue(row());
      prisma.book.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.updateStatus(4, { status: BorrowStatus.APPROVED })).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.borrowRequest.update).not.toHaveBeenCalled();
    });

    it('rejects a PENDING request without touching the copy count', async () => {
      prisma.borrowRequest.findUnique.mockResolvedValue(row());
      const result = await service.updateStatus(4, { status: BorrowStatus.REJECTED });
      expect(result.status).toBe('REJECTED');
      expect(prisma.book.updateMany).not.toHaveBeenCalled();
      expect(prisma.book.update).not.toHaveBeenCalled();
    });

    it('marks an on-time return RETURNED, puts the copy back and charges no fine', async () => {
      const due = new Date(Date.now() + 3 * DAY_MS);
      prisma.borrowRequest.findUnique.mockResolvedValue(row({ status: 'APPROVED', dueDate: due }));
      const result = await service.updateStatus(4, { status: BorrowStatus.RETURNED });
      expect(prisma.book.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { availableCopies: { increment: 1 } } });
      expect(result.fineAmount).toBe(0);
      expect(result.status).toBe('RETURNED');
    });

    it('works out the fine when the book comes back late', async () => {
      const due = new Date(Date.now() - 5 * DAY_MS);
      prisma.borrowRequest.findUnique.mockResolvedValue(row({ status: 'APPROVED', dueDate: due }));
      const result = await service.updateStatus(4, { status: BorrowStatus.RETURNED });
      expect(result.fineAmount).toBe(5 * FINE_PER_DAY);
      const data = prisma.borrowRequest.update.mock.calls[0][0].data;
      expect(data.fineAmount).toBe(2.5);
      expect(data.returnedAt).toBeInstanceOf(Date);
    });

    it('answers 409 for a change that is not allowed (RETURNED straight from PENDING, or a second return)', async () => {
      prisma.borrowRequest.findUnique.mockResolvedValue(row());
      await expect(service.updateStatus(4, { status: BorrowStatus.RETURNED })).rejects.toBeInstanceOf(ConflictException);
      prisma.borrowRequest.findUnique.mockResolvedValue(row({ status: 'RETURNED' }));
      await expect(service.updateStatus(4, { status: BorrowStatus.RETURNED })).rejects.toBeInstanceOf(ConflictException);
      prisma.borrowRequest.findUnique.mockResolvedValue(row({ status: 'REJECTED' }));
      await expect(service.updateStatus(4, { status: BorrowStatus.APPROVED })).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.borrowRequest.update).not.toHaveBeenCalled();
    });

    it('answers 404 when the request does not exist', async () => {
      prisma.borrowRequest.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(4, { status: BorrowStatus.APPROVED })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('lists', () => {
    it('findMine returns only the user\'s own requests', async () => {
      await service.findMine(5);
      expect(prisma.borrowRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 5 } }));
    });

    it('findAll returns everything, or only one status', async () => {
      await service.findAll();
      expect(prisma.borrowRequest.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: {} }));
      await service.findAll(BorrowStatus.PENDING);
      expect(prisma.borrowRequest.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { status: 'PENDING' } }));
    });
  });
});
