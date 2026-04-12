function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractPossibleNames(lines: string[]): string[] {
  const names = new Set<string>();
  const pattern = /\b([A-Z][a-z]{1,20}\s+[A-Z][a-z]{1,20})\b/g;

  for (const line of lines) {
    const matches = line.match(pattern) || [];
    for (const match of matches) {
      if (match.length < 4) continue;
      names.add(match.trim());
    }
  }

  return [...names].slice(0, 5);
}

export type OwnershipContactSeed = {
  entityName: string;
  evidencePoints: string[];
};

export function buildContactCandidatesByCompany(seeds: OwnershipContactSeed[]): Map<string, string[]> {
  const output = new Map<string, string[]>();
  for (const seed of seeds) {
    const key = normalize(seed.entityName);
    if (!key) continue;
    output.set(key, extractPossibleNames(seed.evidencePoints || []));
  }
  return output;
}

export function normalizeCompanyKey(company: string): string {
  return normalize(company);
}
