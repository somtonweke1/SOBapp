# SOBapp Platform API Documentation

Comprehensive API documentation for the Mining Intelligence & Analytics (SOBapp) platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Versioning](#api-versioning)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Core APIs](#core-apis)
- [Supply Chain APIs](#supply-chain-apis)
- [Mining Intelligence APIs](#mining-intelligence-apis)
- [Market Data APIs](#market-data-apis)
- [Machine Learning APIs](#machine-learning-apis)
- [Enterprise APIs](#enterprise-apis)
- [Utility APIs](#utility-apis)

## Overview

The SOBapp platform provides a RESTful API for accessing supply chain analytics, mining intelligence, market data, and machine learning predictions.

### Base URL

```
Development:  http://localhost:3000/api
Staging:      https://staging.miar-platform.com/api
Production:   https://miar-platform.com/api
```

### API Principles

- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **JSON**: All requests and responses use JSON
- **Stateless**: No server-side session state
- **Versioned**: API version in URL path (`/api/v1/...`)
- **Secure**: HTTPS only in production
- **Rate Limited**: Protection against abuse

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-10-16T12:00:00Z",
    "version": "1.0.0"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional error information */ }
  },
  "meta": {
    "timestamp": "2025-10-16T12:00:00Z"
  }
}
```

## Authentication

### NextAuth.js

The platform uses NextAuth.js for authentication.

#### Session Authentication

For browser-based requests, use session cookies:

```typescript
// Client-side
import { useSession } from 'next-auth/react';

function Component() {
  const { data: session } = useSession();

  const response = await fetch('/api/v1/scenarios', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
```

#### API Key Authentication

For programmatic access, use API keys:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://miar-platform.com/api/v1/scenarios
```

**API Key Management**:
- Create: `POST /api/v1/api-keys`
- List: `GET /api/v1/api-keys`
- Revoke: `DELETE /api/v1/api-keys/{id}`

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "organization": "Mining Corp"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

#### GET /api/auth/[...nextauth]

NextAuth.js authentication endpoints:
- `/api/auth/signin` - Sign in page
- `/api/auth/signout` - Sign out
- `/api/auth/callback` - OAuth callbacks
- `/api/auth/session` - Get current session

## API Versioning

The API uses URL-based versioning:

```
/api/v1/resource    # Version 1 (current)
/api/v2/resource    # Version 2 (future)
```

**Version Support**:
- Current: v1
- Deprecated: None
- Sunset: None

## Rate Limiting

### Limits

| Tier | Rate Limit | Burst |
|------|------------|-------|
| Anonymous | 10 req/min | 20 |
| Free | 100 req/min | 200 |
| Pro | 1000 req/min | 2000 |
| Enterprise | Unlimited | Unlimited |

### Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634395200
```

### Rate Limit Exceeded

**Response (429)**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | User must be authenticated |
| `PERMISSION_DENIED` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `SERVICE_UNAVAILABLE` | Temporary unavailability |

## Core APIs

### Health Check

#### GET /api/health

Check system health status.

**Query Parameters**:
- `detailed` (boolean): Include detailed system information

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T12:00:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production"
}
```

**Detailed Response** (`?detailed=true`):
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency": 12 },
    "api": { "status": "up", "latency": 45 },
    "cache": { "status": "up", "latency": 3 },
    "external": { "status": "up" }
  },
  "system": {
    "uptime": 86400,
    "memoryUsage": { "heapUsed": 52428800 },
    "metricsCount": 1234,
    "alertsCount": 0
  },
  "alerts": []
}
```

#### HEAD /api/health

Lightweight health check (no body).

**Headers**:
```http
X-Health-Status: healthy
```

### Analysis

#### POST /api/analysis

Run supply chain analysis.

**Request**:
```json
{
  "networkData": {
    "nodes": [
      { "id": "supplier1", "type": "supplier", "name": "Supplier A" }
    ],
    "links": [
      { "source": "supplier1", "target": "manufacturer1" }
    ]
  },
  "options": {
    "analysisTypes": ["centrality", "bottlenecks", "resilience"],
    "parameters": {
      "timeframe": "1y",
      "includeScenarios": true
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_123",
    "results": {
      "centrality": { /* centrality metrics */ },
      "bottlenecks": [ /* bottleneck list */ ],
      "resilience": { "score": 0.85 }
    },
    "recommendations": [
      {
        "type": "diversify",
        "priority": "high",
        "description": "Diversify suppliers for critical materials"
      }
    ]
  }
}
```

### Centrality Analysis

#### GET /api/centrality

Calculate network centrality metrics.

**Query Parameters**:
- `networkId` (string, required): Network identifier
- `metric` (string): Specific metric (betweenness, degree, eigenvector, closeness)

**Response**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "betweenness": {
        "node1": 0.45,
        "node2": 0.32
      },
      "degree": {
        "node1": 8,
        "node2": 5
      }
    },
    "rankings": [
      { "nodeId": "node1", "score": 0.45, "rank": 1 },
      { "nodeId": "node2", "score": 0.32, "rank": 2 }
    ]
  }
}
```

## Supply Chain APIs

### Supply Chain GEP (Global Economic Predictions)

#### GET /api/sc-gep

Get supply chain global economic predictions.

**Query Parameters**:
- `material` (string): Specific material code (e.g., "LI", "CO", "CU")
- `region` (string): Geographic region
- `timeframe` (string): Forecast period (1y, 3y, 5y)

**Response**:
```json
{
  "success": true,
  "data": {
    "predictions": {
      "demand": {
        "current": 500000,
        "forecasted": 750000,
        "growth": 0.5
      },
      "supply": {
        "current": 480000,
        "forecasted": 650000,
        "deficit": true
      },
      "price": {
        "current": 25000,
        "forecasted": 35000,
        "volatility": 0.15
      }
    },
    "confidence": 0.87,
    "factors": [
      "EV adoption increasing",
      "New mines coming online 2026"
    ]
  }
}
```

#### GET /api/sc-gep/bottlenecks

Identify supply chain bottlenecks.

**Response**:
```json
{
  "success": true,
  "data": {
    "bottlenecks": [
      {
        "id": "bottleneck_1",
        "type": "production",
        "location": "Supplier A",
        "severity": "high",
        "impact": "30% capacity reduction",
        "mitigation": "Diversify suppliers or increase inventory"
      }
    ]
  }
}
```

#### GET /api/sc-gep/predictions

Get detailed supply chain predictions.

**Query Parameters**:
- `scenario` (string): Scenario identifier

**Response**:
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "metric": "lead_time",
        "current": 45,
        "predicted": 52,
        "unit": "days",
        "confidence": 0.92
      }
    ]
  }
}
```

#### GET /api/sc-gep/materials

Get material flow tracking data.

**Query Parameters**:
- `material` (string, required): Material code
- `includeFlow` (boolean): Include flow visualization data

**Response**:
```json
{
  "success": true,
  "data": {
    "material": {
      "code": "LI",
      "name": "Lithium",
      "category": "battery-metals"
    },
    "flow": {
      "nodes": [ /* supply chain nodes */ ],
      "links": [ /* flow connections */ ]
    },
    "metrics": {
      "totalVolume": 500000,
      "avgLeadTime": 45,
      "efficiency": 0.87
    }
  }
}
```

#### POST /api/sc-gep/export

Export supply chain analysis to PDF.

**Request**:
```json
{
  "analysisId": "analysis_123",
  "format": "pdf",
  "sections": ["executive-summary", "detailed-analysis", "recommendations"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "exportId": "export_123",
    "url": "https://miar-platform.com/exports/export_123.pdf",
    "expiresAt": "2025-10-23T12:00:00Z"
  }
}
```

#### GET /api/sc-gep/market-intelligence

Get market intelligence insights.

**Query Parameters**:
- `material` (string): Material code
- `topics` (string): Comma-separated topics

**Response**:
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "topic": "supply-disruption",
        "title": "Potential Supply Chain Disruption in Q3",
        "summary": "...",
        "source": "Industry Report 2025",
        "date": "2025-09-15",
        "relevance": 0.95
      }
    ]
  }
}
```

#### DELETE /api/sc-gep/cache

Clear supply chain cache.

**Response**:
```json
{
  "success": true,
  "data": {
    "cacheCleared": true,
    "itemsRemoved": 1234
  }
}
```

## Mining Intelligence APIs

### Mining Database

#### GET /api/mining/database

Query mining operations database.

**Query Parameters**:
- `country` (string): Filter by country
- `commodity` (string): Filter by commodity type
- `status` (string): operational, closed, exploration
- `page` (number): Page number
- `limit` (number): Results per page

**Response**:
```json
{
  "success": true,
  "data": {
    "mines": [
      {
        "id": "mine_123",
        "name": "Copper Mountain Mine",
        "country": "Chile",
        "commodity": "Copper",
        "status": "operational",
        "production": 150000,
        "coordinates": [-70.5, -33.4]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    }
  }
}
```

### Extraction Optimization

#### POST /api/mining/extraction-optimization

Analyze mining extraction efficiency.

**Request**:
```json
{
  "mineId": "mine_123",
  "data": {
    "oreGrade": 1.2,
    "recoveryRate": 0.85,
    "throughput": 50000
  },
  "optimizationGoals": ["maximize-recovery", "minimize-cost"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "currentEfficiency": 0.78,
    "optimizedEfficiency": 0.89,
    "recommendations": [
      {
        "category": "process",
        "description": "Increase grinding time by 15%",
        "impact": "+7% recovery rate",
        "cost": 250000
      }
    ],
    "roi": {
      "investment": 500000,
      "annualSavings": 1200000,
      "paybackPeriod": 5
    }
  }
}
```

### Materials Discovery

#### GET /api/mining/materials-discovery

Discover new material sources.

**Query Parameters**:
- `material` (string): Target material
- `region` (string): Geographic focus
- `exploratory` (boolean): Include exploratory sites

**Response**:
```json
{
  "success": true,
  "data": {
    "discoveries": [
      {
        "location": "Northern Territory, Australia",
        "material": "Rare Earth Elements",
        "confidence": 0.78,
        "estimatedReserves": "5M tonnes",
        "accessibility": "medium",
        "infrastructure": "limited"
      }
    ]
  }
}
```

### Tailings Analysis

#### POST /api/mining/tailings-analysis

Analyze mining tailings for recovery potential.

**Request**:
```json
{
  "mineId": "mine_123",
  "tailingsSample": {
    "composition": {
      "copper": 0.3,
      "gold": 0.02,
      "iron": 15.5
    },
    "volume": 1000000
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "economicPotential": {
      "recoverable": {
        "copper": 3000,
        "gold": 200
      },
      "value": 450000,
      "cost": 280000,
      "netValue": 170000
    },
    "recommendation": "Economically viable for reprocessing"
  }
}
```

### Market Structure

#### GET /api/mining/market-structure

Analyze mining market structure and dynamics.

**Query Parameters**:
- `commodity` (string): Commodity type
- `includeForecasts` (boolean): Include future predictions

**Response**:
```json
{
  "success": true,
  "data": {
    "marketStructure": {
      "concentration": 0.65,
      "topProducers": [
        { "name": "Company A", "share": 0.25 },
        { "name": "Company B", "share": 0.20 }
      ],
      "competitionLevel": "moderate"
    },
    "dynamics": {
      "priceVolatility": 0.18,
      "demandGrowth": 0.08,
      "supplyGrowth": 0.05
    }
  }
}
```

## Market Data APIs

### Commodities

#### GET /api/market-data/commodities

Get commodity market data.

**Query Parameters**:
- `symbols` (string): Comma-separated commodity symbols (e.g., "LI,CO,CU")
- `timeframe` (string): Data period (1d, 1w, 1m, 1y)

**Response**:
```json
{
  "success": true,
  "data": {
    "commodities": [
      {
        "symbol": "LI",
        "name": "Lithium Carbonate",
        "price": 25000,
        "change": 1250,
        "changePercent": 5.26,
        "currency": "USD",
        "unit": "tonne",
        "timestamp": "2025-10-16T12:00:00Z"
      }
    ]
  }
}
```

### Stocks

#### GET /api/market-data/stocks

Get stock market data for mining companies.

**Query Parameters**:
- `symbols` (string): Stock symbols (e.g., "BHP,RIO")
- `timeframe` (string): Data period

**Response**:
```json
{
  "success": true,
  "data": {
    "stocks": [
      {
        "symbol": "BHP",
        "name": "BHP Group",
        "price": 45.32,
        "change": 1.23,
        "changePercent": 2.79,
        "volume": 8456000,
        "marketCap": 230000000000
      }
    ]
  }
}
```

### Live Data

#### GET /api/live-data

Get real-time market data streaming.

**Query Parameters**:
- `type` (string): Data type (commodities, stocks, forex)
- `symbols` (string): Symbols to stream

**Response** (Server-Sent Events):
```
event: market-update
data: {"symbol":"LI","price":25150,"timestamp":"2025-10-16T12:00:01Z"}

event: market-update
data: {"symbol":"CO","price":42500,"timestamp":"2025-10-16T12:00:02Z"}
```

### Market Intelligence

#### GET /api/market-intelligence

Get AI-powered market intelligence.

**Query Parameters**:
- `query` (string): Intelligence query
- `sources` (string): Data sources to include

**Response**:
```json
{
  "success": true,
  "data": {
    "intelligence": {
      "summary": "Lithium prices expected to rise 15% in Q4 due to...",
      "insights": [
        "EV demand increasing 20% YoY",
        "New lithium mines delayed until 2026"
      ],
      "sources": [
        { "title": "Bloomberg Markets", "date": "2025-10-15" }
      ],
      "confidence": 0.89
    }
  }
}
```

### News Intelligence

#### GET /api/intelligence/news

Get mining and supply chain news.

**Query Parameters**:
- `topic` (string): News topic
- `from` (string): Start date (ISO 8601)
- `to` (string): End date

**Response**:
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "article_123",
        "title": "Major Copper Discovery in Peru",
        "summary": "...",
        "source": "Reuters",
        "publishedAt": "2025-10-15T14:30:00Z",
        "url": "https://...",
        "sentiment": "positive",
        "relevance": 0.95
      }
    ]
  }
}
```

## Machine Learning APIs

### Anomaly Detection

#### POST /api/ml/anomaly

Detect anomalies in supply chain or mining data.

**Request**:
```json
{
  "data": [
    { "timestamp": "2025-10-01", "value": 45.2 },
    { "timestamp": "2025-10-02", "value": 46.1 },
    { "timestamp": "2025-10-03", "value": 89.5 }
  ],
  "sensitivity": "medium"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "timestamp": "2025-10-03",
        "value": 89.5,
        "expectedRange": [44, 48],
        "deviation": 2.5,
        "severity": "high",
        "explanation": "Value significantly exceeds expected range"
      }
    ],
    "anomalyScore": 0.92
  }
}
```

### Predictive Analytics

#### POST /api/ml/predictive

Generate predictive analytics.

**Request**:
```json
{
  "model": "demand-forecast",
  "input": {
    "material": "lithium",
    "historicalData": [ /* time series data */ ],
    "externalFactors": {
      "evProduction": 15000000,
      "regulatoryChanges": true
    }
  },
  "horizon": "12m"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "period": "2025-11",
        "value": 550000,
        "confidence": [520000, 580000],
        "probability": 0.85
      }
    ],
    "modelAccuracy": 0.91,
    "factors": [
      { "name": "EV Production", "impact": 0.65 },
      { "name": "Regulatory Changes", "impact": 0.25 }
    ]
  }
}
```

#### GET /api/ml-predictions

Get pre-computed ML predictions.

**Query Parameters**:
- `type` (string): Prediction type
- `material` (string): Material code

**Response**:
```json
{
  "success": true,
  "data": {
    "predictions": [ /* prediction array */ ],
    "generatedAt": "2025-10-16T06:00:00Z",
    "validUntil": "2025-10-16T18:00:00Z"
  }
}
```

## Enterprise APIs

### Pricing

#### GET /api/enterprise/pricing

Get enterprise pricing information.

**Response**:
```json
{
  "success": true,
  "data": {
    "tiers": [
      {
        "id": "free",
        "name": "Free",
        "price": 0,
        "features": ["Basic analytics", "Limited API access"]
      },
      {
        "id": "pro",
        "name": "Professional",
        "price": 299,
        "features": ["Advanced analytics", "Full API access", "Priority support"]
      },
      {
        "id": "enterprise",
        "name": "Enterprise",
        "price": "custom",
        "features": ["Custom solutions", "Dedicated support", "SLA guarantees"]
      }
    ]
  }
}
```

### Asset Monitoring

#### GET /api/enterprise/asset-monitoring

Monitor enterprise assets and infrastructure.

**Query Parameters**:
- `assetId` (string): Specific asset ID
- `status` (string): Filter by status

**Response**:
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "asset_123",
        "name": "Processing Plant A",
        "status": "operational",
        "health": 0.95,
        "alerts": [],
        "lastMaintenance": "2025-09-15",
        "nextMaintenance": "2025-12-15"
      }
    ]
  }
}
```

