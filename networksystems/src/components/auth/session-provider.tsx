'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SessionProvider({ children }: Props) {
  const bypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === '1';

  if (bypass) {
    return (
      <NextAuthSessionProvider
        session={{
          user: {
            id: 'bypass-user',
            name: 'Bypass Admin',
            email: 'bypass@local',
            role: 'admin',
            subscription: 'enterprise',
            permissions: ['*'],
            userRole: 'LANDLORD',
            hasSignedAgreement: true,
            company: null,
          },
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        }}
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        {children}
      </NextAuthSessionProvider>
    );
  }

  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
