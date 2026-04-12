'use server';

import { cookies } from 'next/headers';
import { areWorkplaceToolsEnabled, getInternalToolsAccessCode } from '@/lib/internal-tools-access';

const ACCESS_COOKIE = 'sb_access_token';
const SEVEN_DAYS = 60 * 60 * 24 * 7;

type AccessResult = {
  success: boolean;
  reason?: 'invalid' | 'not_configured' | 'bypass_enabled';
};

export async function verifyAccess(code: string): Promise<AccessResult> {
  if (areWorkplaceToolsEnabled()) {
    return { success: true, reason: 'bypass_enabled' };
  }

  const expected = getInternalToolsAccessCode();
  if (!expected) {
    // Misconfiguration: don't authenticate anyone.
    return { success: false, reason: 'not_configured' };
  }

  const trimmed = (code ?? '').trim();
  if (trimmed !== expected) {
    return { success: false, reason: 'invalid' };
  }

  const jar = await cookies();
  jar.set(ACCESS_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS,
  });

  return { success: true };
}
