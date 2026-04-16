import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotosModule } from '../photos/photos.module';
import { Venda } from './venda.entity';
import { VendasController } from './vendas.controller';
import { VendasService } from './vendas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Venda], 'app'), PhotosModule],
  controllers: [VendasController],
  providers: [VendasService],
  exports: [VendasService],
})
export class VendasModule {}
