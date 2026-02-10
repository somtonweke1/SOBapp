import { hashPassword, verifyPassword, hasPermission, hasRole } from '../auth';

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword', hashed);

      expect(isValid).toBe(false);
    });

    it('should reject an empty password', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword('', hashed);

      expect(isValid).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for wildcard permission', () => {
      const permissions = JSON.stringify(['*']);
      expect(hasPermission(permissions, 'read:own')).toBe(true);
      expect(hasPermission(permissions, 'write:all')).toBe(true);
      expect(hasPermission(permissions, 'delete:any')).toBe(true);
    });

    it('should return true when user has specific permission', () => {
      const permissions = JSON.stringify(['read:own', 'write:own']);
      expect(hasPermission(permissions, 'read:own')).toBe(true);
      expect(hasPermission(permissions, 'write:own')).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      const permissions = JSON.stringify(['read:own']);
      expect(hasPermission(permissions, 'write:own')).toBe(false);
      expect(hasPermission(permissions, 'delete:own')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      const permissions = 'invalid-json';
      expect(hasPermission(permissions, 'read:own')).toBe(false);
    });

    it('should return false for empty permissions', () => {
      const permissions = JSON.stringify([]);
      expect(hasPermission(permissions, 'read:own')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user role matches exactly', () => {
      expect(hasRole('user', 'user')).toBe(true);
      expect(hasRole('manager', 'manager')).toBe(true);
      expect(hasRole('admin', 'admin')).toBe(true);
    });

    it('should return true when user role is higher', () => {
      expect(hasRole('manager', 'user')).toBe(true);
      expect(hasRole('admin', 'user')).toBe(true);
      expect(hasRole('admin', 'manager')).toBe(true);
    });

    it('should return false when user role is lower', () => {
      expect(hasRole('user', 'manager')).toBe(false);
      expect(hasRole('user', 'admin')).toBe(false);
      expect(hasRole('manager', 'admin')).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(hasRole('invalid', 'user')).toBe(false);
      expect(hasRole('user', 'invalid')).toBe(false);
    });
  });
});
