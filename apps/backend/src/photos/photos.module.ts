import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUsersModule } from '../app-users/app-users.module';
import { Photo } from './photo.entity';
import { PhotosController } from './photos.controller';
import { PhotosMigrationService } from './photos-migration.service';
import { PhotosService } from './photos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo], 'app'), AppUsersModule],
  controllers: [PhotosController],
  providers: [PhotosService, PhotosMigrationService],
  exports: [PhotosService],
})
export class PhotosModule {}