### Compliance

#### GET /api/enterprise/compliance

Get compliance status and reports.

**Query Parameters**:
- `standard` (string): Compliance standard (ISO, OSHA, EPA)
- `period` (string): Reporting period

**Response**:
```json
{
  "success": true,
  "data": {
    "compliance": {
      "overall": 0.96,
      "standards": [
        {
          "name": "ISO 14001",
          "status": "compliant",
          "score": 0.98,
          "lastAudit": "2025-08-01"
        }
      ],
      "issues": [],
      "recommendations": []
    }
  }
}
```

## Utility APIs

### API Key Management

#### POST /api/v1/api-keys

Create a new API key.

**Request**:
```json
{
  "name": "Production API Key",
  "scopes": ["read:scenarios", "write:scenarios"],
  "expiresAt": "2026-10-16T00:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "id": "key_123",
      "key": "miar_live_abc123...",
      "name": "Production API Key",
      "createdAt": "2025-10-16T12:00:00Z",
      "expiresAt": "2026-10-16T00:00:00Z"
    }
  }
}
```

**⚠️ Important**: The API key is only shown once. Store it securely.

#### GET /api/v1/api-keys

List all API keys.

**Response**:
```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "id": "key_123",
        "name": "Production API Key",
        "scopes": ["read:scenarios", "write:scenarios"],
        "lastUsed": "2025-10-16T11:30:00Z",
        "createdAt": "2025-10-16T12:00:00Z",
        "expiresAt": "2026-10-16T00:00:00Z"
      }
    ]
  }
}
```

