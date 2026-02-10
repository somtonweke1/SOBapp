#!/usr/bin/env tsx
/**
 * GENERATE KNOWN RELATIONSHIPS FROM BIS LIST
 * Automatically creates ownership relationships for all BIS entities
 * based on pattern detection and name analysis
 */

import * as fs from 'fs';
import * as path from 'path';

interface BISEntity {
  name: string;
  country: string;
  addresses?: string;
}

interface GeneratedRelationship {
  entity: string;
  parent: string;
  confidence: number;
  source: string;
  pattern: string;
}

/**
 * Generate relationships from BIS entity list
 */
function generateRelationships(): GeneratedRelationship[] {
  // Load BIS entities
  const bisData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data/bis/entity-list-current.json'), 'utf8')
  );

  const relationships: GeneratedRelationship[] = [];

  for (const entity of bisData.entities) {
    const name = entity.name;

    // Pattern 1: Huawei subsidiaries
    if (name.match(/huawei/i)) {
      // All Huawei entities are subsidiaries of "Huawei Technologies Co., Ltd."
      relationships.push({
        entity: name,
        parent: 'Huawei Technologies Co., Ltd.',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Huawei subsidiary'
      });
    }

    // Pattern 2: CASC (China Aerospace Science and Technology Corporation)
    if (name.match(/china aerospace science and technology|casc/i)) {
      relationships.push({
        entity: name,
        parent: 'China Aerospace Science and Technology Corporation (CASC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'CASC subsidiary'
      });
    }

    // Pattern 3: CASIC (China Aerospace Science and Industry Corporation)
    if (name.match(/china aerospace science and industry|casic/i)) {
      relationships.push({
        entity: name,
        parent: 'China Aerospace Science and Industry Corporation (CASIC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'CASIC subsidiary'
      });
    }

    // Pattern 4: CETC (China Electronics Technology Group)
    if (name.match(/china electronics? technology group|cetc/i)) {
      relationships.push({
        entity: name,
        parent: 'China Electronics Technology Group Corporation (CETC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'CETC subsidiary'
      });
    }

    // Pattern 5: AVIC (Aviation Industry Corporation of China)
    if (name.match(/aviation industry corporation of china|avic/i)) {
      relationships.push({
        entity: name,
        parent: 'Aviation Industry Corporation of China (AVIC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'AVIC subsidiary'
      });
    }

    // Pattern 6: Hikvision
    if (name.match(/hikvision|haikang/i)) {
      relationships.push({
        entity: name,
        parent: 'Hangzhou Hikvision Digital Technology Co., Ltd.',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Hikvision subsidiary'
      });
    }

    // Pattern 7: Dahua
    if (name.match(/dahua/i)) {
      relationships.push({
        entity: name,
        parent: 'Zhejiang Dahua Technology Co., Ltd.',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Dahua subsidiary'
      });
    }

    // Pattern 8: DJI
    if (name.match(/\bdji\b|da jiang|dajiang/i)) {
      relationships.push({
        entity: name,
        parent: 'SZ DJI Technology Co., Ltd.',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'DJI subsidiary'
      });
    }

    // Pattern 9: ZTE
    if (name.match(/\bzte\b|zhong xing|zhongxing/i)) {
      relationships.push({
        entity: name,
        parent: 'ZTE Corporation',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'ZTE subsidiary'
      });
    }

    // Pattern 10: SMIC
    if (name.match(/semiconductor manufacturing international|smic/i)) {
      relationships.push({
        entity: name,
        parent: 'Semiconductor Manufacturing International Corporation (SMIC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'SMIC subsidiary'
      });
    }

    // Pattern 11: Inspur
    if (name.match(/inspur/i)) {
      relationships.push({
        entity: name,
        parent: 'Inspur Group Co., Ltd.',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Inspur subsidiary'
      });
    }

    // Pattern 12: CNOOC (China National Offshore Oil Corporation)
    if (name.match(/cnooc|china national offshore oil/i)) {
      relationships.push({
        entity: name,
        parent: 'China National Offshore Oil Corporation (CNOOC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'CNOOC subsidiary'
      });
    }

    // Pattern 13: CNPC (China National Petroleum Corporation)
    if (name.match(/cnpc|china national petroleum/i)) {
      relationships.push({
        entity: name,
        parent: 'China National Petroleum Corporation (CNPC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'CNPC subsidiary'
      });
    }

    // Pattern 14: CGNPC (China General Nuclear Power Corporation)
    if (name.match(/cgnpc|china general nuclear/i)) {
      relationships.push({
        entity: name,
        parent: 'China General Nuclear Power Corporation (CGNPC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'CGNPC subsidiary'
      });
    }

    // Pattern 15: Rostec (Russian)
    if (name.match(/rostec|ростех/i)) {
      relationships.push({
        entity: name,
        parent: 'Rostec State Corporation',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Rostec subsidiary'
      });
    }

    // Pattern 16: Kalashnikov (Russian)
    if (name.match(/kalashnikov|калашников/i)) {
      relationships.push({
        entity: name,
        parent: 'Kalashnikov Concern',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Kalashnikov subsidiary'
      });
    }

    // Pattern 17: Tactical Missile Corporation (Russian - 35 entities!)
    if (name.match(/tactical missile|тактическое ракетное/i)) {
      relationships.push({
        entity: name,
        parent: 'Tactical Missiles Corporation JSC',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Tactical Missile subsidiary'
      });
    }

    // Pattern 18: China State Shipbuilding Corporation (26 entities)
    if (name.match(/china state shipbuilding|cssc|中国船舶/i)) {
      relationships.push({
        entity: name,
        parent: 'China State Shipbuilding Corporation (CSSC)',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'CSSC subsidiary'
      });
    }

    // Pattern 19: United Shipbuilding Corporation (Russian - 11 entities)
    if (name.match(/united shipbuilding|объединенная судостроительная/i)) {
      relationships.push({
        entity: name,
        parent: 'United Shipbuilding Corporation JSC',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'USC subsidiary'
      });
    }

    // Pattern 20: Yangtze Memory Technologies
    if (name.match(/yangtze memory|ymtc/i)) {
      relationships.push({
        entity: name,
        parent: 'Yangtze Memory Technologies Co., Ltd.',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'YMTC subsidiary'
      });
    }

    // Pattern 21: Gazprom
    if (name.match(/gazprom|газпром/i)) {
      relationships.push({
        entity: name,
        parent: 'Gazprom PJSC',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Gazprom subsidiary'
      });
    }

    // Pattern 22: Sukhoi (Russian aircraft)
    if (name.match(/sukhoi|сухой/i)) {
      relationships.push({
        entity: name,
        parent: 'Sukhoi Company JSC',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Sukhoi subsidiary'
      });
    }

    // Pattern 23: Almaz-Antey (Russian defense)
    if (name.match(/almaz-antey|алмаз-антей/i)) {
      relationships.push({
        entity: name,
        parent: 'Almaz-Antey Air Defense Concern',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Almaz-Antey subsidiary'
      });
    }

    // Pattern 24: Cambricon (AI chips)
    if (name.match(/cambricon|寒武纪/i)) {
      relationships.push({
        entity: name,
        parent: 'Cambricon Technologies Corporation Limited',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Cambricon subsidiary'
      });
    }

    // Pattern 25: Sophgo (AI chips)
    if (name.match(/sophgo/i)) {
      relationships.push({
        entity: name,
        parent: 'Sophgo Co., Ltd.',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Sophgo subsidiary'
      });
    }

    // Pattern 26: Beijing China Aviation Technology
    if (name.match(/beijing china aviation technology/i)) {
      relationships.push({
        entity: name,
        parent: 'Beijing China Aviation Technology Co., Ltd.',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'BCAT subsidiary'
      });
    }

    // Pattern 27: Hongdu Aviation Industry
    if (name.match(/hongdu aviation|洪都航空/i)) {
      relationships.push({
        entity: name,
        parent: 'Jiangxi Hongdu Aviation Industry Group',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'Hongdu subsidiary'
      });
    }

    // Pattern 28: Myanmar Economic Corporation
    if (name.match(/myanmar economic/i)) {
      relationships.push({
        entity: name,
        parent: 'Myanmar Economic Corporation',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'MEC subsidiary'
      });
    }

    // Pattern 29: China Academy of Sciences entities
    if (name.match(/china academy of|chinese academy of|中国科学院/i)) {
      relationships.push({
        entity: name,
        parent: 'Chinese Academy of Sciences',
        confidence: 0.95,
        source: 'Name pattern analysis',
        pattern: 'CAS subsidiary'
      });
    }

    // Pattern 30: JSC prefix (Russian joint stock companies)
    if (name.match(/^JSC\s+(.+)/i)) {
      const match = name.match(/^JSC\s+(.+)/i);
      if (match) {
        // Extract parent from JSC name
        const jscName = match[1];
        // Common JSC patterns
        if (jscName.match(/concern|holding|group/i)) {
          relationships.push({
            entity: name,
            parent: `JSC ${jscName}`,
            confidence: 0.85,
            source: 'Name pattern analysis',
            pattern: 'Russian JSC entity'
          });
        }
      }
    }

    // Pattern 31: Public Joint Stock Company (Russian PJSC)
    if (name.match(/public joint stock company|pjsc/i)) {
      relationships.push({
        entity: name,
        parent: name.replace(/public joint stock company/i, 'PJSC'),
        confidence: 0.85,
        source: 'Name pattern analysis',
        pattern: 'Russian PJSC entity'
      });
    }

    // Pattern 32: Iranian entities with "Shahid" prefix (martyrs, often defense-related)
    if (name.match(/shahid\s+/i)) {
      relationships.push({
        entity: name,
        parent: 'Iranian Defense Industries Organization',
        confidence: 0.85,
        source: 'Name pattern analysis',
        pattern: 'Iranian defense entity'
      });
    }
  }

  return relationships;
}

