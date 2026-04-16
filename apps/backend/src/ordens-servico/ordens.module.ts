import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdemServico } from './ordem.entity';
import { OrdensController } from './ordens.controller';
import { OrdensService } from './ordens.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrdemServico], 'app')],
  controllers: [OrdensController],
  providers: [OrdensService],
  exports: [OrdensService],
})
export class OrdensModule {}
