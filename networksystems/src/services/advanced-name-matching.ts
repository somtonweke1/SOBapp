/**
 * ADVANCED NAME MATCHING WITH TRANSLITERATION
 * Handles Chinese, Russian, and other non-Latin company names
 * Implements sophisticated fuzzy matching algorithms
 */

export interface NameMatchResult {
  matched: boolean;
  similarity: number; // 0-1
  matchType: 'exact' | 'fuzzy' | 'transliteration' | 'pattern';
  confidence: number; // 0-1
  evidence: string[];
}

export class AdvancedNameMatching {

  /**
   * Match two company names with advanced algorithms
   */
  public match(name1: string, name2: string): NameMatchResult {
    const result: NameMatchResult = {
      matched: false,
      similarity: 0,
      matchType: 'exact',
      confidence: 0,
      evidence: []
    };

    // Normalize both names
    const norm1 = this.normalize(name1);
    const norm2 = this.normalize(name2);

    // 1. Exact match
    if (norm1 === norm2) {
      result.matched = true;
      result.similarity = 1.0;
      result.matchType = 'exact';
      result.confidence = 1.0;
      result.evidence.push('Exact match');
      return result;
    }

    // 2. Fuzzy match with Levenshtein distance
    const fuzzyScore = this.levenshteinSimilarity(norm1, norm2);
    if (fuzzyScore > 0.85) {
      result.matched = true;
      result.similarity = fuzzyScore;
      result.matchType = 'fuzzy';
      result.confidence = fuzzyScore;
      result.evidence.push(`High fuzzy match similarity: ${(fuzzyScore * 100).toFixed(1)}%`);
      return result;
    }

    // 3. Transliteration variants (Chinese/Russian)
    const transScore = this.transliterationMatch(name1, name2);
    if (transScore > 0.8) {
      result.matched = true;
      result.similarity = transScore;
      result.matchType = 'transliteration';
      result.confidence = transScore;
      result.evidence.push('Transliteration variant detected');
      return result;
    }

    // 4. Pattern-based matching (subsidiaries, regional offices)
    const patternScore = this.patternMatch(norm1, norm2);
    if (patternScore > 0.75) {
      result.matched = true;
      result.similarity = patternScore;
      result.matchType = 'pattern';
      result.confidence = patternScore * 0.9; // Lower confidence for pattern matching
      result.evidence.push('Pattern-based match (likely related entity)');
      return result;
    }

    // No match
    result.similarity = Math.max(fuzzyScore, transScore, patternScore);
    return result;
  }

  /**
   * Normalize company name (remove punctuation, lowercase, etc.)
   */
  private normalize(name: string): string {
    return name
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b(inc|ltd|llc|corp|corporation|limited|co|company|gmbh|sa|spa|bv|ag|plc|se)\b/gi, '') // Remove legal entities
      .trim();
  }

  /**
   * Levenshtein distance similarity
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    return 1 - (distance / maxLength);
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Transliteration matching for Chinese/Russian names
   */
  private transliterationMatch(name1: string, name2: string): number {
    // Common Chinese company name transliterations
    const chineseVariants: Record<string, string[]> = {
      'huawei': ['华为', 'hua wei', 'hw'],
      'zte': ['中兴', 'zhong xing', 'zhongxing'],
      'hikvision': ['海康威视', 'haikang weishi', 'hkws'],
      'dji': ['大疆', 'da jiang', 'dajiang'],
      'smic': ['中芯国际', 'zhongxin guoji'],
      'semiconductor': ['半导体', 'bandaoti']
    };

    // Common Russian transliteration variants
    const russianVariants: Record<string, string[]> = {
      'rostec': ['ростех', 'rostech', 'rosteс'],
      'kalashnikov': ['калашников', 'kalashnykov'],
      'sukhoi': ['сухой', 'soukhoï', 'sukhoy']
    };

    const norm1 = this.normalize(name1);
    const norm2 = this.normalize(name2);

    // Check Chinese variants
    for (const [key, variants] of Object.entries(chineseVariants)) {
      if (norm1.includes(key) || variants.some(v => norm1.includes(v))) {
        if (norm2.includes(key) || variants.some(v => norm2.includes(v))) {
          return 0.9;
        }
      }
    }

    // Check Russian variants
    for (const [key, variants] of Object.entries(russianVariants)) {
      if (norm1.includes(key) || variants.some(v => norm1.includes(v))) {
        if (norm2.includes(key) || variants.some(v => norm2.includes(v))) {
          return 0.9;
        }
      }
    }

    return 0;
  }

  /**
   * Pattern-based matching (e.g., "Huawei Device" matches "Huawei Technologies")
   */
  private patternMatch(norm1: string, norm2: string): number {
    // Extract base company name (longest common substring)
    const base1 = this.extractBaseName(norm1);
    const base2 = this.extractBaseName(norm2);

    if (base1 && base2 && base1 === base2) {
      return 0.85;
    }

    // Check if one contains the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return 0.8;
    }

    // Check for common tokens
    const tokens1 = norm1.split(' ').filter(t => t.length > 3);
    const tokens2 = norm2.split(' ').filter(t => t.length > 3);

    const commonTokens = tokens1.filter(t => tokens2.includes(t));

    if (commonTokens.length >= 2) {
      return 0.75;
    } else if (commonTokens.length === 1) {
      return 0.6;
    }

    return 0;
  }

  /**
   * Extract base company name (remove suffixes like "Device", "Software", etc.)
   */
  private extractBaseName(name: string): string | null {
    const suffixes = [
      'device', 'software', 'hardware', 'services', 'solutions',
      'systems', 'technology', 'technologies', 'international',
      'america', 'europe', 'asia', 'usa', 'china', 'japan',
      'germany', 'france', 'uk', 'russia'
    ];

    const words = name.split(' ');

    // Remove suffix words
    const filteredWords = words.filter(w => !suffixes.includes(w));

    // Return longest substring
    if (filteredWords.length > 0) {
      return filteredWords.join(' ');
    }

    return null;
  }

  /**
   * Batch match a list of names against a target
   */
  public batchMatch(targetName: string, candidates: string[]): Array<{name: string; result: NameMatchResult}> {
    return candidates
      .map(candidate => ({
        name: candidate,
        result: this.match(targetName, candidate)
      }))
      .filter(item => item.result.matched)
      .sort((a, b) => b.result.similarity - a.result.similarity);
  }
}

// Singleton
let advancedNameMatchingInstance: AdvancedNameMatching | null = null;

export function getAdvancedNameMatching(): AdvancedNameMatching {
  if (!advancedNameMatchingInstance) {
    advancedNameMatchingInstance = new AdvancedNameMatching();
  }
  return advancedNameMatchingInstance;
}

export default AdvancedNameMatching;
