import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { checkIPRateLimit } from '@/lib/rate-limit';
import { userRegistrationSchema, validateRequestBody, ValidationError } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';

    // Rate limit registration attempts by IP
    const rateLimitCheck = await checkIPRateLimit(ipAddress, 'auth');
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts',
          message: `Please try again in ${rateLimitCheck.retryAfter} seconds`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const { email, password, name, company, phone } = validateRequestBody(
      userRegistrationSchema,
      body
    );

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        company: company || null,
        phone: phone || null,
        role: 'user',
        userRole: 'LANDLORD',
        subscription: 'free',
        hasSignedAgreement: false,
        permissions: JSON.stringify(['read:own']),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscription: true,
        company: true,
        createdAt: true,
      },
    });

    // Log registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'register',
        resource: 'user',
        resourceId: user.id,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
