import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    subscription: string;
    hasSignedAgreement: boolean;
    userRole: string;
    company: string | null;
    permissions: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      subscription: string;
      hasSignedAgreement: boolean;
      userRole: string;
      company: string | null;
      permissions: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    subscription: string;
    hasSignedAgreement: boolean;
    userRole: string;
    permissions: string;
    company: string | null;
  }
}
