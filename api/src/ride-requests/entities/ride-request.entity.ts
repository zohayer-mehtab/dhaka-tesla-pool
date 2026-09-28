import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Pool } from '../../pools/entities/pool.entity';
import { RideRequestStatus } from '../../common/enums';
import { ColumnBigIntTransformer } from '../../common/transformers';

@Entity('ride_requests')
export class RideRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'passenger_id' })
  passenger: User;

  @Column({ type: 'uuid', name: 'passenger_id' })
  passengerId: string;

  @ManyToOne(() => Pool, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pool_id' })
  pool: Pool | null;

  @Column({ type: 'uuid', name: 'pool_id', nullable: true })
  poolId: string | null;

  @Column({ type: 'varchar', name: 'pickup_zone' })
  pickupZone: string;

  @Column({ type: 'varchar', name: 'dest_zone' })
  destZone: string;

  @Column({ type: 'int', name: 'seats_requested' })
  seatsRequested: number;

  @Column({ type: 'enum', enum: RideRequestStatus, default: RideRequestStatus.REQUESTED })
  status: RideRequestStatus;

  @Column({
    type: 'bigint',
    name: 'fare_amount_poysha',
    default: 0,
    transformer: new ColumnBigIntTransformer(),
  })
  fareAmountPoysha: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}