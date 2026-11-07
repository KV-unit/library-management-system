import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';

// Every field of CreateBookDto becomes optional, and keeps its validators.
export class UpdateBookDto extends PartialType(CreateBookDto) {}
