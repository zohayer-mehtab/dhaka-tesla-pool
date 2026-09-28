import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Check, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { PoolStatus } from '../../common/enums';

@Entity('pools')
@Check('"seats_taken" >= 0')
@Check('"seats_taken" <= "seats_capacity"')
@Index('IDX_ACTIVE_POOL_PER_VEHICLE', ['vehicleId'], { 
  unique: true, 
  where: "status IN ('OPEN', 'LOCKED', 'IN_PROGRESS')" 
})
export class Pool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId: string;

  @Column({ type: 'enum', enum: PoolStatus, default: PoolStatus.OPEN })
  status: PoolStatus;

  @Column({ type: 'int', name: 'seats_capacity' })
  seatsCapacity: number;

  @Column({ type: 'int', name: 'seats_taken', default: 0 })
  seatsTaken: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}