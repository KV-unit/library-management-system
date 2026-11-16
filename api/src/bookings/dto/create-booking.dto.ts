import { IsInt, Matches, Min } from 'class-validator';

export class CreateBookingDto {
  // Must be the id of an existing space (GET /spaces lists them). The service checks that it exists.
  @IsInt()
  @Min(1)
  spaceId!: number;

  // A calendar date written as YYYY-MM-DD, e.g. 2026-11-20. The service also checks that it is a real date.
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be written as YYYY-MM-DD' })
  date!: string;

  // 24-hour times written as HH:MM, e.g. 09:30. Zero-padded, so they compare correctly as text.
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be a 24-hour time like 09:30' })
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be a 24-hour time like 10:30' })
  endTime!: string;
}
