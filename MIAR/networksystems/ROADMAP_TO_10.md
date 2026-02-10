# 🎯 MIAR Platform: Roadmap to 10/10

**Current Rating:** 6.5/10
**Target Rating:** 10/10
**Estimated Time:** 200 hours (5-6 weeks)
**Status:** Planning Phase

---

## PHASE 1: SECURITY FOUNDATION (35 hours, Week 1)
**Target Rating After Phase:** 7.0/10

### 1.1 Authentication System (12 hours)
**Priority:** 🔴 CRITICAL

**Current State:**
- Mock auth with hardcoded passwords in `auth-context.tsx`
- Credentials visible in source code
- No session management

**Implementation:**
```bash
# Install dependencies
npm install next-auth @auth/prisma-adapter bcryptjs
npm install --save-dev @types/bcryptjs
```

**Files to Create:**
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/lib/auth.ts` - Auth utilities and session helpers
- `src/middleware.ts` - Route protection middleware

**Configuration:**
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Testing Checklist:**
- [ ] Users can register with email/password
- [ ] Passwords are hashed with bcrypt
- [ ] Sessions persist across refreshes
- [ ] Invalid credentials rejected
- [ ] Protected routes redirect to login

---

### 1.2 Database Implementation (15 hours)
**Priority:** 🔴 CRITICAL

**Current State:**
- In-memory `Map()` objects in `api/database/index.js`
- All data lost on server restart
- No relationships or constraints

**Implementation:**
```bash
# Install Prisma
npm install @prisma/client
npm install --save-dev prisma

# Initialize Prisma
npx prisma init
```

**Prisma Schema:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  hashedPassword String
  role           String   @default("user")
  company        String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  networks       Network[]
  analyses       Analysis[]
  scenarios      Scenario[]
}

model Network {
  id          String   @id @default(cuid())
  name        String
  description String?
  nodes       Json
  edges       Json
  metadata    Json?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  analyses    Analysis[]
}

model Analysis {
  id         String   @id @default(cuid())
  networkId  String
  network    Network  @relation(fields: [networkId], references: [id], onDelete: Cascade)
  type       String
  algorithm  String
  parameters Json
  results    Json?
  status     String   @default("pending")
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Scenario {
  id          String   @id @default(cuid())
  name        String
  description String?
  parameters  Json
  results     Json?
  status      String   @default("pending")
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CommodityPrice {
  id        String   @id @default(cuid())
  symbol    String
  name      String
  price     Float
  change    Float
  volume    Float?
  source    String
  timestamp DateTime @default(now())

  @@index([symbol, timestamp])
}

model RiskAlert {
  id          String   @id @default(cuid())
  severity    String
  category    String
  description String
  region      String?
  commodity   String?
  resolved    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([severity, resolved])
}
```

**Migration Commands:**
```bash
# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

**Testing Checklist:**
- [ ] Database connection established
- [ ] All models created successfully
- [ ] CRUD operations work
- [ ] Relationships enforced
- [ ] Cascade deletes work

---

### 1.3 Server-Side API Security (8 hours)
**Priority:** 🔴 CRITICAL

**Current State:**
- `NEXT_PUBLIC_` prefix exposes keys to browser
- API keys in `.env.example` visible to clients

**Fix:**
```typescript
// src/lib/api-keys.ts (Server-side only)
export const apiKeys = {
  alphaVantage: process.env.ALPHA_VANTAGE_API_KEY!,
  twelveData: process.env.TWELVE_DATA_API_KEY!,
  newsApi: process.env.NEWS_API_KEY!,
  perplexity: process.env.PERPLEXITY_API_KEY!,
};

// Validate keys on startup
if (!apiKeys.alphaVantage) {
  console.warn('Warning: ALPHA_VANTAGE_API_KEY not set');
}
```

**Update .env.example:**
```bash
# Remove NEXT_PUBLIC_ prefix from sensitive keys
ALPHA_VANTAGE_API_KEY=your_key_here
TWELVE_DATA_API_KEY=your_key_here
NEWS_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here

# Only public-safe variables should use NEXT_PUBLIC_
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Refactor API Routes:**
All external API calls must happen server-side in `/app/api/` routes.

**Testing Checklist:**
- [ ] No API keys in browser DevTools
- [ ] No keys in client bundle
- [ ] All API calls proxied through backend
- [ ] Environment validation on startup

---

## PHASE 2: API SECURITY (25 hours, Week 2)
**Target Rating After Phase:** 7.5/10

### 2.1 Input Validation with Zod (10 hours)
**Priority:** 🟠 MAJOR

