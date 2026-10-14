/**
 * Script to normalize all phone numbers stored in the database to start with '62'.
 * Updates brands and creators whose phone numbers start with '08', '+62', or '8'.
 */
import { prisma } from '../utils/prisma.js';

export function NormalizePhoneNumberTo62(rawPhone: string | null): string | null {
  if (!rawPhone || !rawPhone.trim()) {
    return null;
  }

  let cleaned = rawPhone.trim().replace(/[\s-()]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  return cleaned || null;
}

async function NormalizeAllDatabasePhoneNumbers(): Promise<void> {
  console.log('--- Starting phone number normalization in database ---');

  try {
    // 1. Process Brands
    const brands = await prisma.brand.findMany({
      where: {
        phoneNumber: { not: null },
      },
      select: { id: true, companyName: true, phoneNumber: true },
    });

    let brandUpdatedCount = 0;
    for (const b of brands) {
      if (!b.phoneNumber) continue;
      const normalized = NormalizePhoneNumberTo62(b.phoneNumber);
      if (normalized && normalized !== b.phoneNumber) {
        await prisma.brand.update({
          where: { id: b.id },
          data: { phoneNumber: normalized },
        });
        console.log(`Updated Brand [${b.companyName}]: ${b.phoneNumber} -> ${normalized}`);
        brandUpdatedCount++;
      } else {
        console.log(`Brand [${b.companyName}] already consistent: ${b.phoneNumber}`);
      }
    }

    // 2. Process Creators
    const creators = await prisma.creator.findMany({
      where: {
        phoneNumber: { not: null },
      },
      select: { id: true, fullName: true, phoneNumber: true },
    });

    let creatorUpdatedCount = 0;
    for (const c of creators) {
      if (!c.phoneNumber) continue;
      const normalized = NormalizePhoneNumberTo62(c.phoneNumber);
      if (normalized && normalized !== c.phoneNumber) {
        await prisma.creator.update({
          where: { id: c.id },
          data: { phoneNumber: normalized },
        });
        console.log(`Updated Creator [${c.fullName}]: ${c.phoneNumber} -> ${normalized}`);
        creatorUpdatedCount++;
      } else {
        console.log(`Creator [${c.fullName}] already consistent: ${c.phoneNumber}`);
      }
    }

    console.log(`--- Finished: ${brandUpdatedCount} brands updated, ${creatorUpdatedCount} creators updated ---`);
  } finally {
    await prisma.$disconnect();
  }
}

// Only execute directly when run as CLI script, not when imported in test suites
if (process.argv[1]?.includes('normalize-phone-numbers')) {
  NormalizeAllDatabasePhoneNumbers().catch((err) => {
    console.error('Failed to normalize phone numbers:', err);
    process.exit(1);
  });
}
