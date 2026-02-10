/**
 * @jest-environment node
 */
import { POST } from '../register/route';
import { createMockRequest, getResponseJson } from '@/__tests__/helpers/api-test-helpers';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  checkIPRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
}));

import { prisma } from '@/lib/prisma';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const validData = {
      email: 'newuser@example.com',
      password: 'Password123',
      name: 'New User',
      company: 'Test Corp',
    };

    // Mock database calls
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      email: validData.email,
      name: validData.name,
      role: 'user',
      subscription: 'free',
      company: validData.company,
      createdAt: new Date(),
    });
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: validData,
    });

    const response = await POST(request);
    const data = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(data.success || data.message).toBeTruthy();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(validData.email);
  });

  it('should reject registration with existing email', async () => {
    const existingUserData = {
      email: 'existing@example.com',
      password: 'Password123',
      name: 'Existing User',
    };

    // Mock existing user
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-user-id',
      email: existingUserData.email,
    });

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: existingUserData,
    });

    const response = await POST(request);
    const data = await getResponseJson(response);

    expect(response.status).toBe(409);
    expect(data.error).toBeTruthy();
  });

  it('should reject registration with weak password', async () => {
    const weakPasswordData = {
      email: 'test@example.com',
      password: 'weak',
      name: 'Test User',
    };

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: weakPasswordData,
    });

    const response = await POST(request);
    const data = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should reject registration with invalid email', async () => {
    const invalidEmailData = {
      email: 'not-an-email',
      password: 'Password123',
      name: 'Test User',
    };

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: invalidEmailData,
    });

    const response = await POST(request);
    const data = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject registration with short name', async () => {
    const shortNameData = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'A',
    };

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: shortNameData,
    });

    const response = await POST(request);
    const data = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject registration with missing required fields', async () => {
    const incompleteData = {
      email: 'test@example.com',
      // missing password and name
    };

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: incompleteData,
    });

    const response = await POST(request);
    const data = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should convert email to lowercase', async () => {
    const upperCaseEmail = {
      email: 'TEST@EXAMPLE.COM',
      password: 'Password123',
      name: 'Test User',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'test-id',
      email: 'test@example.com',
      name: upperCaseEmail.name,
      role: 'user',
      subscription: 'free',
      createdAt: new Date(),
    });
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: upperCaseEmail,
    });

    const response = await POST(request);
    const data = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(data.user.email).toBe('test@example.com');
  });

  it('should create audit log entry on registration', async () => {
    const validData = {
      email: 'audit@example.com',
      password: 'Password123',
      name: 'Audit User',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'audit-user-id',
      email: validData.email,
      name: validData.name,
      role: 'user',
      subscription: 'free',
      createdAt: new Date(),
    });
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: validData,
    });

    await POST(request);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'register',
          resource: 'user',
        }),
      })
    );
  });
});
