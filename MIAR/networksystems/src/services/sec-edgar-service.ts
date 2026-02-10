/**
 * SEC EDGAR Integration
 * Extract ownership relationships from US company filings
 * FREE - No API key required
 * API Docs: https://www.sec.gov/edgar/sec-api-documentation
 */

import type { OwnershipEdge } from './ownership-graph-service';

export interface SECCompany {
  cik: string; // Central Index Key
  name: string;
  ticker?: string;
  sic: string; // Standard Industrial Classification
  filings: SECFiling[];
}

export interface SECFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string; // 10-K, 10-Q, 8-K, etc.
  fileNumber: string;
  items?: string;
}

export interface SECOwnership {
  parentCompany: string;
  subsidiaries: string[];
  foreignParent?: string;
  ultimateParent?: string;
  confidence: number;
  source: string;
  filingDate: string;
}

export class SECEdgarService {
  private readonly API_BASE_URL = 'https://data.sec.gov';
  private readonly USER_AGENT = 'MIAR Supply Chain Scanner contact@miar.ai'; // Required by SEC
  private readonly RATE_LIMIT_MS = 100; // SEC requires max 10 requests/second
  private lastRequestTime = 0;

  /**
   * Rate limiting to respect SEC rules
   */
  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Search for company by name or ticker
   */
  public async searchCompany(nameOrTicker: string): Promise<SECCompany | null> {
    await this.rateLimit();

    try {
      console.log(`🔍 Searching SEC EDGAR for: "${nameOrTicker}"`);

      // Get company CIK from company tickers JSON
      const tickersUrl = `${this.API_BASE_URL}/files/company_tickers.json`;

      const response = await fetch(tickersUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SEC API error: ${response.status}`);
      }

      const data = await response.json();

      // Search for matching company
      const searchTerm = nameOrTicker.toLowerCase();
      let matchedCompany: any = null;

      for (const key in data) {
        const company = data[key];
        const companyName = company.title?.toLowerCase() || '';
        const ticker = company.ticker?.toLowerCase() || '';

        if (companyName.includes(searchTerm) || ticker === searchTerm) {
          matchedCompany = company;
          break;
        }
      }

      if (!matchedCompany) {
        console.log(`⚠️  No SEC records found for "${nameOrTicker}"`);
        return null;
      }

      // Format CIK with leading zeros (10 digits)
      const cik = String(matchedCompany.cik_str).padStart(10, '0');

      console.log(`✅ Found: ${matchedCompany.title} (CIK: ${cik})`);

      return {
        cik,
        name: matchedCompany.title,
        ticker: matchedCompany.ticker,
        sic: String(matchedCompany.sic || ''),
        filings: []
      };

    } catch (error) {
      console.error('❌ SEC search error:', error);
      return null;
    }
  }

  /**
   * Get recent filings for a company
   */
  public async getRecentFilings(cik: string, formType?: string): Promise<SECFiling[]> {
    await this.rateLimit();

    try {
      const formattedCIK = cik.padStart(10, '0');
      const submissionsUrl = `${this.API_BASE_URL}/submissions/CIK${formattedCIK}.json`;

      console.log(`📊 Fetching filings for CIK: ${formattedCIK}`);

      const response = await fetch(submissionsUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SEC API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.filings || !data.filings.recent) {
        return [];
      }

      const recent = data.filings.recent;
      const filings: SECFiling[] = [];

      // SEC returns parallel arrays
      const count = recent.accessionNumber.length;

      for (let i = 0; i < count; i++) {
        const form = recent.form[i];

        // Filter by form type if specified
        if (formType && form !== formType) {
          continue;
        }

        filings.push({
          accessionNumber: recent.accessionNumber[i],
          filingDate: recent.filingDate[i],
          reportDate: recent.reportDate[i],
          form,
          fileNumber: recent.fileNumber[i],
          items: recent.items?.[i]
        });
      }

      console.log(`✅ Found ${filings.length} filings`);
      return filings;

    } catch (error) {
      console.error('❌ Filings fetch error:', error);
      return [];
    }
  }

  /**
   * Extract ownership from 10-K filing
   * 10-K contains "Exhibit 21" which lists subsidiaries
   */
  public async extractOwnershipFrom10K(cik: string): Promise<SECOwnership | null> {
    try {
      console.log(`🔬 Extracting ownership from 10-K for CIK: ${cik}`);

      // Get most recent 10-K filing
      const filings = await this.getRecentFilings(cik, '10-K');

      if (filings.length === 0) {
        console.log('⚠️  No 10-K filings found');
        return null;
      }

      const latest10K = filings[0];
      console.log(`📄 Analyzing 10-K filed on: ${latest10K.filingDate}`);

      // Get filing documents
      const accessionNo = latest10K.accessionNumber.replace(/-/g, '');
      const documentsUrl = `${this.API_BASE_URL}/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=10-K&dateb=&owner=exclude&count=1&search_text=`;

      // In production, would:
      // 1. Download the full 10-K HTML/XML
      // 2. Parse for "Exhibit 21 - Subsidiaries"
      // 3. Extract subsidiary names and jurisdictions
      // 4. Return structured ownership data

      // For now, return placeholder showing the pattern
      // This requires HTML/XML parsing which we'll implement next

      console.log('⚠️  Full 10-K parsing not yet implemented');
      console.log('   Pattern: Look for "Exhibit 21" or "Subsidiaries of the Registrant"');

      return null;

    } catch (error) {
      console.error('❌ 10-K extraction error:', error);
      return null;
    }
  }

  /**
   * Find US subsidiaries of foreign BIS entities
   * Search for companies with foreign parent companies
   */
  public async findUSSubsidiaries(foreignParentName: string): Promise<OwnershipEdge[]> {
    console.log(`🔍 Searching for US subsidiaries of: "${foreignParentName}"`);

    const relationships: OwnershipEdge[] = [];

    try {
      // Strategy 1: Search for companies with similar names
      // E.g., "Huawei Device USA" for parent "Huawei Technologies"

      const searchVariants = this.generateUSSubsidiaryNames(foreignParentName);

      for (const variant of searchVariants) {
        const company = await this.searchCompany(variant);

        if (company) {
          const relationship: OwnershipEdge = {
            from: company.name,
            to: foreignParentName,
            relationshipType: 'parent',
            confidence: 0.7, // Medium confidence from name matching
            source: 'SEC EDGAR',
            evidence: [
              `US company "${company.name}" matches pattern for subsidiary of "${foreignParentName}"`,
              `SEC CIK: ${company.cik}`,
              'Requires verification via 10-K Exhibit 21'
            ]
          };

          relationships.push(relationship);
        }
      }

      console.log(`✅ Found ${relationships.length} potential US subsidiaries`);
      return relationships;

    } catch (error) {
      console.error('❌ US subsidiary search error:', error);
      return [];
    }
  }

  /**
   * Generate likely US subsidiary name variants
   */
  private generateUSSubsidiaryNames(foreignParent: string): string[] {
    // Remove common suffixes
    const baseName = foreignParent
      .replace(/\b(technologies|technology|corp|corporation|ltd|limited|co\.?|inc)\b/gi, '')
      .trim();

    const variants = [
      `${baseName} USA`,
      `${baseName} Americas`,
      `${baseName} Inc`,
      `${baseName} Corporation`,
      `${foreignParent} USA`,
      `${foreignParent} Americas`
    ];

    return variants;
  }

  /**
   * Batch process multiple entities
   */
  public async batchFindSubsidiaries(
    foreignParents: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, OwnershipEdge[]>> {
    console.log(`🔬 Batch SEC search for ${foreignParents.length} entities`);

    const results = new Map<string, OwnershipEdge[]>();
    let completed = 0;

    for (const parent of foreignParents) {
      const subsidiaries = await this.findUSSubsidiaries(parent);
      results.set(parent, subsidiaries);

      completed++;
      if (onProgress) {
        onProgress(completed, foreignParents.length);
      }

      console.log(`Progress: ${completed}/${foreignParents.length}`);
    }

    console.log(`✅ Batch complete: ${results.size} entities processed`);
    return results;
  }
}

// Singleton
let secEdgarInstance: SECEdgarService | null = null;

export function getSECEdgar(): SECEdgarService {
  if (!secEdgarInstance) {
    secEdgarInstance = new SECEdgarService();
  }
  return secEdgarInstance;
}

export default SECEdgarService;
