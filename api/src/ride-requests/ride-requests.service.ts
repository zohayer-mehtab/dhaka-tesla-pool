import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DhakaZone, RideRequestStatus } from '../common/enums';
import { RideRequest } from './entities/ride-request.entity';
import { FARE_CONFIG, distanceMetres } from './fare.config';

export interface FareBreakdown {
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  totalPoysha: number;
}

@Injectable()
export class RideRequestsService {
  constructor(
    @InjectRepository(RideRequest)
    private readonly rideRequestRepo: Repository<RideRequest>,
  ) {}

  async create(passengerId: string, pickupZone: string, destZone: string, seats: number): Promise<RideRequest> {
    const { totalPoysha } = this.calculateFare(
      pickupZone as DhakaZone,
      destZone as DhakaZone,
      seats,
      false, // Not pooled upon initial request
    );

    const ride = this.rideRequestRepo.create({
      passengerId,
      pickupZone,
      destZone,
      seatsRequested: seats,
      status: RideRequestStatus.REQUESTED,
      fareAmountPoysha: totalPoysha,
    });

    return this.rideRequestRepo.save(ride);
  }

  async updateStatus(id: string, status: RideRequestStatus): Promise<RideRequest> {
    await this.rideRequestRepo.update(id, { status });
    const updated = await this.rideRequestRepo.findOne({ where: { id } });
    if (!updated) throw new BadRequestException('Ride request not found after update');
    return updated;
  }

  calculateFare(
    pickup: DhakaZone,
    dest: DhakaZone,
    seats: number,
    isPooled: boolean,
  ): FareBreakdown {
    if (!Number.isInteger(seats) || seats < 1) {
      throw new BadRequestException('Seats must be a positive integer');
    }
    if (pickup === dest) {
      throw new BadRequestException('Pickup and destination zones must differ');
    }

    const metres = distanceMetres(pickup, dest);
    const baseFarePoysha = FARE_CONFIG.BASE_FARE_POYSHA * seats;
    const distanceChargePoysha = Math.floor((metres * FARE_CONFIG.PER_KM_RATE_POYSHA) / 1000) * seats;
    const gross = baseFarePoysha + distanceChargePoysha;
    
    const poolDiscountPoysha = isPooled 
      ? Math.floor(gross * (FARE_CONFIG.POOL_DISCOUNT_PERCENT / 100)) 
      : 0;

    return {
      baseFarePoysha,
      distanceChargePoysha,
      poolDiscountPoysha,
      totalPoysha: gross - poolDiscountPoysha,
    };
  }

  async repricePoolMembers(poolId: string, manager: EntityManager): Promise<void> {
    const members = await manager.find(RideRequest, { where: { poolId } });
    const active = members.filter((r) => r.status !== RideRequestStatus.CANCELLED);
    
    const isPooled = active.length >= 2;
    
    const repricableMembers = active.filter(
      (m) => m.status === RideRequestStatus.MATCHED
    );

    for (const request of repricableMembers) {
      const { totalPoysha } = this.calculateFare(
        request.pickupZone as DhakaZone,
        request.destZone as DhakaZone,
        request.seatsRequested,
        isPooled,
      );
      
      console.log(`Repricing ${request.id}: ${totalPoysha} poysha`);
      request.fareAmountPoysha = totalPoysha;
    }

    if (repricableMembers.length > 0) {
      await manager.save(RideRequest, repricableMembers);
    }
  }
}