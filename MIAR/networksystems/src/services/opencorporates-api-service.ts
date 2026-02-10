/**
 * OpenCorporates API Integration
 * Provides automatic ownership discovery for BIS entities
 * Free tier: 500 requests/month
 * API Docs: https://api.opencorporates.com/documentation/API-Reference
 */

export interface OpenCorporatesCompany {
  name: string;
  companyNumber: string;
  jurisdiction: string;
  incorporationDate?: string;
  companyType?: string;
  status?: string;
  registeredAddress?: string;
  officers?: OpenCorporatesOfficer[];
  parentCompany?: string;
  subsidiaries?: string[];
  ultimateParent?: string;
}

export interface OpenCorporatesOfficer {
  name: string;
  position: string;
  startDate?: string;
  endDate?: string;
}

export interface OwnershipRelationship {
  subsidiary: string;
  parent: string;
  confidence: number; // 0-1
  source: string;
  relationship: 'parent' | 'subsidiary' | 'affiliate' | 'officer';
  evidence: string[];
}

export class OpenCorporatesAPIService {
  private readonly API_BASE_URL = 'https://api.opencorporates.com/v0.4';
  private readonly API_KEY: string | undefined;
  private readonly RATE_LIMIT_MS = 200; // 5 requests per second max (free tier)
  private lastRequestTime = 0;

  constructor(apiKey?: string) {
    // API key is optional - free tier allows 500 requests/month without key
    this.API_KEY = apiKey || process.env.OPENCORPORATES_API_KEY;
  }

