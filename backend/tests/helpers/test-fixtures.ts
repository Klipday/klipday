import { Industry, Role, Status } from '../../src/generated/prisma/enums.js';

export const mockBrandAccount = {
  id: 'acc-brand-123',
  email: 'brand@example.com',
  passwordHash: '$2b$10$hashedpasswordforexamplebrand1234567890',
  role: Role.BRAND,
  isEmailVerified: false,
  status: Status.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  brand: {
    id: 'brand-123',
    companyName: 'PT Brand Keren',
    phoneNumber: '081234567890',
    industry: Industry.TECHNOLOGY,
    logoUrl: null,
  },
  creator: null,
  admin: null,
};

export const mockCreatorAccount = {
  id: 'acc-creator-456',
  email: 'creator@example.com',
  passwordHash: '$2b$10$hashedpasswordforexamplecreator12345678',
  role: Role.CREATOR,
  isEmailVerified: false,
  status: Status.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  brand: null,
  creator: {
    id: 'creator-456',
    fullName: 'Budi Santoso',
    avatarUrl: null,
    socialAccounts: [],
  },
  admin: null,
};

export const mockAdminAccount = {
  id: 'acc-admin-789',
  email: 'admin@example.com',
  passwordHash: '$2b$10$hashedpasswordforexampleadmin1234567890',
  role: Role.ADMIN,
  isEmailVerified: true,
  status: Status.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  brand: null,
  creator: null,
  admin: {
    id: 'admin-789',
    fullName: 'Admin Klipday',
  },
};

export const validBrandRegisterPayload = {
  role: Role.BRAND,
  email: 'newbrand@example.com',
  password: 'Password123!',
  companyName: 'PT Klipday Brand',
  phoneNumber: '081234567890',
  industry: Industry.TECHNOLOGY,
};

export const validCreatorRegisterPayload = {
  role: Role.CREATOR,
  email: 'newcreator@example.com',
  password: 'Password123!',
  fullName: 'Siti Creator',
};

export const validLoginPayload = {
  email: 'creator@example.com',
  password: 'Password123!',
};