/**
 * Generate TypeScript code for known relationships
 */
function generateTypeScriptCode(relationships: GeneratedRelationship[]): string {
  // Group by parent
  const byParent = new Map<string, GeneratedRelationship[]>();

  for (const rel of relationships) {
    if (!byParent.has(rel.parent)) {
      byParent.set(rel.parent, []);
    }
    byParent.get(rel.parent)!.push(rel);
  }

  let code = `/**
 * AUTO-GENERATED KNOWN RELATIONSHIPS
 * Generated from BIS Entity List
 * DO NOT EDIT MANUALLY - Run: npx tsx scripts/generate-known-relationships.ts
 *
 * Generated: ${new Date().toISOString()}
 * Total Relationships: ${relationships.length}
 * Total Parent Companies: ${byParent.size}
 */

export interface AutoGeneratedRelationship {
  entity: string;
  parent: string;
  confidence: number;
}

export const AUTO_GENERATED_RELATIONSHIPS: AutoGeneratedRelationship[] = [\n`;

  for (const rel of relationships) {
    code += `  { entity: ${JSON.stringify(rel.entity)}, parent: ${JSON.stringify(rel.parent)}, confidence: ${rel.confidence} },\n`;
  }

  code += `];\n\n`;

  // Add lookup function
  code += `/**
 * Find parent company for an entity
 */
export function findAutoGeneratedParent(entityName: string): string | null {
  const normalized = entityName.toLowerCase().trim();

  for (const rel of AUTO_GENERATED_RELATIONSHIPS) {
    if (rel.entity.toLowerCase() === normalized) {
      return rel.parent;
    }
  }

  return null;
}

export default AUTO_GENERATED_RELATIONSHIPS;
`;

  return code;
}

/**
 * Main
 */
function main() {
  console.log('🚀 GENERATING KNOWN RELATIONSHIPS FROM BIS LIST\\n');

  const relationships = generateRelationships();

  console.log(`✅ Generated ${relationships.length} relationships`);

  // Count by pattern
  const patternCounts = new Map<string, number>();
  for (const rel of relationships) {
    patternCounts.set(rel.pattern, (patternCounts.get(rel.pattern) || 0) + 1);
  }

  console.log('\\n📊 Breakdown by pattern:');
  for (const [pattern, count] of patternCounts.entries()) {
    console.log(`   ${pattern}: ${count}`);
  }

  // Generate TypeScript code
  const code = generateTypeScriptCode(relationships);

  // Write to file
  const outputPath = path.join(process.cwd(), 'src/data/auto-generated-relationships.ts');
  fs.writeFileSync(outputPath, code, 'utf8');

  console.log(`\\n✅ Written to: ${outputPath}`);
  console.log('\\n🎯 Expected Coverage Boost: +${relationships.length} entities (${(relationships.length / 3421 * 100).toFixed(1)}%)\\n');
}

main();
