import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SpacesController } from './spaces.controller';

@Module({
  imports: [AuthModule],
  controllers: [BookingsController, SpacesController],
  providers: [BookingsService],
})
export class BookingsModule {}
