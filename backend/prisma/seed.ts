import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Industry, Prisma } from '../src/generated/prisma/client.js';
import { Role, Status } from '../src/generated/prisma/enums.js';
import { prisma } from '../src/utils/prisma.js';

const AUTH_SALT_ROUNDS = 10;

// Admin credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin';
const ADMIN_FULL_NAME = 'Administrator';

// Brand credentials
const BRAND_EMAIL = 'brandklipday@gmail.com';
const BRAND_PASSWORD = 'klipday123';
const BRAND_COMPANY_NAME = 'Brand Klipday';
const BRAND_PHONE_NUMBER = '6281234567890';
const BRAND_INDUSTRY = Industry.TECHNOLOGY;

// Creator credentials
const CREATOR_EMAIL = 'creatorklipday@gmail.com';
const CREATOR_PASSWORD = 'klipday123';
const CREATOR_FULL_NAME = 'Creator Klipday';
const CREATOR_PHONE_NUMBER = '6281234567891';

/**
 * Seeds or updates the default admin account with verified email credentials.
 * Ensures idempotency: updates existing credentials and admin profile if the email is already present.
 *
 * @returns Promise that resolves when admin seeding is complete.
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
            fullName: ADMIN_FULL_NAME,
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
 * Seeds or updates the default brand account with verified email, brand profile, and wallet.
 * Ensures idempotency: updates existing credentials, profile, and wallet if the email is already present.
 *
 * @returns Promise that resolves when brand seeding is complete.
 */
export async function SeedBrandAccount(): Promise<void> {
  console.log(`[Seed] Preparing brand account for email: ${BRAND_EMAIL}...`);

  const passwordHash = await bcrypt.hash(BRAND_PASSWORD, AUTH_SALT_ROUNDS);

  const brandUpsertPayload = {
    where: { email: BRAND_EMAIL },
    update: {
      passwordHash,
      role: Role.BRAND,
      isEmailVerified: true,
      status: Status.ACTIVE,
      brand: {
        upsert: {
          create: {
            companyName: BRAND_COMPANY_NAME,
            phoneNumber: BRAND_PHONE_NUMBER,
            industry: BRAND_INDUSTRY,
            status: Status.ACTIVE,
          },
          update: {
            companyName: BRAND_COMPANY_NAME,
            phoneNumber: BRAND_PHONE_NUMBER,
            industry: BRAND_INDUSTRY,
            status: Status.ACTIVE,
          },
        },
      },
      wallet: {
        upsert: {
          create: {
            balance: new Prisma.Decimal(0),
            status: Status.ACTIVE,
          },
          update: {
            status: Status.ACTIVE,
          },
        },
      },
    },
    create: {
      email: BRAND_EMAIL,
      passwordHash,
      role: Role.BRAND,
      isEmailVerified: true,
      status: Status.ACTIVE,
      brand: {
        create: {
          companyName: BRAND_COMPANY_NAME,
          phoneNumber: BRAND_PHONE_NUMBER,
          industry: BRAND_INDUSTRY,
          status: Status.ACTIVE,
        },
      },
      wallet: {
        create: {
          balance: new Prisma.Decimal(0),
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
      brand: {
        select: {
          id: true,
          companyName: true,
          status: true,
        },
      },
      wallet: {
        select: {
          id: true,
          balance: true,
          status: true,
        },
      },
    },
  };

  const account = await prisma.account.upsert(brandUpsertPayload);

  console.log('[Seed] Brand account successfully seeded:');
  console.log(`  - Account ID: ${account.id}`);
  console.log(`  - Email: ${account.email}`);
  console.log(`  - Role: ${account.role}`);
  console.log(`  - Email Verified: ${account.isEmailVerified}`);
  console.log(`  - Account Status: ${account.status}`);
  console.log(`  - Brand Company Name: ${account.brand?.companyName ?? 'none'}`);
  console.log(`  - Wallet Balance: ${account.wallet?.balance ?? '0'}`);
}

/**
 * Seeds or updates the default creator account with verified email, creator profile, and wallet.
 * Ensures idempotency: updates existing credentials, profile, and wallet if the email is already present.
 *
 * @returns Promise that resolves when creator seeding is complete.
 */
export async function SeedCreatorAccount(): Promise<void> {
  console.log(`[Seed] Preparing creator account for email: ${CREATOR_EMAIL}...`);

  const passwordHash = await bcrypt.hash(CREATOR_PASSWORD, AUTH_SALT_ROUNDS);

  const creatorUpsertPayload = {
    where: { email: CREATOR_EMAIL },
    update: {
      passwordHash,
      role: Role.CREATOR,
      isEmailVerified: true,
      status: Status.ACTIVE,
      creator: {
        upsert: {
          create: {
            fullName: CREATOR_FULL_NAME,
            phoneNumber: CREATOR_PHONE_NUMBER,
            status: Status.ACTIVE,
          },
          update: {
            fullName: CREATOR_FULL_NAME,
            phoneNumber: CREATOR_PHONE_NUMBER,
            status: Status.ACTIVE,
          },
        },
      },
      wallet: {
        upsert: {
          create: {
            balance: new Prisma.Decimal(0),
            status: Status.ACTIVE,
          },
          update: {
            status: Status.ACTIVE,
          },
        },
      },
    },
    create: {
      email: CREATOR_EMAIL,
      passwordHash,
      role: Role.CREATOR,
      isEmailVerified: true,
      status: Status.ACTIVE,
      creator: {
        create: {
          fullName: CREATOR_FULL_NAME,
          phoneNumber: CREATOR_PHONE_NUMBER,
          status: Status.ACTIVE,
        },
      },
      wallet: {
        create: {
          balance: new Prisma.Decimal(0),
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
      creator: {
        select: {
          id: true,
          fullName: true,
          status: true,
        },
      },
      wallet: {
        select: {
          id: true,
          balance: true,
          status: true,
        },
      },
    },
  };

  const account = await prisma.account.upsert(creatorUpsertPayload);

  console.log('[Seed] Creator account successfully seeded:');
  console.log(`  - Account ID: ${account.id}`);
  console.log(`  - Email: ${account.email}`);
  console.log(`  - Role: ${account.role}`);
  console.log(`  - Email Verified: ${account.isEmailVerified}`);
  console.log(`  - Account Status: ${account.status}`);
  console.log(`  - Creator Full Name: ${account.creator?.fullName ?? 'none'}`);
  console.log(`  - Wallet Balance: ${account.wallet?.balance ?? '0'}`);
}

/**
 * Main seed execution wrapper with proper cleanup and error handling.
 *
 * @returns Promise that resolves when all accounts are seeded.
 */
async function Main(): Promise<void> {
  try {
    await SeedAdminAccount();
    await SeedBrandAccount();
    await SeedCreatorAccount();
    console.log('[Seed] All default development accounts seeded successfully.');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

Main();
