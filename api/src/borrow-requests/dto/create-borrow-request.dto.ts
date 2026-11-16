import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

// Sent when a patron asks to borrow the books on their reading list.
export class CreateBorrowRequestDto {
  // The ids of the books to borrow. One borrow request is created for each book.
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  bookIds!: number[];
}
