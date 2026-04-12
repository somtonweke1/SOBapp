const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function getInternalToolsAccessCode(): string {
  return (
    process.env.STONEBRIDGE_ACCESS_CODE ||
    process.env.ACCESS_CODE ||
    process.env.OPS_ACCESS_KEY ||
    process.env.INTERNAL_OPS_CODE ||
    ''
  );
}

export function areWorkplaceToolsEnabled(): boolean {
  const value = String(
    process.env.ENABLE_WORKPLACE_TOOLS ||
    process.env.ENABLE_INTERNAL_OPS ||
    process.env.ENABLE_INTERNAL_TOOLS ||
    ''
  ).trim().toLowerCase();

  return ENABLED_VALUES.has(value);
}