**Install Dependencies:**
```bash
npm install zod
```

**Create Validation Schemas:**
```typescript
// src/lib/validations/scenario.ts
import { z } from 'zod';

export const scenarioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parameters: z.object({
    materials: z.array(z.string()),
    technologies: z.array(z.string()),
    timeHorizon: z.number().min(1).max(365),
    scenario: z.enum(['baseline', 'high_demand', 'constrained_supply', 'rapid_expansion']),
  }),
});

export type ScenarioInput = z.infer<typeof scenarioSchema>;
```

**Apply to API Routes:**
```typescript
// src/app/api/sc-gep/route.ts
import { scenarioSchema } from '@/lib/validations/scenario';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = scenarioSchema.parse(body);

    // Process validated data
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }
    // ...
  }
}
```

**Testing Checklist:**
- [ ] All POST endpoints validate input
- [ ] Invalid data returns 400 with clear errors
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized

---

### 2.2 Rate Limiting (8 hours)
**Priority:** 🟠 MAJOR

**Install Dependencies:**
```bash
npm install @upstash/redis @upstash/ratelimit
```

**Implementation:**
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
});

// Apply to API routes
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    );
  }

  // Continue processing...
}
```

**Testing Checklist:**
- [ ] Rate limits enforced per IP
- [ ] Proper 429 responses
- [ ] Rate limit headers returned
- [ ] Different limits for different endpoints

---

### 2.3 Error Boundaries (7 hours)
**Priority:** 🔴 CRITICAL

**Implementation:**
```typescript
// src/components/error-boundary.tsx
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Send to error tracking service
    if (typeof window !== 'undefined') {
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-zinc-600 mb-6">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Apply to Layout:**
```typescript
// src/app/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Testing Checklist:**
- [ ] Component crashes don't break entire app
- [ ] Errors logged to console
- [ ] User sees friendly error message
- [ ] Reload button works

---

## PHASE 3: TESTING INFRASTRUCTURE (30 hours, Week 2-3)
**Target Rating After Phase:** 8.0/10

### 3.1 Jest & React Testing Library Setup (8 hours)
**Priority:** 🔴 CRITICAL

**Install Dependencies:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest
```

**Configuration:**
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

**Testing Checklist:**
- [ ] Jest configured and running
- [ ] Can run `npm test`
- [ ] Coverage reports generated
- [ ] CI/CD integration ready

---

### 3.2 Unit Tests for Services (12 hours)
**Priority:** 🟠 MAJOR

**Example Test:**
```typescript
// src/services/__tests__/sc-gep-model.test.ts
import { SCGEPModel, createAfricanMiningSCGEPConfig } from '../sc-gep-model';

describe('SCGEPModel', () => {
  it('should create a valid model configuration', () => {
    const config = createAfricanMiningSCGEPConfig();
    expect(config.materials).toBeDefined();
    expect(config.technologies).toBeDefined();
    expect(config.zones).toBeDefined();
  });

  it('should solve a basic scenario', async () => {
    const config = createAfricanMiningSCGEPConfig();
    const model = new SCGEPModel(config);
    const solution = await model.solve();

    expect(solution.feasibility).toBe(true);
    expect(solution.objectiveValue).toBeGreaterThan(0);
    expect(solution.convergence).toBe('optimal');
  });

  it('should identify bottlenecks', async () => {
    const config = createAfricanMiningSCGEPConfig();
    const model = new SCGEPModel(config);
    await model.solve();

    const analysis = model.analyzeSupplyChain();
    expect(analysis.materialBottlenecks).toBeDefined();
    expect(Array.isArray(analysis.materialBottlenecks)).toBe(true);
  });
});
```

**Testing Checklist:**
- [ ] All service files have tests
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] 80%+ coverage for services

---

### 3.3 Integration Tests for APIs (10 hours)
**Priority:** 🟠 MAJOR

**Example Test:**
```typescript
// src/app/api/sc-gep/__tests__/route.test.ts
import { POST } from '../route';

describe('/api/sc-gep', () => {
  it('should return a valid solution', async () => {
    const mockRequest = new Request('http://localhost:3000/api/sc-gep', {
      method: 'POST',
      body: JSON.stringify({
        scenario: 'baseline',
        region: 'africa',
        analysis_type: 'full',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.solution).toBeDefined();
  });

  it('should reject invalid input', async () => {
    const mockRequest = new Request('http://localhost:3000/api/sc-gep', {
      method: 'POST',
      body: JSON.stringify({
        scenario: 'invalid_scenario',
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });
});
```

