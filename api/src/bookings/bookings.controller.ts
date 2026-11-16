import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser, BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

// Every route here needs a valid JWT. The user comes from the token, not from the request body.
// GET /bookings/all is an admin route: it also needs the LIBRARIAN role.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto);
  }

  // The logged-in user's own bookings.
  @Get()
  findMine(@Req() req: { user: AuthUser }) {
    return this.bookingsService.findMine(req.user.userId);
  }

  // Librarians: every booking, e.g. GET /bookings/all?spaceId=2&date=2026-11-20
  @Roles(Role.LIBRARIAN)
  @Get('all')
  findAll(
    @Query('spaceId', new ParseIntPipe({ optional: true })) spaceId?: number,
    @Query('date') date?: string,
  ) {
    return this.bookingsService.findAll({ spaceId, date });
  }

  @Delete(':id')
  cancel(@Req() req: { user: AuthUser }, @Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.cancel(id, req.user);
  }
}
