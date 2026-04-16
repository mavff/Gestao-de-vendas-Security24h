import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vistoria } from './vistoria.entity';
import { VistoriasController } from './vistorias.controller';
import { VistoriasService } from './vistorias.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vistoria], 'app')],
  controllers: [VistoriasController],
  providers: [VistoriasService],
  exports: [VistoriasService],
})
export class VistoriasModule {}
