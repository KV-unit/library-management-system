import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Use as @UseGuards(JwtAuthGuard): rejects the request with 401 unless it carries a valid JWT.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
