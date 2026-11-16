import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, BookingsService } from './bookings.service';

describe('BookingsService', () => {
  const prisma = {
    space: { findUnique: jest.fn(), findMany: jest.fn() },
    booking: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new BookingsService(prisma as unknown as PrismaService);

  const patron: AuthUser = { userId: 5, email: 'p@example.com', role: Role.PATRON };
  const librarian: AuthUser = { userId: 1, email: 'l@example.com', role: Role.LIBRARIAN };
  const space = { id: 2, name: 'Study Room B', capacity: 6 };
  const dto = { spaceId: 2, date: '2999-01-15', startTime: '10:00', endTime: '11:00' };
  const stored = {
    id: 9,
    spaceId: 2,
    space,
    userId: 5,
    date: new Date('2999-01-15T00:00:00.000Z'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'CONFIRMED',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Runs the callback straight away with the same fake client, like an interactive transaction.
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => Promise<unknown>) => callback(prisma));
    prisma.space.findUnique.mockResolvedValue(space);
    prisma.booking.findFirst.mockResolvedValue(null);
    prisma.booking.create.mockResolvedValue(stored);
  });

  describe('create', () => {
    it('saves the booking for the logged-in user and returns the date as YYYY-MM-DD', async () => {
      const result = await service.create(5, dto);
      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { spaceId: 2, userId: 5, date: new Date('2999-01-15T00:00:00.000Z'), startTime: '10:00', endTime: '11:00' },
        }),
      );
      expect(result).toMatchObject({ id: 9, date: '2999-01-15', startTime: '10:00', endTime: '11:00', status: 'CONFIRMED' });
    });

    it('looks for a CONFIRMED booking that overlaps: starts before our end and ends after our start', async () => {
      await service.create(5, dto);
      expect(prisma.booking.findFirst).toHaveBeenCalledWith({
        where: {
          spaceId: 2,
          date: new Date('2999-01-15T00:00:00.000Z'),
          status: 'CONFIRMED',
          startTime: { lt: '11:00' },
          endTime: { gt: '10:00' },
        },
      });
    });

    it('runs the check and the insert in a serializable transaction', async () => {
      await service.create(5, dto);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    });

    it('answers 409 when the slot overlaps an existing booking, and saves nothing', async () => {
      prisma.booking.findFirst.mockResolvedValue(stored);
      await expect(service.create(5, dto)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('answers 409 when the database stops one of two simultaneous bookings (P2034)', async () => {
      prisma.booking.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('write conflict', { code: 'P2034', clientVersion: 'test' }),
      );
      await expect(service.create(5, dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('answers 400 when the end time is not after the start time', async () => {
      await expect(service.create(5, { ...dto, startTime: '11:00', endTime: '11:00' })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.create(5, { ...dto, startTime: '12:00', endTime: '09:00' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('answers 400 for a date that does not exist', async () => {
      await expect(service.create(5, { ...dto, date: '2999-02-31' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('answers 400 for a date in the past', async () => {
      await expect(service.create(5, { ...dto, date: '2001-01-01' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('answers 404 when the space does not exist', async () => {
      prisma.space.findUnique.mockResolvedValue(null);
      await expect(service.create(5, dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findMine', () => {
    it('lists only the logged-in user\'s own bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      await service.findMine(5);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 5 } }));
    });
  });

  describe('findAll (admin)', () => {
    it('lists every booking when no filter is given', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      await service.findAll({});
      expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('filters by space and by day', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      await service.findAll({ spaceId: 2, date: '2999-01-15' });
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { spaceId: 2, date: new Date('2999-01-15T00:00:00.000Z') } }),
      );
    });

    it('answers 400 for a date that is not real', async () => {
      await expect(service.findAll({ date: '2999-02-31' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('marks the owner\'s booking CANCELLED', async () => {
      prisma.booking.findUnique.mockResolvedValue(stored);
      prisma.booking.update.mockResolvedValue({ ...stored, status: 'CANCELLED' });
      const result = await service.cancel(9, patron);
      expect(prisma.booking.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'CANCELLED' } }));
      expect(result.status).toBe('CANCELLED');
    });

    it('lets a librarian cancel anyone\'s booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(stored);
      prisma.booking.update.mockResolvedValue({ ...stored, status: 'CANCELLED' });
      await expect(service.cancel(9, librarian)).resolves.toMatchObject({ status: 'CANCELLED' });
    });

    it('answers 403 when a patron cancels someone else\'s booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...stored, userId: 99 });
      await expect(service.cancel(9, patron)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('answers 404 when the booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.cancel(9, patron)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
