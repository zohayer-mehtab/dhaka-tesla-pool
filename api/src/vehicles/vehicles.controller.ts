import { Controller, Patch, Body, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Patch('me/status')
  @SetMetadata('roles', [UserRole.DRIVER])
  async toggleOnline(@Request() req: any, @Body('isOnline') isOnline: boolean) {
    return this.vehiclesService.setOnlineStatus(req.user.id, isOnline);
  }
}