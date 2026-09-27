import { Module } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { PoolsController } from './pools.controller';

@Module({
  controllers: [PoolsController],
  providers: [PoolsService],
})
export class PoolsModule {}