#### DELETE /api/v1/api-keys/{id}

Revoke an API key.

**Response**:
```json
{
  "success": true,
  "data": {
    "revoked": true
  }
}
```

### Scenarios

#### GET /api/v1/scenarios

List all scenarios.

**Query Parameters**:
- `status` (string): Filter by status (draft, active, archived)
- `type` (string): Scenario type
- `page` (number): Page number
- `limit` (number): Results per page

**Response**:
```json
{
  "success": true,
  "data": {
    "scenarios": [
      {
        "id": "scenario_123",
        "name": "Supply Chain Disruption Analysis",
        "type": "disruption",
        "status": "active",
        "createdAt": "2025-10-01T12:00:00Z",
        "updatedAt": "2025-10-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### POST /api/v1/scenarios

Create a new scenario.

**Request**:
```json
{
  "name": "Battery Supply Chain Analysis",
  "type": "supply-chain",
  "parameters": {
    "materials": ["lithium", "cobalt", "nickel"],
    "timeframe": "5y",
    "regions": ["Asia", "South America"]
  },
  "assumptions": [
    "EV adoption grows 25% annually",
    "New mines operational by 2027"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scenario": {
      "id": "scenario_456",
      "name": "Battery Supply Chain Analysis",
      "status": "draft",
      "createdAt": "2025-10-16T12:00:00Z"
    }
  }
}
```

#### GET /api/v1/scenarios/{id}

Get specific scenario details.

**Response**:
```json
{
  "success": true,
  "data": {
    "scenario": {
      "id": "scenario_123",
      "name": "Supply Chain Disruption Analysis",
      "type": "disruption",
      "status": "active",
      "parameters": { /* parameters */ },
      "results": { /* analysis results */ },
      "createdAt": "2025-10-01T12:00:00Z"
    }
  }
}
```

#### PUT /api/v1/scenarios/{id}

Update a scenario.

**Request**:
```json
{
  "name": "Updated Scenario Name",
  "status": "active",
  "parameters": { /* updated parameters */ }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scenario": { /* updated scenario */ }
  }
}
```

#### DELETE /api/v1/scenarios/{id}

Delete a scenario.

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### Contact

#### POST /api/contact

Submit contact form.

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Enterprise Inquiry",
  "message": "I'm interested in the Enterprise plan...",
  "company": "Mining Corp"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123",
    "status": "sent"
  }
}
```

