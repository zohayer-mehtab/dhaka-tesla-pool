import { Controller, Get, Post, Body, UseGuards, Request, Patch, Param, SetMetadata } from '@nestjs/common';
import { RideRequestsService } from './ride-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole, RideRequestStatus } from '../common/enums';
import { RideStateMachineGuard } from './ride-state.guard';

@Controller('ride-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RideRequestsController {
  constructor(private readonly rideRequestsService: RideRequestsService) {}

  @Get(':id')
  @SetMetadata('roles', [UserRole.DRIVER, UserRole.PASSENGER])
  async getOneRequest(@Param('id') id: string) {
    return this.rideRequestsService.findOne(id);
  }

@Get()
  @SetMetadata('roles', [UserRole.DRIVER, UserRole.PASSENGER])
  async getAllRequests(@Request() req: any) {
    if (req.user.role === UserRole.PASSENGER) {
      return this.rideRequestsService.findAllByPassenger(req.user.id);
    }
    if (req.user.role === UserRole.DRIVER) {
      return this.rideRequestsService.findAllForDriver(req.user.id);
    }
    return this.rideRequestsService.findAll();
  }

  @Post()
  @SetMetadata('roles', [UserRole.PASSENGER])
  async createRequest(@Request() req: any, @Body() body: { pickupZone: string, destZone: string, seats: number }) {
    return this.rideRequestsService.create(req.user.id, body.pickupZone, body.destZone, body.seats);
  }

  @Patch(':id/status')
  @UseGuards(RideStateMachineGuard)
  @SetMetadata('roles', [UserRole.DRIVER, UserRole.PASSENGER])
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body('status') status: RideRequestStatus) {
    return this.rideRequestsService.updateStatus(id, status, req.user.id);
  }
}