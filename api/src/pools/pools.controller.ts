import { Controller, Post, Param, UseGuards, SetMetadata, Request } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';

@Controller('pools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Post(':poolId/match/:rideRequestId')
  @SetMetadata('roles', [UserRole.DRIVER])
  async matchPassenger(
    @Param('poolId') poolId: string,
    @Param('rideRequestId') rideRequestId: string
  ) {
    
    return this.poolsService.matchPassengerToPool(rideRequestId, poolId);
  }

  @Post()
  @SetMetadata('roles', [UserRole.DRIVER])
  async createPool(@Request() req: any) {
    return this.poolsService.createPool(req.user.id);
  }
}