### Notifications

#### POST /api/notifications/email

Send email notification.

**Request**:
```json
{
  "to": "user@example.com",
  "subject": "Analysis Complete",
  "template": "analysis-complete",
  "data": {
    "analysisId": "analysis_123",
    "userName": "John"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "emailId": "email_123",
    "status": "sent"
  }
}
```

### Cache Example

#### GET /api/v1/cache-example

Example endpoint demonstrating caching.

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "This response is cached",
    "timestamp": "2025-10-16T12:00:00Z",
    "cacheHit": true
  }
}
```

**Headers**:
```http
X-Cache: HIT
Cache-Control: public, max-age=300
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// Install SDK
npm install @miar/platform-sdk

// Initialize
import { SOBappClient } from '@miar/platform-sdk';

const client = new SOBappClient({
  apiKey: process.env.SOBapp_API_KEY,
  baseURL: 'https://miar-platform.com/api'
});

// Get scenarios
const scenarios = await client.scenarios.list({
  status: 'active',
  limit: 10
});

// Create scenario
const newScenario = await client.scenarios.create({
  name: 'Battery Supply Chain Analysis',
  type: 'supply-chain',
  parameters: {
    materials: ['lithium', 'cobalt'],
    timeframe: '5y'
  }
});

// Get market data
const commodities = await client.marketData.getCommodities({
  symbols: ['LI', 'CO', 'CU'],
  timeframe: '1m'
});
```

### Python

```python
# Install SDK
pip install miar-platform-sdk

