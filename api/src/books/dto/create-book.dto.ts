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
