export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
}

export enum PoolStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum RideRequestStatus {
  REQUESTED = 'REQUESTED',
  MATCHED = 'MATCHED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DhakaZone {
  BANANI = 'BANANI',
  GULSHAN = 'GULSHAN',
  MOHAKHALI = 'MOHAKHALI',
  DHANMONDI = 'DHANMONDI',
  MIRPUR = 'MIRPUR',
  UTTARA = 'UTTARA',
  FARMGATE = 'FARMGATE',
  BASHUNDHARA = 'BASHUNDHARA',
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  walletBalancePoysha?: number;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  poolId: string | null;
  pickupZone: DhakaZone;
  destZone: DhakaZone;
  seatsRequested: number;
  status: RideRequestStatus;
  fareAmountPoysha: number;
  createdAt: string;
  updatedAt: string;
  passenger?: User;
}

export interface Pool {
  id: string;
  vehicleId: string;
  status: PoolStatus;
  seatsCapacity: number;
  seatsTaken: number;
  createdAt: string;
  updatedAt: string;
}

export interface FareCalculation {
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  totalPoysha: number;
}