import { z } from 'zod';

/**
 * Validation Schemas using Zod
 * Ensures all API inputs are properly validated
 */

// ============================================
// USER SCHEMAS
// ============================================

export const userEmailSchema = z.string().email('Invalid email address').toLowerCase();

export const userPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const userNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name too long')
  .trim();

export const userRegistrationSchema = z.object({
  email: userEmailSchema,
  password: userPasswordSchema,
  name: userNameSchema,
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

export const userLoginSchema = z.object({
  email: userEmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const userUpdateSchema = z.object({
  name: userNameSchema.optional(),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

// ============================================
// NETWORK SCHEMAS
// ============================================

export const networkIdSchema = z.string().cuid('Invalid network ID');

export const networkNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const networkEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  weight: z.number().optional(),
  label: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const networkCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  nodes: z.array(networkNodeSchema).min(1, 'At least one node required'),
  edges: z.array(networkEdgeSchema),
  metadata: z.record(z.any()).optional(),
});

export const networkUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  nodes: z.array(networkNodeSchema).optional(),
  edges: z.array(networkEdgeSchema).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// ANALYSIS SCHEMAS
// ============================================

export const analysisTypeSchema = z.enum([
  'centrality',
  'community_detection',
  'path_analysis',
  'clustering',
  'flow_optimization',
]);

export const analysisAlgorithmSchema = z.enum([
  'pagerank',
  'betweenness',
  'closeness',
  'eigenvector',
  'louvain',
  'girvan_newman',
  'dijkstra',
  'floyd_warshall',
  'kmeans',
  'dbscan',
]);

export const analysisCreateSchema = z.object({
  networkId: networkIdSchema,
  type: analysisTypeSchema,
  algorithm: analysisAlgorithmSchema,
  parameters: z.record(z.any()).optional(),
});

// ============================================
// SCENARIO SCHEMAS
// ============================================

export const scenarioTypeSchema = z.enum([
  'baseline',
  'high_demand',
  'constrained_supply',
  'rapid_expansion',
  'custom',
]);

export const scenarioCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  type: scenarioTypeSchema,
  parameters: z.object({
    materials: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
    timeHorizon: z.number().int().positive().optional(),
    budget: z.number().positive().optional(),
    constraints: z.record(z.any()).optional(),
  }),
});

// ============================================
// COMMODITY SCHEMAS
// ============================================

export const commoditySymbolSchema = z.enum([
  'LIT',
  'COB',
  'NIC',
  'COP',
  'GOLD',
  'SILVER',
  'PLATINUM',
  'PALLADIUM',
  'IRON',
  'ALUMINUM',
]);

export const commodityQuerySchema = z.object({
  symbols: z.array(commoditySymbolSchema).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  interval: z.enum(['1h', '1d', '1w', '1mo']).optional(),
});

// ============================================
// API KEY SCHEMAS
// ============================================

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  expiresAt: z.string().datetime().optional(),
});

// ============================================
// PAGINATION SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================
// EXPORT SCHEMAS
// ============================================

export const exportTypeSchema = z.enum(['pdf', 'excel', 'csv', 'json']);

export const exportRequestSchema = z.object({
  type: exportTypeSchema,
  resourceId: z.string().optional(),
  format: z.enum(['detailed', 'summary']).optional(),
  includeCharts: z.boolean().optional(),
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'Start date must be before end date',
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query is required').max(500),
  filters: z.record(z.any()).optional(),
  ...paginationSchema.shape,
});

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate request body and return typed data
 * Throws error with details if validation fails
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    throw new ValidationError('Validation failed', errors);
  }

  return result.data;
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string | string[] | undefined>
): T {
  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    throw new ValidationError('Invalid query parameters', errors);
  }

  return result.data;
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = Array.isArray(value)
        ? value.map((item) => (typeof item === 'string' ? sanitizeString(item) : item))
        : sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
