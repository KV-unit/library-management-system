import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('That email is already registered');

    // The password is hashed with bcrypt before it is saved. The plain text is never stored.
    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // New accounts are always PATRON (the schema default). Only a librarian
    // can be created by editing the database or the seed script.
    const user = await this.prisma.user.create({
      data: { email, password, name: dto.name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return user;
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Same message for "no such user" and "wrong password" so the API does not
    // reveal which emails are registered.
    const passwordOk = user ? await bcrypt.compare(dto.password, user.password) : false;
    if (!user || !passwordOk) throw new UnauthorizedException('Invalid email or password');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwt.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
