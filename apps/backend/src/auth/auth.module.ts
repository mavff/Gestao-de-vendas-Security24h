import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SenhaUser } from '../database/senha-user.entity';
import { AppUsersModule } from '../app-users/app-users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [PassportModule, JwtModule.register({}), TypeOrmModule.forFeature([SenhaUser]), AppUsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [RolesGuard]
})
export class AuthModule {}
