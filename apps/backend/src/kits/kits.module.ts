import { Module } from '@nestjs/common';
import { KitsController } from './kits.controller';
import { KitsRepository } from './kits.repository';

@Module({
  controllers: [KitsController],
  providers: [KitsRepository],
  exports: [KitsRepository],
})
export class KitsModule {}
