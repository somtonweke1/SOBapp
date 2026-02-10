import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    cookies = {},
  } = options;

  const requestInit: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestInit.body = JSON.stringify(body);
  }

  const request = new NextRequest(url, requestInit as any);

  // Add cookies
  Object.entries(cookies).forEach(([key, value]) => {
    request.cookies.set(key, value);
  });

  return request;
}

/**
 * Create authenticated request with session
 */
export function createAuthenticatedRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  subscription?: string;
}): NextRequest {
  const {
    userId = 'test-user-id',
    userEmail = 'test@example.com',
    userRole = 'user',
    subscription = 'free',
    ...requestOptions
  } = options;

  // In real tests, this would use an actual session token
  // For now, we'll use the mock
  return createMockRequest({
    ...requestOptions,
    headers: {
      ...(requestOptions.body && { 'Content-Type': 'application/json' }),
      'x-test-user-id': userId,
      'x-test-user-email': userEmail,
      'x-test-user-role': userRole,
      'x-test-subscription': subscription,
    },
  });
}

/**
 * Extract JSON from NextResponse
 */
export async function getResponseJson(response: Response): Promise<any> {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Mock Prisma client for testing
 */
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  scenario: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  network: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  apiKey: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

/**
 * Reset all Prisma mocks
 */
export function resetPrismaMocks() {
  Object.values(mockPrisma).forEach((model: any) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((method: any) => {
        if (typeof method?.mockReset === 'function') {
          method.mockReset();
        }
      });
    }
  });
}

/**
 * Create a test user object
 */
export function createTestUser(overrides?: Partial<any>) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    hashedPassword: 'hashed-password',
    role: 'user',
    subscription: 'free',
    permissions: JSON.stringify(['read:own', 'write:own']),
    company: null,
    phone: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    ...overrides,
  };
}

/**
 * Create a test scenario object
 */
export function createTestScenario(overrides?: Partial<any>) {
  return {
    id: 'test-scenario-id',
    name: 'Test Scenario',
    description: 'A test scenario',
    type: 'baseline',
    parameters: JSON.stringify({ materials: ['lithium'] }),
    results: null,
    status: 'pending',
    error: null,
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('Timeout waiting for condition');
}
