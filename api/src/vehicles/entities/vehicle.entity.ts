import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ type: 'uuid', name: 'driver_id', unique: true })
  driverId: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'varchar', length: 255, name: 'label' })
  label: string;

  @Column({ type: 'boolean', name: 'is_online', default: false })
  isOnline: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}