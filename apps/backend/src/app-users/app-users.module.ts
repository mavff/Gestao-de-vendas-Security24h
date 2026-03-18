import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUser } from './app-user.entity';
import { AppKv } from './app-kv.entity';
import { AppUsersController } from './app-users.controller';
import { AppKvController } from './app-kv.controller';
import { AppUsersService } from './app-users.service';
import { AppKvService } from './app-kv.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppUser, AppKv], 'sqlite')],
  controllers: [AppUsersController, AppKvController],
  providers: [AppUsersService, AppKvService],
  exports: [AppUsersService, AppKvService],
})
export class AppUsersModule {}
