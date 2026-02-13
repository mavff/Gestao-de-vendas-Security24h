import { Module } from '@nestjs/common';
import { ProspectsController } from './prospects.controller';
import { ProspectsRepository } from './prospects.repository';

@Module({
  controllers: [ProspectsController],
  providers: [ProspectsRepository],
  exports: [ProspectsRepository],
})
export class ProspectsModule {}