  /**
   * Rate limiting to respect API limits
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
   * Search for companies by name
   */
  public async searchCompanies(name: string, jurisdiction?: string): Promise<OpenCorporatesCompany[]> {
    await this.rateLimit();

    try {
      const params = new URLSearchParams({
        q: name,
        ...(jurisdiction && { jurisdiction_code: jurisdiction }),
        ...(this.API_KEY && { api_token: this.API_KEY })
      });

      const url = `${this.API_BASE_URL}/companies/search?${params}`;
      console.log(`🔍 Searching OpenCorporates for: "${name}"`);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️  OpenCorporates rate limit exceeded');
          return [];
        }
        throw new Error(`OpenCorporates API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || !data.results.companies) {
        return [];
      }

      const companies: OpenCorporatesCompany[] = data.results.companies.map((item: any) => {
        const company = item.company;
        return {
          name: company.name,
          companyNumber: company.company_number,
          jurisdiction: company.jurisdiction_code,
          incorporationDate: company.incorporation_date,
          companyType: company.company_type,
          status: company.current_status,
          registeredAddress: company.registered_address_in_full
        };
      });

      console.log(`✅ Found ${companies.length} companies matching "${name}"`);
      return companies;

    } catch (error) {
      console.error('❌ OpenCorporates search error:', error);
      return [];
    }
  }

  /**
   * Get detailed company information including officers
   */
  public async getCompanyDetails(
    companyNumber: string,
    jurisdiction: string
  ): Promise<OpenCorporatesCompany | null> {
    await this.rateLimit();

    try {
      const params = new URLSearchParams({
        ...(this.API_KEY && { api_token: this.API_KEY })
      });

      const url = `${this.API_BASE_URL}/companies/${jurisdiction}/${companyNumber}?${params}`;
      console.log(`📊 Fetching company details: ${jurisdiction}/${companyNumber}`);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️  OpenCorporates rate limit exceeded');
          return null;
        }
        throw new Error(`OpenCorporates API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || !data.results.company) {
        return null;
      }

      const company = data.results.company;

      // Get officers
      const officers = await this.getCompanyOfficers(companyNumber, jurisdiction);

      return {
        name: company.name,
        companyNumber: company.company_number,
        jurisdiction: company.jurisdiction_code,
        incorporationDate: company.incorporation_date,
        companyType: company.company_type,
        status: company.current_status,
        registeredAddress: company.registered_address_in_full,
        officers
      };

    } catch (error) {
      console.error('❌ Company details fetch error:', error);
      return null;
    }
  }

  /**
   * Get company officers (directors, shareholders, etc.)
   */
  private async getCompanyOfficers(
    companyNumber: string,
    jurisdiction: string
  ): Promise<OpenCorporatesOfficer[]> {
    await this.rateLimit();

    try {
      const params = new URLSearchParams({
        ...(this.API_KEY && { api_token: this.API_KEY })
      });

      const url = `${this.API_BASE_URL}/companies/${jurisdiction}/${companyNumber}/officers?${params}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (!data.results || !data.results.officers) {
        return [];
      }

      return data.results.officers.map((item: any) => {
        const officer = item.officer;
        return {
          name: officer.name,
          position: officer.position,
          startDate: officer.start_date,
          endDate: officer.end_date
        };
      });

    } catch (error) {
      console.error('❌ Officers fetch error:', error);
      return [];
    }
  }

  /**
   * Discover ownership relationships for a BIS entity
   * Returns parent companies, subsidiaries, and affiliates
   */
  public async discoverOwnership(entityName: string): Promise<OwnershipRelationship[]> {
    console.log(`🔬 Discovering ownership for: "${entityName}"`);

    const relationships: OwnershipRelationship[] = [];

    try {
      // Step 1: Search for the entity
      const companies = await this.searchCompanies(entityName);

      if (companies.length === 0) {
        console.log(`⚠️  No OpenCorporates records found for "${entityName}"`);
        return [];
      }

      // Step 2: Analyze top matches
      for (const company of companies.slice(0, 3)) {
        // Get detailed info
        const details = await this.getCompanyDetails(company.companyNumber, company.jurisdiction);

        if (!details || !details.officers) {
          continue;
        }

        // Step 3: Extract parent companies from officers
        // Look for corporate officers (companies, not individuals)
        for (const officer of details.officers) {
          if (this.isCorporateOfficer(officer)) {
            const relationship: OwnershipRelationship = {
              subsidiary: entityName,
              parent: officer.name,
              confidence: 0.75, // Medium confidence from officer data
              source: 'OpenCorporates',
              relationship: 'parent',
              evidence: [
                `${officer.name} listed as ${officer.position} of ${entityName}`,
                `Source: OpenCorporates ${company.jurisdiction}/${company.companyNumber}`
              ]
            };

            relationships.push(relationship);
          }
        }

        // Step 4: Search for subsidiaries
        // Look for companies where this entity is an officer
        const potentialSubsidiaries = await this.findSubsidiaries(entityName);
        relationships.push(...potentialSubsidiaries);
      }

      console.log(`✅ Found ${relationships.length} ownership relationships for "${entityName}"`);
      return relationships;

    } catch (error) {
      console.error('❌ Ownership discovery error:', error);
      return [];
    }
  }

  /**
   * Find subsidiaries where entity is a parent/officer
   */
  private async findSubsidiaries(entityName: string): Promise<OwnershipRelationship[]> {
    // This would require searching for companies where entityName appears as an officer
    // OpenCorporates API doesn't have a direct endpoint for this, so we return empty for now
    // In production, could implement by:
    // 1. Searching for known subsidiary patterns (e.g., "Huawei Device" if entity is "Huawei Technologies")
    // 2. Using corporate network analysis
    // 3. Integrating with premium data sources

    return [];
  }

  /**
   * Check if an officer is a corporate entity (not an individual)
   */
  private isCorporateOfficer(officer: OpenCorporatesOfficer): boolean {
    const corporateKeywords = [
      'ltd', 'limited', 'inc', 'incorporated', 'corp', 'corporation',
      'llc', 'sa', 'gmbh', 'ag', 'co.', 'holdings', 'group'
    ];

    const name = officer.name.toLowerCase();
    return corporateKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Batch discover ownership for multiple entities
   * Respects rate limits and returns results as they complete
   */
  public async batchDiscoverOwnership(
    entityNames: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, OwnershipRelationship[]>> {
    console.log(`🔬 Batch ownership discovery for ${entityNames.length} entities`);

    const results = new Map<string, OwnershipRelationship[]>();
    let completed = 0;

    for (const entityName of entityNames) {
      const relationships = await this.discoverOwnership(entityName);
      results.set(entityName, relationships);

      completed++;
      if (onProgress) {
        onProgress(completed, entityNames.length);
      }

      console.log(`Progress: ${completed}/${entityNames.length}`);
    }

    console.log(`✅ Batch discovery complete: ${results.size} entities processed`);
    return results;
  }
}

// Singleton
let opencorporatesInstance: OpenCorporatesAPIService | null = null;

export function getOpenCorporatesAPI(): OpenCorporatesAPIService {
  if (!opencorporatesInstance) {
    opencorporatesInstance = new OpenCorporatesAPIService();
  }
  return opencorporatesInstance;
}

export default OpenCorporatesAPIService;