**Testing Checklist:**
- [ ] All API routes tested
- [ ] Success paths verified
- [ ] Error paths tested
- [ ] Authentication tested

---

## PHASE 4: ERROR HANDLING & MONITORING (20 hours, Week 3)
**Target Rating After Phase:** 8.5/10

### 4.1 Sentry Integration (5 hours)
**Priority:** 🟡 MODERATE

**Install:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'miar.ai'],
    }),
  ],
});
```

**Testing Checklist:**
- [ ] Errors logged to Sentry
- [ ] User context attached
- [ ] Performance traces captured
- [ ] Alerts configured

---

### 4.2 Structured Logging (8 hours)
**Priority:** 🟠 MAJOR

**Install:**
```bash
npm install pino pino-pretty
```

**Implementation:**
```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Usage
logger.info({ userId: '123', action: 'login' }, 'User logged in');
logger.error({ error: err }, 'Failed to process request');
```

**Replace All Console Logs:**
```bash
# Find all console.log statements
grep -r "console\\.log" src/

# Replace with logger
# console.log('message') → logger.info('message')
# console.error('error') → logger.error('error')
```

**Testing Checklist:**
- [ ] All 138 console statements replaced
- [ ] Structured logs in production
- [ ] Log levels configured
- [ ] Log aggregation ready

---

### 4.3 Loading States (7 hours)
**Priority:** 🟠 MAJOR

**Create Loading Components:**
```typescript
// src/components/ui/skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-zinc-200', className)} />
  );
}

// src/components/ui/loading-spinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );
}
```

**Apply to Components:**
```typescript
// Example: Supply chain optimization
export default function SupplyChainOptimization() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    // Actual content
  );
}
```

**Testing Checklist:**
- [ ] All data fetching shows loading state
- [ ] Skeleton screens implemented
- [ ] No blank screens during loading
- [ ] Loading states accessible

---

## PHASE 5: PERFORMANCE & CACHING (25 hours, Week 4)
**Target Rating After Phase:** 9.0/10

### 5.1 React Query Implementation (10 hours)
**Priority:** 🟡 MODERATE

**Install:**
```bash
npm install @tanstack/react-query
```

**Setup:**
```typescript
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        cacheTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Usage:**
```typescript
// Example: Fetch commodity data
import { useQuery } from '@tanstack/react-query';

function CommodityPrices() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await fetch('/api/market-data/commodities');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage />;

  return <div>{/* Render data */}</div>;
}
```

**Testing Checklist:**
- [ ] All data fetching uses React Query
- [ ] Cache configured appropriately
- [ ] Optimistic updates work
- [ ] Stale-while-revalidate pattern

---

### 5.2 Image & Asset Optimization (5 hours)
**Priority:** 🟡 MODERATE

**Next.js Image Component:**
```typescript
import Image from 'next/image';

// Replace all <img> tags with Next.js Image
<Image
  src="/logo.png"
  alt="MIAR Logo"
  width={100}
  height={100}
  priority // For above-the-fold images
/>
```

**Lazy Load Heavy Components:**
```typescript
import dynamic from 'next/dynamic';

const ThreeDSupplyChainNetwork = dynamic(
  () => import('@/components/visualization/3d-supply-chain-network'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);
```

**Testing Checklist:**
- [ ] All images optimized
- [ ] Heavy components lazy loaded
- [ ] Bundle size reduced by 30%+
- [ ] Core Web Vitals improved

---

### 5.3 Database Query Optimization (10 hours)
**Priority:** 🟡 MODERATE

**Add Indexes:**
```prisma
// prisma/schema.prisma
model CommodityPrice {
  // ...
  @@index([symbol, timestamp])
  @@index([symbol, createdAt])
}

model RiskAlert {
  // ...
  @@index([severity, resolved])
  @@index([category, createdAt])
}
```

**Optimize Queries:**
```typescript
// Bad: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const networks = await prisma.network.findMany({
    where: { userId: user.id }
  });
}

// Good: Use include
const users = await prisma.user.findMany({
  include: {
    networks: true,
  },
});
```

**Testing Checklist:**
- [ ] All queries use proper indexes
- [ ] N+1 problems eliminated
- [ ] Query performance < 100ms
- [ ] Connection pooling configured

---

## PHASE 6: UX & ACCESSIBILITY (30 hours, Week 4-5)
**Target Rating After Phase:** 9.5/10

### 6.1 Mobile Responsiveness (12 hours)
**Priority:** 🟡 MODERATE

**Responsive Design:**
```typescript
// Example: Supply chain dashboard
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Mobile: stacks vertically, Desktop: side-by-side */}
</div>

<div className="hidden md:block">
  {/* Only show on desktop */}
</div>

<div className="block md:hidden">
  {/* Only show on mobile */}
</div>
```

