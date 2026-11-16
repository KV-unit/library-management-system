import { Body, Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BorrowStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BorrowRequestsService } from './borrow-requests.service';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { UpdateBorrowRequestDto } from './dto/update-borrow-request.dto';

// Every route needs a valid JWT. The routes marked @Roles(Role.LIBRARIAN) are the admin routes.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('borrow-requests')
export class BorrowRequestsController {
  constructor(private readonly borrowRequestsService: BorrowRequestsService) {}

  // Any logged-in user: ask to borrow the books on their reading list.
  @Post()
  create(@Req() req: { user: { userId: number } }, @Body() dto: CreateBorrowRequestDto) {
    return this.borrowRequestsService.create(req.user.userId, dto);
  }

  // Any logged-in user: their own requests.
  @Get('mine')
  findMine(@Req() req: { user: { userId: number } }) {
    return this.borrowRequestsService.findMine(req.user.userId);
  }

  // Librarians: every request, e.g. GET /borrow-requests?status=PENDING
  @Roles(Role.LIBRARIAN)
  @Get()
  findAll(@Query('status', new ParseEnumPipe(BorrowStatus, { optional: true })) status?: BorrowStatus) {
    return this.borrowRequestsService.findAll(status);
  }

  // Librarians: approve, reject or mark returned. A late return gets its fineAmount here.
  @Roles(Role.LIBRARIAN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBorrowRequestDto) {
    return this.borrowRequestsService.updateStatus(id, dto);
  }
}
