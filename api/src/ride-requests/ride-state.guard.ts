import { Injectable, CanActivate, ExecutionContext, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RideRequest } from './entities/ride-request.entity';
import { RideRequestStatus } from '../common/enums';

@Injectable()
export class RideStateMachineGuard implements CanActivate {
  private readonly validTransitions: Record<RideRequestStatus, RideRequestStatus[]> = {
    [RideRequestStatus.REQUESTED]: [RideRequestStatus.MATCHED, RideRequestStatus.CANCELLED],
    [RideRequestStatus.MATCHED]: [RideRequestStatus.DRIVER_ARRIVED, RideRequestStatus.CANCELLED],
    [RideRequestStatus.DRIVER_ARRIVED]: [RideRequestStatus.STARTED, RideRequestStatus.CANCELLED],
    [RideRequestStatus.STARTED]: [RideRequestStatus.COMPLETED],
    [RideRequestStatus.COMPLETED]: [],
    [RideRequestStatus.CANCELLED]: [],
  };

  constructor(@InjectRepository(RideRequest) private repo: Repository<RideRequest>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rideId = request.params.id;
    const targetStatus = request.body.status as RideRequestStatus;

    if (!targetStatus) return true;

    const ride = await this.repo.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride request not found');

    const allowedNextStates = this.validTransitions[ride.status];
    if (!allowedNextStates.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid state transition from ${ride.status} to ${targetStatus}`
      );
    }
    return true;
  }
}