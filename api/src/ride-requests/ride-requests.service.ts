import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DhakaZone, RideRequestStatus } from '../common/enums';
import { RideRequest } from './entities/ride-request.entity';
import { FARE_CONFIG, distanceMetres } from './fare.config';
import { RideStatusHistory } from './entities/ride-status-history.entity';

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
    private readonly dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<RideRequest> {
    const request = await this.rideRequestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Ride request with ID ${id} not found`);
    }
    return request;
  }

async findAll(forDriver: boolean = false): Promise<RideRequest[]> {
    return this.rideRequestRepo.find({
      // Drivers should only see actionable requests
      where: forDriver ? { status: RideRequestStatus.REQUESTED } : {},
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllByPassenger(passengerId: string): Promise<RideRequest[]> {
    return this.rideRequestRepo.find({
      where: { passengerId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

async findAllForDriver(driverId: string): Promise<RideRequest[]> {
    const vehicle = await this.dataSource.query(`SELECT id FROM vehicles WHERE driver_id = $1`, [driverId]);
    let poolId = null;
    if (vehicle && vehicle.length > 0) {
      const pool = await this.dataSource.query(
        `SELECT id FROM pools WHERE vehicle_id = $1 AND status IN ('OPEN', 'LOCKED', 'IN_PROGRESS')`,
        [vehicle[0].id]
      );
      if (pool && pool.length > 0) {
        poolId = pool[0].id;
      }
    }
    const qb = this.rideRequestRepo.createQueryBuilder('request');
    if (poolId) {
      qb.where('request.status = :reqStatus', { reqStatus: RideRequestStatus.REQUESTED })
        .orWhere('request.pool_id = :poolId', { poolId });
    } else {
      qb.where('request.status = :reqStatus', { reqStatus: RideRequestStatus.REQUESTED });
    }
    return qb.orderBy('request.createdAt', 'DESC').getMany();
  }

  async create(passengerId: string, pickupZone: string, destZone: string, seats: number): Promise<RideRequest> {
    const parsedSeats = parseInt(seats as any, 10);
    if (isNaN(parsedSeats) || parsedSeats < 1 || parsedSeats > 3) {
      throw new BadRequestException('Requested seats must be an integer between 1 and 3.');
    }

    const { totalPoysha } = this.calculateFare(
      pickupZone as DhakaZone,
      destZone as DhakaZone,
      parsedSeats, 
      false, 
    );

    const ride = this.rideRequestRepo.create({
      passengerId,
      pickupZone,
      destZone,
      seatsRequested: parsedSeats,
      status: RideRequestStatus.REQUESTED,
      fareAmountPoysha: totalPoysha,
    });
    
    return this.rideRequestRepo.save(ride);
  }

  

  async updateStatus(id: string, targetStatus: RideRequestStatus, changedById: string): Promise<RideRequest> {
    return this.dataSource.transaction(async (manager) => {
      if (targetStatus === RideRequestStatus.MATCHED) {
        throw new BadRequestException(
          'Manual MATCHED transitions are forbidden. You must use POST /pools/:poolId/match/:rideRequestId to securely allocate seats.'
        );
      }
      // 1. Pessimistic lock on the ride request to prevent race conditions during state change
      const ride = await manager.findOne(RideRequest, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ride) throw new NotFoundException('Ride request not found');

      const fromStatus = ride.status;
      ride.status = targetStatus;

      // 2. Cancellation Reversal: Return seats to the pool
      if (targetStatus === RideRequestStatus.CANCELLED && ride.poolId) {
        await manager.query(
          `UPDATE pools 
           SET seats_taken = seats_taken - $1, updated_at = NOW() 
           WHERE id = $2`,
          [ride.seatsRequested, ride.poolId]
        );
      }

      // 3. Financial Settlement: Deduct wallet on completion
      if (targetStatus === RideRequestStatus.COMPLETED) {
        const updateRes = await manager.query(
          `UPDATE users 
           SET wallet_balance_poysha = wallet_balance_poysha - $1, updated_at = NOW() 
           WHERE id = $2 AND wallet_balance_poysha >= $1 
           RETURNING id`,
          [ride.fareAmountPoysha, ride.passengerId]
        );

        const rows = Array.isArray(updateRes) && Array.isArray(updateRes[0]) ? updateRes[0] : updateRes;
        if (!rows || rows.length === 0) {
          throw new BadRequestException('Insufficient wallet balance to complete ride settlement');
        }
      }

      // 4. Save updated ride
      await manager.save(ride);

      // 5. Append Audit Trail
      const history = manager.create(RideStatusHistory, {
        rideRequestId: ride.id,
        fromStatus,
        toStatus: targetStatus,
        changedById,
      });
      await manager.save(history);

      return ride;
    });
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