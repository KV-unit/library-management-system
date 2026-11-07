import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  // bcrypt only uses the first 72 bytes, so cap the length.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  // There is deliberately no `role` field. With whitelist: true the ValidationPipe
  // strips it from the body, so nobody can register themselves as a LIBRARIAN.
}
