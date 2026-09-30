import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideRequestsService } from './ride-requests.service';
import { RideRequestsController } from './ride-requests.controller';
import { RideRequest } from './entities/ride-request.entity';
import { RideStatusHistory } from './entities/ride-status-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RideRequest, RideStatusHistory])],
  controllers: [RideRequestsController],
  providers: [RideRequestsService],
  exports: [RideRequestsService],
})
export class RideRequestsModule {}