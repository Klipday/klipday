import { Prisma } from '../../generated/prisma/client.js';
import { Role, Status } from '../../generated/prisma/enums.js';

/**
 * Builds the initial nested create payload for a new account's wallet.
 * Pure relational payload builder: returns initial wallet creation data
 * for financial roles (BRAND, CREATOR), or null for non-financial roles (ADMIN)
 * or invalid roles via fast-fail.
 *
 * @param role - The role of the account being registered.
 * @returns Nested wallet create payload or null if the role should not have a wallet.
 */
export function BuildInitialWalletCreateData(
  role: Role,
): Prisma.WalletCreateNestedOneWithoutAccountInput | null {
  if (role !== Role.BRAND && role !== Role.CREATOR) {
    return null;
  }

  const walletData: Prisma.WalletCreateNestedOneWithoutAccountInput = {
    create: {
      balance: new Prisma.Decimal(0),
      status: Status.ACTIVE,
    },
  };

  return walletData;
}