# Initialize
from miar import SOBappClient

client = SOBappClient(
    api_key=os.environ['SOBapp_API_KEY'],
    base_url='https://miar-platform.com/api'
)

# Get scenarios
scenarios = client.scenarios.list(status='active', limit=10)

# Create scenario
new_scenario = client.scenarios.create(
    name='Battery Supply Chain Analysis',
    type='supply-chain',
    parameters={
        'materials': ['lithium', 'cobalt'],
        'timeframe': '5y'
    }
)

# Get market data
commodities = client.market_data.get_commodities(
    symbols=['LI', 'CO', 'CU'],
    timeframe='1m'
)
```

### cURL

```bash
# Get scenarios
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://miar-platform.com/api/v1/scenarios?status=active"

# Create scenario
curl -X POST \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name":"Battery Analysis","type":"supply-chain"}' \
     "https://miar-platform.com/api/v1/scenarios"

# Get market data
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://miar-platform.com/api/market-data/commodities?symbols=LI,CO,CU"
```

## Webhooks

### Configuration

Configure webhooks in your account settings to receive real-time notifications.

### Event Types

| Event | Description |
|-------|-------------|
| `scenario.created` | New scenario created |
| `scenario.completed` | Scenario analysis finished |
| `alert.triggered` | Monitoring alert triggered |
| `analysis.completed` | Supply chain analysis finished |
| `data.updated` | Market data updated |

### Payload Format

```json
{
  "id": "evt_123",
  "type": "scenario.completed",
  "data": {
    "scenarioId": "scenario_123",
    "status": "completed",
    "results": { /* results */ }
  },
  "timestamp": "2025-10-16T12:00:00Z",
  "signature": "sha256=..."
}
```

### Signature Verification

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}
```

