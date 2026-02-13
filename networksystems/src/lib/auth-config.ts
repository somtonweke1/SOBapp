import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        if (!user.isActive) {
          throw new Error('Account is inactive');
        }

        // Verify password
        const isValidPassword = await verifyPassword(
          credentials.password,
          user.hashedPassword
        );

        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log login action
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'login',
            resource: 'user',
            resourceId: user.id,
            timestamp: new Date(),
          },
        });

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription,
          hasSignedAgreement: user.hasSignedAgreement,
          userRole: user.userRole,
          company: user.company,
          permissions: user.permissions,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token on sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscription = user.subscription;
        token.hasSignedAgreement = user.hasSignedAgreement;
        token.userRole = user.userRole;
        token.permissions = user.permissions;
        token.company = user.company;
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              subscription: true,
              hasSignedAgreement: true,
              userRole: true,
              permissions: true,
              company: true,
              role: true,
            },
          });

          if (dbUser) {
            token.subscription = dbUser.subscription;
            token.hasSignedAgreement = dbUser.hasSignedAgreement;
            token.userRole = dbUser.userRole;
            token.permissions = dbUser.permissions;
            token.company = dbUser.company;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('Failed to refresh session token:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.subscription = token.subscription as string;
        session.user.hasSignedAgreement = token.hasSignedAgreement as boolean;
        session.user.userRole = token.userRole as string;
        session.user.permissions = token.permissions as string;
        session.user.company = token.company as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
