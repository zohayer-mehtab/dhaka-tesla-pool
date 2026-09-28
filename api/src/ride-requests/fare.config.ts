import { DhakaZone } from '../common/enums';

export const FARE_CONFIG = {
  BASE_FARE_POYSHA: 3000,       // 30.00 BDT per seat
  PER_KM_RATE_POYSHA: 1500,     // 15.00 BDT per km
  POOL_DISCOUNT_PERCENT: 20,    // 20% off
};

// Map keys dynamically ensure symmetrical lookups
const key = (a: DhakaZone, b: DhakaZone): string => [a, b].sort().join(':');
const Z = DhakaZone;


const PAIRS: Array<[DhakaZone, DhakaZone, number]> = [
  [Z.BANANI, Z.GULSHAN, 3000],
  [Z.BANANI, Z.MOHAKHALI, 2000],
  [Z.BANANI, Z.DHANMONDI, 8000],
  [Z.BANANI, Z.MIRPUR, 9000],
  [Z.BANANI, Z.UTTARA, 10000],
  [Z.BANANI, Z.FARMGATE, 5000],
  [Z.BANANI, Z.BASHUNDHARA, 5500],
  [Z.GULSHAN, Z.MOHAKHALI, 3500],
  [Z.GULSHAN, Z.DHANMONDI, 9500],
  [Z.GULSHAN, Z.MIRPUR, 11000],
  [Z.GULSHAN, Z.UTTARA, 9000],
  [Z.GULSHAN, Z.FARMGATE, 6500],
  [Z.GULSHAN, Z.BASHUNDHARA, 3000],
  [Z.MOHAKHALI, Z.DHANMONDI, 7500],
  [Z.MOHAKHALI, Z.MIRPUR, 9500],
  [Z.MOHAKHALI, Z.UTTARA, 10500],
  [Z.MOHAKHALI, Z.FARMGATE, 4000],
  [Z.MOHAKHALI, Z.BASHUNDHARA, 5500],
  [Z.DHANMONDI, Z.MIRPUR, 8500],
  [Z.DHANMONDI, Z.UTTARA, 15000],
  [Z.DHANMONDI, Z.FARMGATE, 3500],
  [Z.DHANMONDI, Z.BASHUNDHARA, 11000],
  [Z.MIRPUR, Z.UTTARA, 12000],
  [Z.MIRPUR, Z.FARMGATE, 8000],
  [Z.MIRPUR, Z.BASHUNDHARA, 13000],
  [Z.UTTARA, Z.FARMGATE, 13000],
  [Z.UTTARA, Z.BASHUNDHARA, 8000],
  [Z.FARMGATE, Z.BASHUNDHARA, 7000],
];

const DISTANCE_METRES = new Map<string, number>(
  PAIRS.map(([a, b, d]) => [key(a, b), d])
);

export function distanceMetres(a: DhakaZone, b: DhakaZone): number {
  if (a === b) return 0;
  return DISTANCE_METRES.get(key(a, b)) || 5000;
}