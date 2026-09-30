import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RideRequest } from './ride-request.entity';
import { User } from '../../users/entities/user.entity';
import { RideRequestStatus } from '../../common/enums';

@Entity('ride_status_history')
export class RideStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RideRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_request_id' })
  rideRequest: RideRequest;

  @Column({ type: 'uuid', name: 'ride_request_id' })
  rideRequestId: string;

  @Column({ type: 'enum', enum: RideRequestStatus, nullable: true })
  fromStatus: RideRequestStatus;

  @Column({ type: 'enum', enum: RideRequestStatus })
  toStatus: RideRequestStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedBy: User;

  @Column({ type: 'uuid', name: 'changed_by', nullable: true })
  changedById: string;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}