import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async setOnlineStatus(driverId: string, isOnline: boolean): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { driverId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found for driver');
    
    vehicle.isOnline = isOnline;
    return this.vehicleRepo.save(vehicle);
  }
}