## Best Practices

### API Key Security

- ✅ Store API keys in environment variables
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys regularly (every 90 days)
- ✅ Revoke unused keys immediately
- ❌ Never commit keys to version control
- ❌ Never expose keys in client-side code

### Rate Limiting

- Implement exponential backoff for retries
- Cache responses when possible
- Batch requests when appropriate
- Monitor rate limit headers

### Error Handling

```typescript
try {
  const response = await fetch('/api/v1/scenarios');
  const data = await response.json();

  if (!data.success) {
    switch (data.error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        // Wait and retry
        break;
      case 'AUTHENTICATION_REQUIRED':
        // Redirect to login
        break;
      default:
        // Handle error
    }
  }
} catch (error) {
  // Network error handling
}
```

### Pagination

```typescript
async function fetchAllScenarios() {
  const scenarios = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.scenarios.list({ page, limit: 100 });
    scenarios.push(...response.data.scenarios);
    hasMore = page < response.data.pagination.pages;
    page++;
  }

  return scenarios;
}
```

## Support

- **Documentation**: https://docs.miar-platform.com
- **API Status**: https://status.miar-platform.com
- **Support Email**: support@miar-platform.com
- **GitHub Issues**: https://github.com/miar/platform/issues

## Changelog

### v1.0.0 (2025-10-16)

- Initial API release
- 37 endpoints across 7 categories
- Authentication via NextAuth.js and API keys
- Rate limiting implementation
- Comprehensive documentation

---

*Last updated: October 16, 2025*
