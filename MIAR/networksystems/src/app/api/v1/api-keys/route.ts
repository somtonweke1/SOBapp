import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import { apiKeyCreateSchema, validateRequestBody, ValidationError } from '@/lib/validation';
import crypto from 'crypto';

/**
 * Generate a secure API key
 */
function generateApiKey(): string {
  const prefix = 'miar';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}

/**
 * Hash API key for storage
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * GET /api/v1/api-keys
 * List all API keys for the authenticated user (hashed, not the actual keys)
 */
export async function GET(request: NextRequest) {
  return withApiMiddleware(
    request,
    async (context) => {
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId: context.userId },
        select: {
          id: true,
          name: true,
          key: true, // This is hashed
          lastUsed: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Mask the keys to show only last 8 characters
      const maskedKeys = apiKeys.map((key) => ({
        ...key,
        key: `${'*'.repeat(40)}${key.key.slice(-8)}`,
      }));

      return NextResponse.json({
        success: true,
        data: maskedKeys,
      });
    },
    {
      rateLimit: 'api',
      logRequest: true,
      resource: 'api_keys',
    }
  );
}

/**
 * POST /api/v1/api-keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  return withApiMiddleware(
    request,
    async (context) => {
      try {
        const body = await request.json();
        const data = validateRequestBody(apiKeyCreateSchema, body);

        // Check user's API key limit based on subscription
        const keyLimits = {
          free: 1,
          starter: 3,
          professional: 10,
          enterprise: 100,
        };

        const existingKeys = await prisma.apiKey.count({
          where: {
            userId: context.userId,
            isActive: true,
          },
        });

        const limit = keyLimits[context.subscription as keyof typeof keyLimits] || keyLimits.free;

        if (existingKeys >= limit) {
          return NextResponse.json(
            {
              success: false,
              error: 'API key limit reached',
              message: `Your ${context.subscription} plan allows up to ${limit} active API keys. Please upgrade or delete existing keys.`,
              limit,
              current: existingKeys,
            },
            { status: 402 }
          );
        }

        // Generate new API key
        const apiKey = generateApiKey();
        const hashedKey = hashApiKey(apiKey);

        // Store hashed key in database
        const createdKey = await prisma.apiKey.create({
          data: {
            name: data.name,
            key: hashedKey,
            userId: context.userId,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            isActive: true,
          },
        });

        // Log creation
        await prisma.auditLog.create({
          data: {
            userId: context.userId,
            action: 'create_api_key',
            resource: 'api_key',
            resourceId: createdKey.id,
            details: JSON.stringify({ name: data.name }),
            timestamp: new Date(),
          },
        });

        // Return the actual key ONLY on creation - this is the only time user will see it
        return NextResponse.json(
          {
            success: true,
            data: {
              id: createdKey.id,
              name: createdKey.name,
              key: apiKey, // Return actual key - user must save it
              expiresAt: createdKey.expiresAt,
              createdAt: createdKey.createdAt,
            },
            message: 'API key created successfully. Save this key securely - it will not be shown again.',
          },
          { status: 201 }
        );
      } catch (error) {
        if (error instanceof ValidationError) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              details: error.errors,
            },
            { status: 400 }
          );
        }

        throw error;
      }
    },
    {
      rateLimit: 'api',
      minimumSubscription: 'starter', // API keys require at least starter plan
      logRequest: true,
      resource: 'api_keys',
    }
  );
}
