import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

// The user that JwtStrategy puts on req.user.
export interface AuthUser {
  userId: number;
  email: string;
  role: Role;
}

type BookingWithSpace = Prisma.BookingGetPayload<{ include: { space: true } }>;

const DAY_MS = 24 * 60 * 60 * 1000;

// The shape sent to the client: the date as plain YYYY-MM-DD instead of a full timestamp.
function toResponse(booking: BookingWithSpace) {
  return {
    id: booking.id,
    spaceId: booking.spaceId,
    space: { id: booking.space.id, name: booking.space.name, capacity: booking.space.capacity },
    date: booking.date.toISOString().slice(0, 10),
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    createdAt: booking.createdAt,
  };
}

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /spaces
  findSpaces() {
    return this.prisma.space.findMany({ orderBy: { id: 'asc' } });
  }

  // POST /bookings: the booking belongs to the logged-in user (never to a userId from the body).
  async create(userId: number, dto: CreateBookingDto) {
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    // The date is stored as a plain calendar date (midnight UTC), so it never shifts to another day.
    const date = new Date(`${dto.date}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dto.date) {
      throw new BadRequestException('date is not a real calendar date');
    }
    // One day of slack, because the visitor's "today" can differ from the server's UTC date.
    const startOfTodayUtc = Date.now() - (Date.now() % DAY_MS);
    if (date.getTime() < startOfTodayUtc - DAY_MS) {
      throw new BadRequestException('You cannot book a date in the past');
    }

    const space = await this.prisma.space.findUnique({ where: { id: dto.spaceId } });
    if (!space) throw new NotFoundException(`Space ${dto.spaceId} not found`);

    try {
      // The check and the insert run in one SERIALIZABLE transaction. Without it, two requests for the
      // same slot could both pass the check before either one is saved, and the space would be double-booked.
      const created = await this.prisma.$transaction(
        async (tx) => {
          // Two slots overlap when each one starts before the other ends. A slot that ends at 10:00
          // does not clash with one that starts at 10:00.
          const clash = await tx.booking.findFirst({
            where: {
              spaceId: dto.spaceId,
              date,
              status: BookingStatus.CONFIRMED,
              startTime: { lt: dto.endTime },
              endTime: { gt: dto.startTime },
            },
          });
          if (clash) throw new ConflictException('That space is already booked for part of that time');

          return tx.booking.create({
            data: { spaceId: dto.spaceId, userId, date, startTime: dto.startTime, endTime: dto.endTime },
            include: { space: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return toResponse(created);
    } catch (error) {
      // P2034: the database stopped one of two simultaneous bookings. The slot was taken by the other one.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('That space was just booked by someone else. Please pick another time.');
      }
      throw error;
    }
  }

  // GET /bookings: a patron sees their own bookings, a librarian sees everyone's.
  async findAll(user: AuthUser) {
    const where: Prisma.BookingWhereInput = user.role === Role.LIBRARIAN ? {} : { userId: user.userId };
    const rows = await this.prisma.booking.findMany({
      where,
      include: { space: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toResponse);
  }

  // DELETE /bookings/:id: marks the booking CANCELLED, which frees the slot. Owner or librarian only.
  async cancel(id: number, user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { space: true } });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    if (booking.userId !== user.userId && user.role !== Role.LIBRARIAN) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }
    if (booking.status === BookingStatus.CANCELLED) return toResponse(booking);

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: { space: true },
    });
    return toResponse(updated);
  }
}
