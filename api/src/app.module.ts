import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PoolsModule } from './pools/pools.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RideRequestsModule } from './ride-requests/ride-requests.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PoolsModule, UsersModule, VehiclesModule, RideRequestsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
