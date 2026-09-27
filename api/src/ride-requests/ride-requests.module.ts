import { Module } from '@nestjs/common';
import { RideRequestsService } from './ride-requests.service';
import { RideRequestsController } from './ride-requests.controller';

@Module({
  controllers: [RideRequestsController],
  providers: [RideRequestsService],
})
export class RideRequestsModule {}
