import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Stretch: GET /users/profile reads the authenticated user from the request with @Req().
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: { user: { userId: number } }) {
    return this.usersService.findProfile(req.user.userId);
  }
}
