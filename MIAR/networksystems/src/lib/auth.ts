import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Check if user has required permission
 * @param userPermissions - JSON string of user permissions
 * @param requiredPermission - Permission to check
 * @returns True if user has permission
 */
export function hasPermission(
  userPermissions: string,
  requiredPermission: string
): boolean {
  try {
    const permissions = JSON.parse(userPermissions) as string[];
    return permissions.includes(requiredPermission) || permissions.includes('*');
  } catch {
    return false;
  }
}

/**
 * Check if user has required role
 * @param userRole - User's role
 * @param requiredRole - Required role (admin > manager > user)
 * @returns True if user has sufficient role
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    user: 1,
    manager: 2,
    admin: 3,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}