**Mobile Navigation:**
```typescript
// Add hamburger menu for mobile
<button
  className="md:hidden"
  onClick={() => setMobileMenuOpen(true)}
>
  <Menu className="h-6 w-6" />
</button>
```

**Testing Checklist:**
- [ ] All pages work on mobile (320px+)
- [ ] Touch targets 44x44px minimum
- [ ] Tables scroll horizontally on mobile
- [ ] No horizontal scroll

---

### 6.2 Accessibility (WCAG 2.1 AA) (10 hours)
**Priority:** 🟡 MODERATE

**ARIA Labels:**
```typescript
<button
  aria-label="Close modal"
  aria-describedby="modal-description"
>
  <X className="h-4 w-4" />
</button>

<input
  type="email"
  aria-label="Email address"
  aria-required="true"
  aria-invalid={!!error}
/>
```

**Keyboard Navigation:**
```typescript
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Clickable div
</div>
```

**Testing Checklist:**
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader tested
- [ ] Color contrast 4.5:1 minimum
- [ ] Focus indicators visible
- [ ] ARIA landmarks present

---

### 6.3 Internationalization (8 hours)
**Priority:** 🔵 MINOR

**Install:**
```bash
npm install next-intl
```

**Setup:**
```typescript
// messages/en.json
{
  "nav": {
    "dashboard": "Dashboard",
    "analytics": "Analytics"
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred"
  }
}

// Usage
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('nav');
  return <div>{t('dashboard')}</div>;
}
```

**Testing Checklist:**
- [ ] All strings externalized
- [ ] English locale complete
- [ ] Date/number formatting
- [ ] RTL support ready

---

## PHASE 7: DEVOPS & CI/CD (20 hours, Week 5)
**Target Rating After Phase:** 9.7/10

### 7.1 GitHub Actions CI/CD (8 hours)
**Priority:** 🔵 MINOR

**Workflow File:**
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Testing Checklist:**
- [ ] CI runs on every PR
- [ ] Tests must pass to merge
- [ ] Auto-deploy to staging
- [ ] Manual approve for production

---

### 7.2 Environment Management (5 hours)
**Priority:** 🔵 MINOR

**Multiple Environments:**
```bash
# .env.development
DATABASE_URL="postgresql://localhost:5432/miar_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# .env.staging
DATABASE_URL="postgresql://staging.db/miar_staging"
NEXT_PUBLIC_APP_URL="https://staging.miar.ai"

# .env.production
DATABASE_URL="postgresql://prod.db/miar_prod"
NEXT_PUBLIC_APP_URL="https://miar.ai"
```

**Testing Checklist:**
- [ ] Dev, staging, prod environments
- [ ] Secrets managed in Vercel
- [ ] No hardcoded values
- [ ] Environment parity

---

### 7.3 Monitoring & Alerts (7 hours)
**Priority:** 🟡 MODERATE

**Vercel Analytics:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Custom Metrics:**
```typescript
// src/lib/metrics.ts
import { track } from '@vercel/analytics';

export function trackEvent(event: string, data?: Record<string, any>) {
  track(event, data);
}

// Usage
trackEvent('scenario_generated', {
  scenario: 'baseline',
  duration: 1234,
});
```

**Testing Checklist:**
- [ ] Core Web Vitals tracked
- [ ] Custom events logged
- [ ] Alerts for errors
- [ ] Performance budgets

---

## PHASE 8: DOCUMENTATION & POLISH (15 hours, Week 6)
**Target Rating After Phase:** 10/10

### 8.1 Code Documentation (5 hours)
**Priority:** 🔵 MINOR

**JSDoc Comments:**
```typescript
/**
 * Solves the supply chain optimization problem using the SC-GEP model
 * @param config - Model configuration with materials, technologies, and constraints
 * @returns Solution object with objective value, feasibility, and convergence status
 * @throws {Error} If model is infeasible or fails to converge
 * @example
 * const config = createAfricanMiningSCGEPConfig();
 * const model = new SCGEPModel(config);
 * const solution = await model.solve();
 */
async solve(): Promise<SCGEPSolution> {
  // ...
}
```

**Testing Checklist:**
- [ ] All public APIs documented
- [ ] Complex functions explained
- [ ] Examples provided
- [ ] Generated docs with TypeDoc

---

### 8.2 User Documentation (5 hours)
**Priority:** 🔵 MINOR

