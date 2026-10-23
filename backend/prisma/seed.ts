import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Role, Status } from '../src/generated/prisma/enums.js';
import { prisma } from '../src/utils/prisma.js';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin';
const ADMIN_FULL_NAME = 'Administrator';
const AUTH_SALT_ROUNDS = 10;

/**
 * Seeds or updates the default admin account with verified email credentials.
 * Ensures idempotency: updates existing credentials and admin profile if the email is already present.
 *
 * @returns Promise that resolves when seeding is complete.
 */
export async function SeedAdminAccount(): Promise<void> {
  console.log(`[Seed] Preparing admin account for email: ${ADMIN_EMAIL}...`);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, AUTH_SALT_ROUNDS);

  const adminUpsertPayload = {
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      status: Status.ACTIVE,
      admin: {
        upsert: {
          create: {
            fullName: ADMIN_FULL_NAME,
            status: Status.ACTIVE,
          },
          update: {
            status: Status.ACTIVE,
          },
        },
      },
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      status: Status.ACTIVE,
      admin: {
        create: {
          fullName: ADMIN_FULL_NAME,
          status: Status.ACTIVE,
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      isEmailVerified: true,
      status: true,
      admin: {
        select: {
          id: true,
          fullName: true,
          status: true,
        },
      },
    },
  };

  const account = await prisma.account.upsert(adminUpsertPayload);

  console.log('[Seed] Admin account successfully seeded:');
  console.log(`  - Account ID: ${account.id}`);
  console.log(`  - Email: ${account.email}`);
  console.log(`  - Role: ${account.role}`);
  console.log(`  - Email Verified: ${account.isEmailVerified}`);
  console.log(`  - Account Status: ${account.status}`);
  console.log(`  - Admin Profile ID: ${account.admin?.id ?? 'none'}`);
  console.log(`  - Admin Full Name: ${account.admin?.fullName ?? 'none'}`);
}

/**
 * Main seed execution wrapper with proper cleanup and error handling.
 */
async function Main(): Promise<void> {
  try {
    await SeedAdminAccount();
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

Main();
