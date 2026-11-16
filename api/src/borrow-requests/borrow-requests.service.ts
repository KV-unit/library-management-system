import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BorrowStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TRANSACTION_TIMEOUTS } from '../prisma/transaction-options';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { UpdateBorrowRequestDto } from './dto/update-borrow-request.dto';
import { calculateFine } from './fine-calculator';

// The library's rules. A book is lent for 14 days; each day late costs 0.50.
export const LOAN_DAYS = 14;
export const FINE_PER_DAY = 0.5;

const DAY_MS = 24 * 60 * 60 * 1000;

// What the API shows about the book and the patron, without the password hash and the like.
const INCLUDE = {
  book: { select: { id: true, title: true, author: true } },
  user: { select: { id: true, email: true, name: true } },
} satisfies Prisma.BorrowRequestInclude;

type BorrowRequestRow = Prisma.BorrowRequestGetPayload<{ include: typeof INCLUDE }>;

// Which status a request may move to from each status.
const TRANSITIONS: Record<BorrowStatus, BorrowStatus[]> = {
  [BorrowStatus.PENDING]: [BorrowStatus.APPROVED, BorrowStatus.REJECTED],
  [BorrowStatus.APPROVED]: [BorrowStatus.RETURNED],
  [BorrowStatus.REJECTED]: [],
  [BorrowStatus.RETURNED]: [],
};

// fineAmount is a Decimal in the database. Send it as an ordinary number.
function toResponse(row: BorrowRequestRow) {
  return {
    id: row.id,
    status: row.status,
    requestedAt: row.requestedAt,
    borrowedAt: row.borrowedAt,
    dueDate: row.dueDate,
    returnedAt: row.returnedAt,
    fineAmount: Number(row.fineAmount),
    book: row.book,
    user: row.user,
  };
}

@Injectable()
export class BorrowRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /borrow-requests: one PENDING request for every book on the patron's reading list.
  async create(userId: number, dto: CreateBorrowRequestDto) {
    const bookIds = [...new Set(dto.bookIds)];

    const books = await this.prisma.book.findMany({ where: { id: { in: bookIds } }, select: { id: true } });
    if (books.length !== bookIds.length) {
      const found = new Set(books.map((book) => book.id));
      const missing = bookIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Book ${missing.join(', ')} not found`);
    }

    try {
      // All the requests are saved together or not at all.
      const created = await this.prisma.$transaction(
        async (tx) => {
          const open = await tx.borrowRequest.findMany({
            where: {
              userId,
              bookId: { in: bookIds },
              status: { in: [BorrowStatus.PENDING, BorrowStatus.APPROVED] },
            },
            include: { book: { select: { title: true } } },
          });
          if (open.length > 0) {
            const titles = open.map((request) => request.book.title).join(', ');
            throw new ConflictException(`You already have an open request for: ${titles}`);
          }

          // Two queries instead of one per book: save them all, then read them back with their book and user.
          // No PENDING or APPROVED request existed for these books (checked above, inside this transaction),
          // so the PENDING ones found now are exactly the ones just saved.
          await tx.borrowRequest.createMany({ data: bookIds.map((bookId) => ({ userId, bookId })) });
          return tx.borrowRequest.findMany({
            where: { userId, bookId: { in: bookIds }, status: BorrowStatus.PENDING },
            include: INCLUDE,
            orderBy: { id: 'asc' },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, ...TRANSACTION_TIMEOUTS },
      );
      return created.map(toResponse);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Your request clashed with another one made at the same moment. Please try again.');
      }
      throw error;
    }
  }

  // GET /borrow-requests/mine
  async findMine(userId: number) {
    const rows = await this.prisma.borrowRequest.findMany({
      where: { userId },
      include: INCLUDE,
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(toResponse);
  }

  // GET /borrow-requests?status=PENDING (librarians): every request, optionally for one status.
  async findAll(status?: BorrowStatus) {
    const rows = await this.prisma.borrowRequest.findMany({
      where: status ? { status } : {},
      include: INCLUDE,
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(toResponse);
  }

  // PATCH /borrow-requests/:id (librarians): approve, reject or mark returned.
  async updateStatus(id: number, dto: UpdateBorrowRequestDto) {
    // Everything happens in one transaction, so the copy count and the request never disagree.
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.borrowRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException(`Borrow request ${id} not found`);

      const next = dto.status;
      if (!TRANSITIONS[request.status].includes(next)) {
        throw new ConflictException(`A ${request.status} request cannot be changed to ${next}`);
      }

      const now = new Date();
      let data: Prisma.BorrowRequestUpdateInput;

      if (next === BorrowStatus.APPROVED) {
        // Take one copy off the shelf, but only if there is one. updateMany with a condition is atomic,
        // so two librarians approving the last copy cannot both succeed.
        const taken = await tx.book.updateMany({
          where: { id: request.bookId, availableCopies: { gt: 0 } },
          data: { availableCopies: { decrement: 1 } },
        });
        if (taken.count === 0) throw new ConflictException('No copies of that book are available right now');
        data = { status: next, borrowedAt: now, dueDate: new Date(now.getTime() + LOAN_DAYS * DAY_MS) };
      } else if (next === BorrowStatus.RETURNED) {
        // The book goes back on the shelf, and the fine is worked out from the due date.
        await tx.book.update({ where: { id: request.bookId }, data: { availableCopies: { increment: 1 } } });
        const fine = request.dueDate ? calculateFine(request.dueDate, now, FINE_PER_DAY) : 0;
        data = { status: next, returnedAt: now, fineAmount: fine };
      } else {
        data = { status: next };
      }

      const updated = await tx.borrowRequest.update({ where: { id }, data, include: INCLUDE });
      return toResponse(updated);
    }, TRANSACTION_TIMEOUTS);
  }
}
