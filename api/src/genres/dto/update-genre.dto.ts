import { PartialType } from '@nestjs/mapped-types';
import { CreateGenreDto } from './create-genre.dto';

// Every field of CreateGenreDto becomes optional, and keeps its validators.
export class UpdateGenreDto extends PartialType(CreateGenreDto) {}
