import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    subscription: string;
    isSubscribed: boolean;
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
      isSubscribed: boolean;
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
    isSubscribed: boolean;
    permissions: string;
    company: string | null;
  }
}
