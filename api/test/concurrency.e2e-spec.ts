import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { PoolsService } from '../src/pools/pools.service';
import { UserRole, PoolStatus, RideRequestStatus } from '../src/common/enums';

describe('PoolsService CAS Concurrency (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let poolsService: PoolsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    poolsService = app.get(PoolsService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should process concurrent bookings strictly using CAS logic (preventing overbooking)', async () => {
    // 1. Setup Data: 1 Pool, Capacity 3, Currently Taken: 2 (1 seat left)
    const [driver] = await dataSource.query(`INSERT INTO users (role, name, email) VALUES ($1, 'Jashim', 'jashim_test@teslapool.test') RETURNING id`, [UserRole.DRIVER]);
    const [vehicle] = await dataSource.query(`INSERT INTO vehicles (driver_id, capacity, label) VALUES ($1, 3, 'Bullet') RETURNING id`, [driver.id]);
    const [pool] = await dataSource.query(`INSERT INTO pools (vehicle_id, status, seats_capacity, seats_taken) VALUES ($1, $2, 3, 2) RETURNING id`, [vehicle.id, PoolStatus.OPEN]);

    // 2. Setup Data: Nusrat and Shirin ride requests
    const [nusrat] = await dataSource.query(`INSERT INTO users (role, name, email) VALUES ($1, 'Nusrat', 'nusrat_test@teslapool.test') RETURNING id`, [UserRole.PASSENGER]);
    const [shirin] = await dataSource.query(`INSERT INTO users (role, name, email) VALUES ($1, 'Shirin', 'shirin_test@teslapool.test') RETURNING id`, [UserRole.PASSENGER]);
    
    const [nusratReq] = await dataSource.query(`INSERT INTO ride_requests (passenger_id, pickup_zone, dest_zone, seats_requested, status) VALUES ($1, 'BANANI', 'MOHAKHALI', 1, $2) RETURNING id`, [nusrat.id, RideRequestStatus.REQUESTED]);
    const [shirinReq] = await dataSource.query(`INSERT INTO ride_requests (passenger_id, pickup_zone, dest_zone, seats_requested, status) VALUES ($1, 'BANANI', 'GULSHAN', 1, $2) RETURNING id`, [shirin.id, RideRequestStatus.REQUESTED]);

    // 3. Fire simultaneous requests for the 1 remaining seat
    const results = await Promise.allSettled([
      poolsService.matchPassengerToPool(nusratReq.id, pool.id),
      poolsService.matchPassengerToPool(shirinReq.id, pool.id)
    ]);

    // 4. Assertions
    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    // Exactly one succeeds, exactly one fails with a ConflictException
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0]['reason']?.constructor?.name).toBe('ConflictException');

    // Verify DB integrity: capacity must not exceed 3
    const updatedPool = await dataSource.query(`SELECT seats_taken FROM pools WHERE id = $1`, [pool.id]);
    expect(updatedPool[0].seats_taken).toBe(3);
  });
});