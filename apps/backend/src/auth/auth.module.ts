import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SenhaUser } from '../database/senha-user.entity';
import { AppUsersModule } from '../app-users/app-users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({})
export class AuthModule {
  static register(): DynamicModule {
    const imports: DynamicModule['imports'] = [
      PassportModule,
      JwtModule.register({}),
      AppUsersModule,
    ];
    // Só carrega o repositório do ERP quando o SQL Server está configurado.
    // Sem isso, master (.env) e app_users (Postgres/SQLite) continuam funcionando.
    if (process.env.SQL_SERVER_HOST) {
      imports.push(TypeOrmModule.forFeature([SenhaUser]));
    }
    return {
      module: AuthModule,
      imports,
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy, RolesGuard],
      exports: [RolesGuard],
    };
  }
}
