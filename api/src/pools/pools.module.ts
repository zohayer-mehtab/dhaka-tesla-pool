import { Module } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { PoolsController } from './pools.controller';
import { RideRequestsModule } from '../ride-requests/ride-requests.module';

@Module({
  imports: [RideRequestsModule], 
  controllers: [PoolsController],
  providers: [PoolsService],
})
export class PoolsModule {}