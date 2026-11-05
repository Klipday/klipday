import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Industry, Prisma } from '../generated/prisma/client.js';
import { Role, Status } from '../generated/prisma/enums.js';
import { prisma } from '../utils/prisma.js';

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
 * Completely wipes all application data from the database.
 * Deletes from child tables to parent tables within a single atomic transaction.
 *
 * @returns Promise that resolves when cleanup completes.
 */
export async function CleanDatabase(): Promise<void> {
  console.log('[Cleanup] Starting database cleanup...');

  const [
    deletedErrorLogs,
    deletedTopUps,
    deletedPayouts,
    deletedWalletTransactions,
    deletedBrandPayoutAccounts,
    deletedCampaignPayments,
    deletedSubmissions,
    deletedCampaignMaterials,
    deletedCampaignBriefs,
    deletedCampaigns,
    deletedSocialVerificationCodes,
    deletedCreatorSocialAccounts,
    deletedWallets,
    deletedBrands,
    deletedCreators,
    deletedAdmins,
    deletedAccounts,
  ] = await prisma.$transaction([
    prisma.errorLog.deleteMany({}),
    prisma.topUpRequest.deleteMany({}),
    prisma.payoutRequest.deleteMany({}),
    prisma.walletTransaction.deleteMany({}),
    prisma.brandPayoutAccount.deleteMany({}),
    prisma.campaignPayment.deleteMany({}),
    prisma.submission.deleteMany({}),
    prisma.campaignMaterial.deleteMany({}),
    prisma.campaignBrief.deleteMany({}),
    prisma.campaign.deleteMany({}),
    prisma.socialVerificationCode.deleteMany({}),
    prisma.creatorSocialAccount.deleteMany({}),
    prisma.wallet.deleteMany({}),
    prisma.brand.deleteMany({}),
    prisma.creator.deleteMany({}),
    prisma.admin.deleteMany({}),
    prisma.account.deleteMany({}),
  ]);

  console.log('[Cleanup] Finished database cleanup. Deleted records:');
  console.log(`  - Error logs: ${deletedErrorLogs.count}`);
  console.log(`  - Top up requests: ${deletedTopUps.count}`);
  console.log(`  - Payout requests: ${deletedPayouts.count}`);
  console.log(`  - Wallet transactions: ${deletedWalletTransactions.count}`);
  console.log(`  - Brand payout accounts: ${deletedBrandPayoutAccounts.count}`);
  console.log(`  - Campaign payments: ${deletedCampaignPayments.count}`);
  console.log(`  - Submissions: ${deletedSubmissions.count}`);
  console.log(`  - Campaign materials: ${deletedCampaignMaterials.count}`);
  console.log(`  - Campaign briefs: ${deletedCampaignBriefs.count}`);
  console.log(`  - Campaigns: ${deletedCampaigns.count}`);
  console.log(`  - Social verification codes: ${deletedSocialVerificationCodes.count}`);
  console.log(`  - Creator social accounts: ${deletedCreatorSocialAccounts.count}`);
  console.log(`  - Wallets: ${deletedWallets.count}`);
  console.log(`  - Brands: ${deletedBrands.count}`);
  console.log(`  - Creators: ${deletedCreators.count}`);
  console.log(`  - Admins: ${deletedAdmins.count}`);
  console.log(`  - Accounts: ${deletedAccounts.count}`);
}

/**
 * Seeds or updates the Admin account.
 *
 * @returns Promise that resolves when admin seeding completes.
 */
export async function SeedAdminAccount(): Promise<void> {
  console.log(`[Seed] Creating admin account (${ADMIN_EMAIL})...`);

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
  console.log(`[Seed] Admin created successfully: ID=${account.id}, Email=${account.email}`);
}

/**
 * Seeds or updates the Brand account with its Brand profile and Wallet.
 *
 * @returns Promise that resolves when brand seeding completes.
 */
export async function SeedBrandAccount(): Promise<void> {
  console.log(`[Seed] Creating brand account (${BRAND_EMAIL})...`);

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
  console.log(`[Seed] Brand created successfully: ID=${account.id}, Email=${account.email}, Company=${account.brand?.companyName}`);
}

/**
 * Seeds or updates the Creator account with its Creator profile and Wallet.
 *
 * @returns Promise that resolves when creator seeding completes.
 */
export async function SeedCreatorAccount(): Promise<void> {
  console.log(`[Seed] Creating creator account (${CREATOR_EMAIL})...`);

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
  console.log(`[Seed] Creator created successfully: ID=${account.id}, Email=${account.email}, FullName=${account.creator?.fullName}`);
}

/**
 * Cleans the entire database and seeds the required development accounts.
 *
 * @returns Promise that resolves when reset and seeding are finished.
 */
async function Main(): Promise<void> {
  try {
    await CleanDatabase();
    await SeedAdminAccount();
    await SeedBrandAccount();
    await SeedCreatorAccount();
    console.log('[Reset] Development database cleanup and seeding completed successfully!');
  } catch (error) {
    console.error('[Reset] Error during database reset:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

Main();
