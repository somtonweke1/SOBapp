import {
  userRegistrationSchema,
  userLoginSchema,
  networkCreateSchema,
  scenarioCreateSchema,
  validateRequestBody,
  ValidationError,
  sanitizeString,
  sanitizeObject,
} from '../validation';

describe('Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    it('should validate a valid registration', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'John Doe',
        company: 'Test Corp',
      };

      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123',
        name: 'John Doe',
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const weakPasswords = [
        'short',           // Too short
        'nouppercase1',    // No uppercase
        'NOLOWERCASE1',    // No lowercase
        'NoNumbers',       // No numbers
      ];

      weakPasswords.forEach((password) => {
        const data = {
          email: 'test@example.com',
          password,
          name: 'John Doe',
        };

        const result = userRegistrationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should reject short name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'J',
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should make email lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123',
        name: 'John Doe',
      };

      const result = userRegistrationSchema.safeParse(data);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('userLoginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = userLoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('networkCreateSchema', () => {
    it('should validate a valid network', () => {
      const validData = {
        name: 'Test Network',
        description: 'A test network',
        nodes: [
          { id: '1', label: 'Node 1' },
          { id: '2', label: 'Node 2' },
        ],
        edges: [
          { source: '1', target: '2' },
        ],
      };

      const result = networkCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject network with no nodes', () => {
      const invalidData = {
        name: 'Test Network',
        nodes: [],
        edges: [],
      };

      const result = networkCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject network with empty name', () => {
      const invalidData = {
        name: '',
        nodes: [{ id: '1', label: 'Node 1' }],
        edges: [],
      };

      const result = networkCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('scenarioCreateSchema', () => {
    it('should validate a valid scenario', () => {
      const validData = {
        name: 'Test Scenario',
        description: 'A test scenario',
        type: 'baseline',
        parameters: {
          materials: ['lithium', 'cobalt'],
          timeHorizon: 5,
          budget: 1000000,
        },
      };

      const result = scenarioCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid scenario type', () => {
      const invalidData = {
        name: 'Test Scenario',
        type: 'invalid_type',
        parameters: {},
      };

      const result = scenarioCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid scenario types', () => {
      const validTypes = ['baseline', 'high_demand', 'constrained_supply', 'rapid_expansion', 'custom'];

      validTypes.forEach((type) => {
        const data = {
          name: 'Test Scenario',
          type,
          parameters: {},
        };

        const result = scenarioCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validateRequestBody', () => {
    it('should return validated data for valid input', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'John Doe',
      };

      const result = validateRequestBody(userRegistrationSchema, data);
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should throw ValidationError for invalid input', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'weak',
      };

      expect(() => {
        validateRequestBody(userRegistrationSchema, invalidData);
      }).toThrow(ValidationError);
    });

    it('should include error details in ValidationError', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'weak',
      };

      try {
        validateRequestBody(userRegistrationSchema, invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors.length).toBeGreaterThan(0);
          expect(error.errors[0]).toHaveProperty('path');
          expect(error.errors[0]).toHaveProperty('message');
        }
      }
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize XSS attempts', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should escape HTML entities', () => {
      const input = '< > " \' /';
      const sanitized = sanitizeString(input);
      expect(sanitized).toBe('&lt; &gt; &quot; &#x27; &#x2F;');
    });

    it('should handle normal text without changes', () => {
      const normalText = 'Hello World 123';
      const sanitized = sanitizeString(normalText);
      expect(sanitized).toBe(normalText);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string fields', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        description: 'Normal text',
        nested: {
          value: '<img src=x onerror=alert(1)>',
        },
      };

      const sanitized = sanitizeObject(input);
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.description).toBe('Normal text');
      expect(sanitized.nested.value).not.toContain('<img');
    });

    it('should handle arrays', () => {
      const input = {
        tags: ['<script>xss</script>', 'normal'],
      };

      const sanitized = sanitizeObject(input);
      expect(sanitized.tags[0]).not.toContain('<script>');
      expect(sanitized.tags[1]).toBe('normal');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'Test',
        count: 42,
        active: true,
        data: null,
      };

      const sanitized = sanitizeObject(input);
      expect(sanitized.count).toBe(42);
      expect(sanitized.active).toBe(true);
      expect(sanitized.data).toBeNull();
    });
  });
});
