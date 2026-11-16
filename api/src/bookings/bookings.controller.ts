import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

// Every route here needs a valid JWT. The user comes from the token, not from the request body.
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: { user: AuthUser }) {
    return this.bookingsService.findAll(req.user);
  }

  @Delete(':id')
  cancel(@Req() req: { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.cancel(id, req.user);
  }
}
