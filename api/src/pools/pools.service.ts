import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { PoolStatus, RideRequestStatus } from '../common/enums';
import { RideRequest } from '../ride-requests/entities/ride-request.entity';
import { RideRequestsService } from '../ride-requests/ride-requests.service';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Pool } from './entities/pool.entity';

@Injectable()
export class PoolsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rideRequestsService: RideRequestsService,
  ) {}

  async matchPassengerToPool(
    rideRequestId: string,
    poolId: string,
  ): Promise<{ rideRequestId: string; poolId: string; seatsTaken: number }> {
    return this.dataSource.transaction(async (manager) => {
      
      const request = await manager.findOne(RideRequest, { 
        where: { id: rideRequestId } 
      });
      
      if (!request) {
        throw new NotFoundException('Ride request not found');
      }
      
      if (request.status !== RideRequestStatus.REQUESTED || request.poolId) {
        throw new ConflictException('Ride request is not awaiting a match');
      }

      
      const updateResult = await manager.query(
        `UPDATE pools
           SET seats_taken = seats_taken + $1,
               updated_at = NOW()
         WHERE id = $2
           AND status IN ('OPEN', 'LOCKED')
           AND seats_taken + $1 <= seats_capacity
         RETURNING id, seats_taken`,
        [request.seatsRequested, poolId]
      );

      
      const rows = Array.isArray(updateResult) && Array.isArray(updateResult[0]) 
        ? updateResult[0] 
        : updateResult;

      if (!rows || rows.length === 0) {
        const poolCheck = await manager.query(
          `SELECT id FROM pools WHERE id = $1`, 
          [poolId]
        );
        
        if (!poolCheck || poolCheck.length === 0) {
          throw new NotFoundException('Pool not found');
        }
        
        throw new ConflictException('Seat no longer available or pool is closed');
      }

      
      const seatsTaken = Number(rows[0].seats_taken);

      const existingMembers = await manager.query(
        `SELECT DISTINCT pickup_zone 
           FROM ride_requests 
          WHERE pool_id = $1 
            AND status IN ('MATCHED', 'DRIVER_ARRIVED', 'STARTED')`,
        [poolId]
      );

      const hasZoneConflict = existingMembers.some(
        (member: { pickup_zone: string }) => member.pickup_zone !== request.pickupZone
      );

      if (hasZoneConflict) {
        throw new UnprocessableEntityException(
          'Pickup zone incompatible with existing passengers in this pool'
        );
      }

      
      const requestUpdate = await manager.query(
        `UPDATE ride_requests
            SET pool_id = $1,
                status = $2,
                updated_at = NOW()
          WHERE id = $3
            AND status = 'REQUESTED'
            AND pool_id IS NULL
          RETURNING id`,
        [poolId, RideRequestStatus.MATCHED, rideRequestId]
      );

      const updatedRows = Array.isArray(requestUpdate) && Array.isArray(requestUpdate[0]) 
        ? requestUpdate[0] 
        : requestUpdate;

      if (!updatedRows || updatedRows.length === 0) {
        throw new ConflictException('Ride request was already matched or cancelled');
      }

      
      await this.rideRequestsService.repricePoolMembers(poolId, manager);

      return {
        rideRequestId,
        poolId,
        seatsTaken,
      };
    });
  }

  async createPool(driverId: string): Promise<Pool> {
    return this.dataSource.transaction(async (manager) => {
      const vehicle = await manager.findOne(Vehicle, { where: { driverId } });
      if (!vehicle) {
        throw new NotFoundException('No vehicle registered to this driver');
      }

      if (!vehicle.isOnline) {
        throw new ConflictException('Vehicle must be online to start a pool');
      }

      const existingPool = await manager.findOne(Pool, {
        where: { 
          vehicleId: vehicle.id, 
          status: In([PoolStatus.OPEN, PoolStatus.LOCKED, PoolStatus.IN_PROGRESS]) 
        }
      });

      // REFACTOR: If a pool already exists, return it to rehydrate the frontend 
      // instead of throwing a 409 Conflict. This self-heals local storage loss.
      if (existingPool) {
        return existingPool;
      }

      const pool = manager.create(Pool, {
        vehicleId: vehicle.id,
        status: PoolStatus.OPEN,
        seatsCapacity: vehicle.capacity,
        seatsTaken: 0,
      });

      return manager.save(pool);
    });
  }
}