import { Module } from '@nestjs/common';
import { LookupsController } from './lookups.controller';
import { LookupsRepository } from './lookups.repository';

@Module({
  controllers: [LookupsController],
  providers: [LookupsRepository],
  exports: [LookupsRepository],
})
export class LookupsModule {}