**Create:**
- `/docs/user-guide.md` - How to use platform
- `/docs/api-reference.md` - API endpoints
- `/docs/faq.md` - Common questions
- `/docs/troubleshooting.md` - Fix common issues

**Testing Checklist:**
- [ ] Onboarding guide complete
- [ ] Screenshots included
- [ ] Video tutorials (optional)
- [ ] FAQ covers 80% of support

---

### 8.3 Final Polish (5 hours)
**Priority:** 🔵 MINOR

**Code Cleanup:**
- Remove unused imports
- Fix TypeScript warnings
- Standardize naming
- Remove dead code

**Testing Checklist:**
- [ ] Zero TypeScript errors
- [ ] Zero linter warnings
- [ ] All TODOs resolved
- [ ] Consistent code style

---

## SUCCESS METRICS: 10/10 CHECKLIST

### Security (100%)
- [x] Real authentication with bcrypt
- [x] Database persistence (Prisma + PostgreSQL)
- [x] All API keys server-side
- [x] Input validation with Zod
- [x] Rate limiting implemented
- [x] CSRF protection enabled
- [x] XSS sanitization active

### Testing (100%)
- [x] 80%+ test coverage
- [x] Unit tests for all services
- [x] Integration tests for APIs
- [x] E2E tests for critical paths
- [x] Automated test runs in CI

### Performance (100%)
- [x] React Query caching
- [x] Database indexes optimized
- [x] Bundle size < 300KB
- [x] Lighthouse score > 90
- [x] Core Web Vitals green
- [x] Server response < 200ms

### User Experience (100%)
- [x] Mobile responsive (320px+)
- [x] WCAG 2.1 AA compliant
- [x] Loading states everywhere
- [x] Error boundaries active
- [x] Offline fallbacks ready
- [x] Internationalization ready

### DevOps (100%)
- [x] CI/CD pipeline running
- [x] Automated deployments
- [x] Error monitoring (Sentry)
- [x] Performance tracking
- [x] Log aggregation
- [x] Backup procedures

### Documentation (100%)
- [x] Code fully documented
- [x] API reference complete
- [x] User guide published
- [x] Architecture diagrams
- [x] Runbooks for ops

---

## EFFORT BREAKDOWN

| Phase | Hours | Rating Gain |
|-------|-------|-------------|
| Phase 1: Security Foundation | 35 | 6.5 → 7.0 |
| Phase 2: API Security | 25 | 7.0 → 7.5 |
| Phase 3: Testing Infrastructure | 30 | 7.5 → 8.0 |
| Phase 4: Error Handling | 20 | 8.0 → 8.5 |
| Phase 5: Performance | 25 | 8.5 → 9.0 |
| Phase 6: UX & Accessibility | 30 | 9.0 → 9.5 |
| Phase 7: DevOps | 20 | 9.5 → 9.7 |
| Phase 8: Documentation | 15 | 9.7 → 10.0 |
| **TOTAL** | **200 hours** | **6.5 → 10.0** |

---

## TIMELINE

**Week 1:** Security Foundation (35h)
**Week 2:** API Security (25h) + Testing Start (15h)
**Week 3:** Testing Complete (15h) + Error Handling (20h)
**Week 4:** Performance (25h) + UX Start (5h)
**Week 5:** UX Complete (25h) + DevOps (20h)
**Week 6:** Documentation & Polish (15h)

**Total: 6 weeks (200 hours)**

---

## COST ESTIMATES

### Development Tools
- GitHub Actions: Free for public repos
- Vercel Pro: $20/month
- Upstash Redis: $10/month
- Sentry: $26/month
- Database (Neon/Supabase): $25/month

**Monthly Cost: ~$81**

### Development Time
- Solo developer: 5-6 weeks full-time
- Small team (2 devs): 3-4 weeks
- Agency: 2-3 weeks + $20-40k

---

## IMMEDIATE NEXT STEPS

1. **Install dependencies for Phase 1**
```bash
npm install next-auth @prisma/client bcryptjs
npm install --save-dev prisma @types/bcryptjs
```

2. **Initialize database**
```bash
npx prisma init
```

3. **Create auth configuration**
```bash
mkdir -p src/app/api/auth/[...nextauth]
touch src/app/api/auth/[...nextauth]/route.ts
```

4. **Start with authentication** (highest priority)

---

## CONCLUSION

This roadmap transforms MIAR from a **6.5/10 impressive prototype** to a **10/10 world-class platform** in 200 hours.

**The work is systematic, measurable, and achievable.**

Each phase builds on the previous, with clear success criteria and testing checkpoints.

**Ready to start?** Begin with Phase 1: Security Foundation.
