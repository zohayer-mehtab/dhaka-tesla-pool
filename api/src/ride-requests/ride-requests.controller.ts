import { Controller } from '@nestjs/common';
import { RideRequestsService } from './ride-requests.service';

@Controller('ride-requests')
export class RideRequestsController {
  constructor(private readonly rideRequestsService: RideRequestsService) {}
}
