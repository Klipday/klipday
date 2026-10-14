import { AUTH_MESSAGES, INDONESIAN_PHONE_REGEX } from '../src/features/authentication/auth.constants.js';
import { registerSchema } from '../src/features/authentication/auth.schemas.js';
import { CREATOR_MESSAGES } from '../src/features/creator/creator.constants.js';
import { UpdateCreatorProfileSchema } from '../src/features/creator/creator.schemas.js';
import { Industry, Role } from '../src/generated/prisma/enums.js';
import { NormalizePhoneNumberTo62 } from '../src/scripts/normalize-phone-numbers.js';

describe('NormalizePhoneNumberTo62 Utility', () => {
  it('returns null for null, undefined, or empty/whitespace string', () => {
    expect(NormalizePhoneNumberTo62(null)).toBeNull();
    expect(NormalizePhoneNumberTo62('')).toBeNull();
    expect(NormalizePhoneNumberTo62('   ')).toBeNull();
  });

  it('normalizes Indonesian numbers starting with 08 to 628', () => {
    expect(NormalizePhoneNumberTo62('081234567890')).toBe('6281234567890');
    expect(NormalizePhoneNumberTo62('08998732627')).toBe('628998732627');
    expect(NormalizePhoneNumberTo62('08932627112')).toBe('628932627112');
  });

  it('normalizes Indonesian numbers starting with +62 to 62', () => {
    expect(NormalizePhoneNumberTo62('+6281234567890')).toBe('6281234567890');
    expect(NormalizePhoneNumberTo62('+628932627112')).toBe('628932627112');
  });

  it('preserves numbers already starting with 62', () => {
    expect(NormalizePhoneNumberTo62('6281234567890')).toBe('6281234567890');
    expect(NormalizePhoneNumberTo62('628932627112')).toBe('628932627112');
  });

  it('normalizes numbers starting with 8 (omitting leading 0 or 62) to 628', () => {
    expect(NormalizePhoneNumberTo62('81234567890')).toBe('6281234567890');
    expect(NormalizePhoneNumberTo62('8932627112')).toBe('628932627112');
  });

  it('strips spaces, dashes, parentheses, and leading/trailing whitespace', () => {
    expect(NormalizePhoneNumberTo62('  0812-3456-7890  ')).toBe('6281234567890');
    expect(NormalizePhoneNumberTo62('+62 812 3456 7890')).toBe('6281234567890');
    expect(NormalizePhoneNumberTo62('(+62) 812-3456-7890')).toBe('6281234567890');
    expect(NormalizePhoneNumberTo62('(0812) 3456-7890')).toBe('6281234567890');
  });
});

describe('Strict Phone Validation (starts with 628)', () => {
  it('strictly rejects phone numbers starting with 08 (no transformation, must block)', () => {
    expect(INDONESIAN_PHONE_REGEX.test('08998732627')).toBe(false);
    expect(INDONESIAN_PHONE_REGEX.test('081234567890')).toBe(false);
    expect(INDONESIAN_PHONE_REGEX.test('08932627112')).toBe(false);
  });

  it('strictly rejects phone numbers starting with +62 or 8 or symbols', () => {
    expect(INDONESIAN_PHONE_REGEX.test('+628998732627')).toBe(false);
    expect(INDONESIAN_PHONE_REGEX.test('+6281234567890')).toBe(false);
    expect(INDONESIAN_PHONE_REGEX.test('8998732627')).toBe(false);
    expect(INDONESIAN_PHONE_REGEX.test('81234567890')).toBe(false);
    expect(INDONESIAN_PHONE_REGEX.test('invalid-phone')).toBe(false);
    expect(INDONESIAN_PHONE_REGEX.test('62899abc627')).toBe(false);
  });

  it('strictly accepts valid Indonesian phone numbers starting with 628 (e.g. 628998732627)', () => {
    expect(INDONESIAN_PHONE_REGEX.test('628998732627')).toBe(true);
    expect(INDONESIAN_PHONE_REGEX.test('6281234567890')).toBe(true);
    expect(INDONESIAN_PHONE_REGEX.test('628932627112')).toBe(true);
    expect(INDONESIAN_PHONE_REGEX.test('62812345678')).toBe(true);
  });

  it('verifies registerSchema strictly blocks 08... and accepts 628... for brand registration', () => {
    const baseBrandPayload = {
      role: Role.BRAND,
      email: 'brand@klipday.com',
      password: 'Password123!',
      companyName: 'Acme Corp',
      industry: Industry.TECHNOLOGY,
    };

    const blockedNumbers = ['08998732627', '081234567890', '+628998732627', '8998732627'];
    for (const phone of blockedNumbers) {
      const result = registerSchema.safeParse({ ...baseBrandPayload, phoneNumber: phone });
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneIssue = result.error.issues.find((issue) => issue.path.includes('phoneNumber'));
        expect(phoneIssue?.message).toBe(AUTH_MESSAGES.PHONE_INVALID);
      }
    }

    const acceptedResult = registerSchema.safeParse({ ...baseBrandPayload, phoneNumber: '628998732627' });
    expect(acceptedResult.success).toBe(true);
    if (acceptedResult.success && acceptedResult.data.role === Role.BRAND) {
      expect(acceptedResult.data.phoneNumber).toBe('628998732627');
    }
  });

  it('verifies UpdateCreatorProfileSchema strictly blocks 08... and accepts 628... / null / empty', () => {
    const blockedNumbers = ['08998732627', '081234567890', '+628998732627', '8998732627'];
    for (const phone of blockedNumbers) {
      const result = UpdateCreatorProfileSchema.safeParse({ phoneNumber: phone });
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneIssue = result.error.issues.find((issue) => issue.path.includes('phoneNumber'));
        expect(phoneIssue?.message).toBe(CREATOR_MESSAGES.INVALID_PHONE_NUMBER);
      }
    }

    expect(UpdateCreatorProfileSchema.safeParse({ phoneNumber: '628998732627' }).success).toBe(true);
    expect(UpdateCreatorProfileSchema.safeParse({ phoneNumber: null }).success).toBe(true);
    expect(UpdateCreatorProfileSchema.safeParse({ phoneNumber: '' }).success).toBe(true);
    expect(UpdateCreatorProfileSchema.safeParse({}).success).toBe(true);
  });
});
