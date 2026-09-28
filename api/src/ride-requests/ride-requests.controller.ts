import { Controller, Post, Body, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { RideRequestsService } from './ride-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { UserRole, RideRequestStatus } from '../common/enums';
import { RideStateMachineGuard } from './ride-state.guard';

@Controller('ride-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RideRequestsController {
  constructor(private readonly rideRequestsService: RideRequestsService) {}

  @Post()
  @SetMetadata('roles', [UserRole.PASSENGER])
  async createRequest(@Request() req: any, @Body() body: { pickupZone: string, destZone: string, seats: number }) {
    return this.rideRequestsService.create(req.user.id, body.pickupZone, body.destZone, body.seats);
  }

  @Patch(':id/status')
  @UseGuards(RideStateMachineGuard)
  @SetMetadata('roles', [UserRole.DRIVER, UserRole.PASSENGER])
  async updateStatus(@Param('id') id: string, @Body('status') status: RideRequestStatus) {
    return this.rideRequestsService.updateStatus(id, status);
  }
}