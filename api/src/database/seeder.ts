import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { UserRole } from '../common/enums';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import * as bcrypt from 'bcryptjs';

const PASSENGER_WALLET_POYSHA = 100_000;

interface SeedUser {
  name: string;
  email: string;
  role: UserRole;
  walletBalancePoysha: number;
}

const CAST: SeedUser[] = [
  { name: 'Jashim', email: 'jashim@teslapool.test', role: UserRole.DRIVER, walletBalancePoysha: 0 },
  { name: 'Nusrat', email: 'nusrat@teslapool.test', role: UserRole.PASSENGER, walletBalancePoysha: PASSENGER_WALLET_POYSHA },
  { name: 'Rafiq', email: 'rafiq@teslapool.test', role: UserRole.PASSENGER, walletBalancePoysha: PASSENGER_WALLET_POYSHA },
  { name: 'Shirin', email: 'shirin@teslapool.test', role: UserRole.PASSENGER, walletBalancePoysha: PASSENGER_WALLET_POYSHA },
];

const BULLET = { label: 'Bullet', capacity: 3 };

async function seed() {
  await AppDataSource.initialize();
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');

  if (reset && process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_RESET !== 'true') {
    throw new Error('Refusing --reset in production without SEED_ALLOW_RESET=true');
  }

  try {
    await AppDataSource.transaction(async (manager) => {
      if (reset) {
        console.log('Truncating tables...');
        await manager.query(`TRUNCATE TABLE "ride_requests", "pools", "vehicles", "users" CASCADE`);
      }

      const users: Record<string, User> = {};
      
      
      const defaultPasswordHash = await bcrypt.hash('password123', 10);

      for (const seedData of CAST) {
        let user = await manager.findOne(User, { where: { email: seedData.email } });
        if (!user) {
          
          user = manager.create(User, { ...seedData, passwordHash: defaultPasswordHash });
          await manager.save(user);
          console.log(`Created user: ${seedData.name}`);
        } else {
          console.log(`User exists: ${seedData.name}`);
        }
        users[seedData.name] = user;
      }

      const jashim = users['Jashim'];
      if (jashim) {
        let vehicle = await manager.findOne(Vehicle, { where: { driverId: jashim.id } });
        if (!vehicle) {
          vehicle = manager.create(Vehicle, { 
            driverId: jashim.id, 
            label: BULLET.label, 
            capacity: BULLET.capacity, 
            isOnline: false 
          });
          await manager.save(vehicle);
          console.log(`Created vehicle: ${BULLET.label}`);
        } else {
          console.log(`Vehicle exists: ${vehicle.label}`);
        }
      }
    });
    console.log(`\nSeed complete.`);
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});