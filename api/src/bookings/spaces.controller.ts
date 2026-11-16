import { Controller, Get } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Public: the booking form fills its dropdown from this list.
  @Get()
  findAll() {
    return this.bookingsService.findSpaces();
  }
}
