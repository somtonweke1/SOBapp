# SOBapp Platform Architecture

Comprehensive architecture documentation for the Mining Intelligence & Analytics (SOBapp) platform.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Data Architecture](#data-architecture)
- [API Architecture](#api-architecture)
- [Infrastructure](#infrastructure)
- [Security Architecture](#security-architecture)
- [Performance & Scalability](#performance--scalability)
- [Development Workflow](#development-workflow)

## System Overview

The SOBapp platform is a modern, cloud-native web application built with Next.js 14, providing supply chain analytics, mining intelligence, and market data insights.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web Browser │  │  Mobile Apps │  │  API Clients │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────┴────────────────────────────────────┐
│                   CDN Layer (Vercel Edge)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Static Assets   │   Cached Responses   │   Images   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js 14 (App Router)                │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌─────────┐  │   │
│  │  │  Pages │  │   API  │  │Middleware│  │  Auth   │  │   │
│  │  └────────┘  └────────┘  └────────┘  └─────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Service Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Analysis │  │  Mining  │  │  Market  │  │    AI    │   │
│  │ Services │  │ Services │  │   Data   │  │ Services │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  PostgreSQL │  │    Cache    │  │   Storage   │        │
│  │   Database  │  │   (Redis)   │  │    (S3)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                 External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Market APIs  │  │  Perplexity  │  │    Sentry    │     │
│  │ (Alpha, 12D) │  │      AI      │  │  Monitoring  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Key Characteristics

- **Serverless**: Deployed on Vercel with auto-scaling
- **Edge-First**: CDN distribution for global performance
- **API-Driven**: RESTful APIs with versioning
- **Real-time**: WebSocket support for live data
- **Secure**: End-to-end encryption and authentication
- **Observable**: Comprehensive monitoring and logging

## Technology Stack

### Frontend

**Core Framework**:
- **Next.js 14.2.5**: React framework with App Router
- **React 18.3.1**: UI library with Server Components
- **TypeScript 5.5.4**: Type-safe development

**UI Components**:
- **Tailwind CSS 3.4.3**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Recharts**: Data visualization

**3D Visualization**:
- **Three.js**: 3D graphics
- **React Three Fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers

**Maps**:
- **Mapbox GL**: Interactive maps
- **Deck.gl**: WebGL-powered visualization

**State Management**:
- **React Context**: Global state
- **Zustand**: Client state management
- **SWR**: Data fetching and caching

### Backend

**Runtime**:
- **Node.js 20**: JavaScript runtime
- **Next.js API Routes**: Serverless functions

**Database**:
- **PostgreSQL**: Primary database (production)
- **SQLite**: Development database
- **Prisma 5.17.0**: ORM and migrations

**Authentication**:
- **NextAuth.js 4.24.7**: Authentication
- **bcrypt**: Password hashing
- **JWT**: Token-based auth

**Caching**:
- **lru-cache**: In-memory caching
- **Redis** (optional): Distributed caching

**AI/ML**:
- **Perplexity API**: AI-powered insights
- **TensorFlow.js** (optional): Client-side ML

### External Services

**Market Data**:
- **Alpha Vantage**: Stock and forex data
- **Twelve Data**: Commodity prices
- **GNews API**: Mining news

**Monitoring**:
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance monitoring
- **Pino**: Structured logging

**Infrastructure**:
- **Vercel**: Hosting and deployment
- **AWS S3**: File storage (backups)
- **GitHub Actions**: CI/CD

## Application Architecture

### Next.js App Router Structure

```
src/
├── app/                          # App Router directory
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   │
│   ├── dashboard/                # Dashboard pages
│   │   ├── page.tsx              # Dashboard home
│   │   ├── layout.tsx            # Dashboard layout
│   │   └── loading.tsx           # Loading UI
│   │
│   ├── analysis/                 # Analysis module
│   │   ├── page.tsx              # Analysis list
│   │   ├── [id]/                 # Dynamic route
│   │   │   ├── page.tsx          # Analysis details
│   │   │   └── loading.tsx       # Loading state
│   │   └── new/                  # Create analysis
│   │       └── page.tsx
│   │
│   ├── materials/                # Material tracking
│   ├── scenarios/                # Scenario analysis
│   ├── intelligence/             # Market intelligence
│   └── settings/                 # User settings
│
├── api/                          # API routes
│   ├── health/                   # Health check
│   ├── analysis/                 # Analysis APIs
│   ├── sc-gep/                   # Supply chain APIs
│   ├── mining/                   # Mining APIs
│   ├── market-data/              # Market data APIs
│   └── v1/                       # Versioned APIs
│       ├── scenarios/
│       └── api-keys/
│
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   └── error-states.tsx
│   │
│   ├── visualization/            # Visualization components
│   │   ├── network-3d.tsx        # 3D network graph
│   │   ├── geo-network-map.tsx   # Geographic map
│   │   └── charts/               # Chart components
│   │
│   ├── analysis/                 # Analysis components
│   ├── materials/                # Material components
│   └── scenarios/                # Scenario components
│
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Prisma client
│   ├── auth.ts                   # Auth configuration
│   ├── cache.ts                  # Caching layer
│   ├── logger.ts                 # Logging
│   ├── monitoring.ts             # Monitoring system
│   └── utils.ts                  # Utility functions
│
├── services/                     # Business logic
│   ├── analysis-service.ts       # Analysis logic
│   ├── mining-service.ts         # Mining operations
│   ├── market-data-service.ts    # Market data
│   └── ai-service.ts             # AI/ML services
│
├── types/                        # TypeScript types
│   ├── analysis.ts
│   ├── material.ts
│   └── api.ts
│
└── prisma/                       # Database schema
    ├── schema.prisma             # Prisma schema
    └── migrations/               # Database migrations
```

### Component Architecture

#### Atomic Design Principles

```
Components Hierarchy:

Atoms (Base UI)
├── Button
├── Input
├── Badge
└── Icon

Molecules (Composed)
├── SearchBar (Input + Button)
├── DataCard (Card + Badge + Text)
└── MetricDisplay (Icon + Text + Trend)

Organisms (Complex)
├── DataTable (Molecules + State)
├── AnalysisForm (Multiple Molecules)
└── NetworkVisualization (Canvas + Controls)

Templates (Layouts)
├── DashboardLayout
├── AnalysisLayout
└── AuthLayout

Pages (Complete)
├── Dashboard Page
├── Analysis Detail Page
└── Material Tracking Page
```

#### Component Example

```typescript
// Atomic: Button Component
export function Button({ variant, size, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      {...props}
    >
      {children}
    </button>
  );
}

// Molecule: Metric Card
export function MetricCard({ title, value, trend, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <TrendIndicator value={trend} />
      </CardContent>
    </Card>
  );
}

// Organism: Dashboard Metrics
export function DashboardMetrics({ data }: DashboardMetricsProps) {
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.id} {...metric} />
      ))}
    </div>
  );
}
```

### Server vs Client Components

**Server Components** (default):
```typescript
// Runs on server, can access database directly
import { prisma } from '@/lib/prisma';

export default async function AnalysisPage() {
  // Fetch data on server
  const analyses = await prisma.analysis.findMany({
    where: { status: 'completed' },
    orderBy: { createdAt: 'desc' },
  });

  return <AnalysisList analyses={analyses} />;
}
```

**Client Components** (interactive):
```typescript
'use client';

import { useState } from 'react';

export function InteractiveChart({ data }: ChartProps) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  return (
    <Chart
      data={data}
      onPointClick={setSelectedPoint}
    />
  );
}
```

## Data Architecture

### Database Schema

**Core Entities**:

```prisma
// User Management
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(USER)
  subscription  SubscriptionTier
  analyses      Analysis[]
  scenarios     Scenario[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([subscription])
  @@index([role, isActive])
}

// Supply Chain Analysis
model Analysis {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  name          String
  type          AnalysisType
  status        AnalysisStatus
  networkData   Json      # Network nodes and links
  results       Json?     # Analysis results
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId, status])
  @@index([status, createdAt])
  @@index([type, status])
}

// Scenario Planning
model Scenario {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  name          String
  type          ScenarioType
  status        ScenarioStatus
  parameters    Json
  assumptions   Json
  results       Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId, status])
  @@index([type, status])
}

// Material Tracking
model MaterialFlow {
  id            String    @id @default(cuid())
  materialCode  String    # LI, CO, CU, etc.
  source        String
  destination   String
  volume        Float
  unit          String
  leadTime      Int       # days
  status        FlowStatus
  timestamp     DateTime  @default(now())

  @@index([materialCode, timestamp])
  @@index([status, timestamp])
}

// Mining Operations
model Mine {
  id            String    @id @default(cuid())
  name          String
  country       String
  commodity     String
  status        MineStatus
  production    Float?
  capacity      Float?
  coordinates   Json      # lat, lng
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([country, status])
  @@index([commodity, status])
}

// API Keys
model ApiKey {
  id            String    @id @default(cuid())
  userId        String
  key           String    @unique
  name          String
  scopes        String[]
  lastUsed      DateTime?
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())

  @@index([userId])
  @@index([key])
}
```

### Data Flow

#### Analysis Creation Flow

```
User Action
    ↓
POST /api/analysis
    ↓
┌─────────────────────────┐
│  API Route Handler      │
│  - Validate input       │
│  - Check auth           │
│  - Check rate limit     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  Analysis Service       │
│  - Process network data │
│  - Run algorithms       │
│  - Calculate metrics    │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  Database (Prisma)      │
│  - Create analysis      │
│  - Store results        │
│  - Update user stats    │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  Cache Layer            │
│  - Invalidate user cache│
│  - Cache new results    │
└──────────┬──────────────┘
           ↓
Response (Analysis ID + Results)
```

### Caching Strategy

**Multi-Tier Caching**:

```typescript
// Level 1: Browser Cache
// - Static assets (CDN)
// - API responses (60s)

// Level 2: In-Memory Cache (LRU)
const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

// Level 3: Redis (Optional)
// - Shared cache across instances
// - Session storage
// - Rate limiting

// Level 4: Database
// - Source of truth
// - Persistent storage
```

**Cache Invalidation**:

```typescript
// Event-based invalidation
eventEmitter.on('analysis:updated', async (analysisId) => {
  await invalidateCache(`analysis:${analysisId}`);
  await invalidateCache(`user:${userId}:analyses`);
  await invalidateCache('dashboard:stats');
});

// Time-based expiration
setCache(key, value, TTL.MEDIUM);

// Pattern-based clearing
await deleteCachePattern('market-data:*');
```

## API Architecture

### RESTful Design

**Resource Naming**:
```
/api/v1/scenarios            # Collection
/api/v1/scenarios/{id}       # Resource
/api/v1/scenarios/{id}/run   # Action
```

**HTTP Methods**:
```
GET    /api/v1/scenarios     # List scenarios
POST   /api/v1/scenarios     # Create scenario
GET    /api/v1/scenarios/:id # Get scenario
PUT    /api/v1/scenarios/:id # Update scenario
DELETE /api/v1/scenarios/:id # Delete scenario
```

### API Middleware Stack

```typescript
Request
    ↓
┌─────────────────────────┐
│  1. CORS Middleware     │
│     - Allow origins     │
│     - Set headers       │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  2. Rate Limiter        │
│     - Check limit       │
│     - Update counter    │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  3. Authentication      │
│     - Verify session    │
│     - Check API key     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  4. Authorization       │
│     - Check permissions │
│     - Verify scopes     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  5. Request Validation  │
│     - Validate params   │
│     - Sanitize input    │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  6. Cache Check         │
│     - Check cache       │
│     - Return if hit     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  7. Route Handler       │
│     - Business logic    │
│     - Database queries  │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  8. Response Transform  │
│     - Format response   │
│     - Add metadata      │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  9. Cache Update        │
│     - Cache response    │
│     - Set headers       │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 10. Logging & Metrics   │
│     - Log request       │
│     - Record metrics    │
└──────────┬──────────────┘
           ↓
Response
```

### API Implementation Pattern

```typescript
// src/app/api/v1/scenarios/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';
import { scenarioService } from '@/services/scenario-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/v1/scenarios
export const GET = withAuth(
  withRateLimit(
    withCache(
      async (req: NextRequest, { user }) => {
        try {
          const { searchParams } = new URL(req.url);
          const status = searchParams.get('status');
          const page = parseInt(searchParams.get('page') || '1');
          const limit = parseInt(searchParams.get('limit') || '20');

          const scenarios = await scenarioService.list({
            userId: user.id,
            status,
            page,
            limit,
          });

          return NextResponse.json({
            success: true,
            data: scenarios,
          });
        } catch (error) {
          logger.error('Failed to list scenarios', { error, userId: user.id });
          return NextResponse.json(
            { success: false, error: 'Failed to list scenarios' },
            { status: 500 }
          );
        }
      },
      {
        ttl: 60, // Cache for 60 seconds
        keyGenerator: (req, { user }) => `scenarios:list:${user.id}`,
      }
    ),
    { limit: 100, window: 60 } // 100 requests per minute
  )
);

// POST /api/v1/scenarios
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();

    const scenario = await scenarioService.create({
      userId: user.id,
      ...body,
    });

    // Invalidate cache
    await invalidateCache(`scenarios:list:${user.id}`);

    return NextResponse.json(
      { success: true, data: scenario },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create scenario', { error, userId: user.id });
    return NextResponse.json(
      { success: false, error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
});
```

## Infrastructure

### Deployment Architecture

```
GitHub Repository
    ↓
Git Push
    ↓
┌─────────────────────────────────────────┐
│       GitHub Actions (CI/CD)            │
│  ┌───────────┐  ┌───────────┐          │
│  │   Lint    │  │   Test    │          │
│  └─────┬─────┘  └─────┬─────┘          │
│        └────────┬──────┘                │
│                 ↓                       │
│  ┌─────────────────────────┐           │
│  │    Build & Security     │           │
│  └──────────┬──────────────┘           │
└─────────────┼──────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Vercel Platform                 │
│  ┌────────────────────────────────┐    │
│  │   Build Process                │    │
│  │   - npm install                │    │
│  │   - npm run build              │    │
│  │   - Prisma generate            │    │
│  └────────────┬───────────────────┘    │
│               ↓                         │
│  ┌────────────────────────────────┐    │
│  │   Deployment                   │    │
│  │   - Deploy to Edge Network     │    │
│  │   - Update DNS                 │    │
│  │   - Run health checks          │    │
│  └────────────┬───────────────────┘    │
└───────────────┼─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│      Vercel Edge Network (Global)       │
│  ┌──────────┐  ┌──────────┐            │
│  │  US East │  │  US West │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │  Europe  │  │   Asia   │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

### Environment Configuration

**Development**:
```
Database: SQLite (local file)
Caching: In-memory LRU
Logging: Debug level
Features: All enabled
Mock Data: Optional
```

**Staging**:
```
Database: PostgreSQL (Vercel)
Caching: Redis (Upstash)
Logging: Info level
Features: All enabled (including experimental)
API Keys: Test keys
```

**Production**:
```
Database: PostgreSQL (Vercel) + Read replicas
Caching: Redis (Upstash) + Multi-region
Logging: Warn level
Features: Stable only
API Keys: Production keys
CDN: Global edge network
Monitoring: Full observability
```

## Security Architecture

### Defense in Depth

**Layer 1: Network Security**
```
- HTTPS only (TLS 1.3)
- HSTS headers
- DDoS protection (Vercel)
- Rate limiting
- IP filtering (optional)
```

**Layer 2: Application Security**
```
- Input validation
- SQL injection prevention (Prisma)
- XSS prevention (React escaping)
- CSRF protection
- Security headers
```

**Layer 3: Authentication**
```
- NextAuth.js
- Password hashing (bcrypt)
- JWT tokens
- Session management
- 2FA (optional)
```

**Layer 4: Authorization**
```
- Role-based access (RBAC)
- API key scopes
- Resource-level permissions
- Audit logging
```

**Layer 5: Data Security**
```
- Encryption at rest
- Encryption in transit
- Database access control
- Backup encryption
- PII protection
```

### Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];
```

## Performance & Scalability

### Performance Optimizations

**1. Code Splitting**
```typescript
// Lazy load heavy components
const Network3D = dynamic(() => import('@/components/visualization/network-3d'), {
  loading: () => <Skeleton3D />,
  ssr: false,
});
```

**2. Image Optimization**
```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  width={1920}
  height={1080}
  alt="Hero"
  priority
  quality={90}
  formats={['avif', 'webp']}
/>
```

**3. Database Optimization**
```prisma
// Composite indexes
@@index([userId, status])
@@index([createdAt, status])

// Efficient queries
const analyses = await prisma.analysis.findMany({
  where: { userId, status: 'completed' },
  select: { id: true, name: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

**4. API Response Caching**
```typescript
export const GET = withCache(handler, {
  ttl: 300, // 5 minutes
  tags: ['market-data'],
});
```

### Scalability Patterns

**Horizontal Scaling**:
```
Vercel auto-scales based on traffic:
- 0 concurrent requests → 1 function
- 100 concurrent requests → 10 functions
- 1000 concurrent requests → 100 functions
```

**Database Scaling**:
```
- Read replicas for heavy read operations
- Connection pooling (Prisma)
- Query optimization
- Caching layer
```

**Caching Strategy**:
```
- Browser cache: Static assets (CDN)
- API cache: Computed results (5 min)
- Database cache: Frequent queries (1 hour)
- Full-page cache: Marketing pages (24 hours)
```

## Development Workflow

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/miar/platform
cd platform

# 2. Install dependencies
npm install

# 3. Setup database
npx prisma generate
npx prisma migrate dev

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# 5. Start development server
npm run dev
```

### Branch Strategy

```
main (production)
    ↓
develop (staging)
    ↓
feature/* (feature branches)
    ↓
Local development
```

### Release Process

```
1. Feature Development
   ├─ Create feature branch
   ├─ Develop and test locally
   ├─ Create pull request
   └─ Code review

2. Testing
   ├─ Automated tests (CI)
   ├─ Manual QA (staging)
   └─ Performance testing

3. Staging Deployment
   ├─ Merge to develop
   ├─ Auto-deploy to staging
   └─ Smoke tests

4. Production Deployment
   ├─ Merge develop → main
   ├─ Manual approval
   ├─ Deploy to production
   └─ Monitor and verify

5. Post-Deployment
   ├─ Monitor metrics
   ├─ Check error rates
   └─ Validate functionality
```

### Monitoring & Observability

**Metrics**:
```
- Response times (p50, p95, p99)
- Error rates
- Request volumes
- Database query times
- Cache hit rates
- API usage per endpoint
```

**Logging**:
```typescript
logger.info('Analysis created', {
  analysisId,
  userId,
  type,
  nodeCount: nodes.length,
  duration: Date.now() - startTime,
});
```

**Alerts**:
```yaml
Alerts:
  - Error rate > 1%
  - Response time p95 > 1s
  - Database connection failures
  - API rate limit hit
  - Critical security issues
```

## Conclusion

The SOBapp platform is built on modern, scalable architecture principles:

- **Performance**: Edge-first deployment, multi-tier caching, optimized bundles
- **Security**: Defense in depth, encryption, authentication, authorization
- **Scalability**: Serverless auto-scaling, database optimization, CDN distribution
- **Reliability**: Health monitoring, automated backups, error tracking
- **Developer Experience**: Type safety, hot reload, comprehensive tooling

This architecture supports current needs while allowing for future growth and evolution.

---

**Last Updated**: October 16, 2025
