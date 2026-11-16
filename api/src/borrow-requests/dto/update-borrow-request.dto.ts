import { BorrowStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

// Sent by a librarian: PENDING -> APPROVED or REJECTED, and APPROVED -> RETURNED.
export class UpdateBorrowRequestDto {
  @IsEnum(BorrowStatus)
  status!: BorrowStatus;
}
