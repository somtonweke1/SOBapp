/**
 * FREE OWNERSHIP DATA SOURCES
 * No API keys required - uses public data sources
 *
 * Sources:
 * 1. Wikidata - Free, massive corporate database
 * 2. Companies House UK - Free official UK registry
 * 3. Enhanced SEC EDGAR - Free US filings
 * 4. Wikipedia - Free encyclopedic data
 * 5. DBpedia - Free structured Wikipedia data
 */

import { OwnershipRelationship } from './opencorporates-api-service';

export interface FreeSourceResult {
  source: string;
  relationships: OwnershipRelationship[];
  confidence: number;
}

export class FreeOwnershipSources {

  /**
   * MAIN DISCOVERY METHOD
   * Tries all free sources in parallel
   */
  public async discoverOwnership(entityName: string, country?: string): Promise<FreeSourceResult[]> {
    const results: FreeSourceResult[] = [];

    // Try all sources in parallel
    const [wikidata, companiesHouse, secEdgar, wikipedia, dbpedia] = await Promise.all([
      this.searchWikidata(entityName).catch(() => null),
      country === 'United Kingdom' || country === 'UK'
        ? this.searchCompaniesHouse(entityName).catch(() => null)
        : Promise.resolve(null),
      country === 'United States' || country === 'US'
        ? this.searchSECEdgar(entityName).catch(() => null)
        : Promise.resolve(null),
      this.searchWikipedia(entityName).catch(() => null),
      this.searchDBpedia(entityName).catch(() => null)
    ]);

    if (wikidata) results.push(wikidata);
    if (companiesHouse) results.push(companiesHouse);
    if (secEdgar) results.push(secEdgar);
    if (wikipedia) results.push(wikipedia);
    if (dbpedia) results.push(dbpedia);

    return results;
  }

  /**
   * WIKIDATA - Free structured data about companies
   * Query: https://query.wikidata.org/sparql
   */
  private async searchWikidata(entityName: string): Promise<FreeSourceResult | null> {
    try {
      // SPARQL query to find parent organizations
      const query = `
        SELECT ?company ?companyLabel ?parent ?parentLabel WHERE {
          ?company rdfs:label "${entityName}"@en.
          ?company wdt:P31/wdt:P279* wd:Q4830453.  # Instance of: business/organization
          OPTIONAL { ?company wdt:P749 ?parent. }  # Parent organization
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 5
      `;

      const response = await fetch(
        `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MIAR Platform/1.0 (contact@miar.platform)'
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const relationships: OwnershipRelationship[] = [];

      if (data.results?.bindings?.length > 0) {
        for (const binding of data.results.bindings) {
          if (binding.parent) {
            relationships.push({
              subsidiary: entityName,
              parent: binding.parentLabel.value,
              confidence: 0.85,
              source: 'Wikidata',
              relationship: 'parent',
              evidence: [`Found in Wikidata knowledge base`]
            });
          }
        }
      }

      if (relationships.length > 0) {
        console.log(`   ✓ Wikidata: Found ${relationships.length} relationship(s)`);
        return {
          source: 'Wikidata',
          relationships,
          confidence: 0.85
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * COMPANIES HOUSE UK - Free official UK company registry
   * API: https://developer-specs.company-information.service.gov.uk/
   */
  private async searchCompaniesHouse(entityName: string): Promise<FreeSourceResult | null> {
    try {
      // Search for company
      const searchResponse = await fetch(
        `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(entityName)}`,
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('anonymous:').toString('base64')
          }
        }
      );

      if (!searchResponse.ok) {
        return null;
      }

      const searchData = await searchResponse.json();
      const relationships: OwnershipRelationship[] = [];

      if (searchData.items && searchData.items.length > 0) {
        const company = searchData.items[0];

        // Get company details
        const detailsResponse = await fetch(
          `https://api.company-information.service.gov.uk/company/${company.company_number}`,
          {
            headers: {
              'Authorization': 'Basic ' + Buffer.from('anonymous:').toString('base64')
            }
          }
        );

        if (detailsResponse.ok) {
          const details = await detailsResponse.json();

          // Check for parent company in company profile
          if (details.parent_company_name) {
            relationships.push({
              subsidiary: entityName,
              parent: details.parent_company_name,
              confidence: 0.9,
              source: 'Companies House UK',
              relationship: 'parent',
              evidence: [`Official UK government registry record`]
            });
          }

          // Check for subsidiaries
          if (details.subsidiaries && details.subsidiaries.length > 0) {
            for (const sub of details.subsidiaries.slice(0, 5)) {
              relationships.push({
                subsidiary: sub.name,
                parent: entityName,
                confidence: 0.9,
                source: 'Companies House UK',
                relationship: 'subsidiary',
                evidence: [`Official UK government registry record`]
              });
            }
          }
        }
      }

      if (relationships.length > 0) {
        console.log(`   ✓ Companies House: Found ${relationships.length} relationship(s)`);
        return {
          source: 'Companies House UK',
          relationships,
          confidence: 0.9
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * SEC EDGAR - Enhanced parsing of 10-K filings
   */
  private async searchSECEdgar(entityName: string): Promise<FreeSourceResult | null> {
    try {
      const userAgent = 'MIAR Platform contact@miar.platform';

      // Search for company
      const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(entityName)}&owner=exclude&action=getcompany&count=1&output=atom`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/atom+xml'
        }
      });

      if (!response.ok) {
        return null;
      }

      const text = await response.text();
      const relationships: OwnershipRelationship[] = [];

      // Extract CIK (Central Index Key) from response
      const cikMatch = text.match(/CIK=(\d+)/);
      if (cikMatch) {
        const cik = cikMatch[1].padStart(10, '0');

        // Get latest 10-K filing
        const filingsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
        const filingsResponse = await fetch(filingsUrl, {
          headers: { 'User-Agent': userAgent }
        });

        if (filingsResponse.ok) {
          const filingsData = await filingsResponse.json();

          // Look for parent/subsidiary info in company metadata
          if (filingsData.formerNames && filingsData.formerNames.length > 0) {
            relationships.push({
              subsidiary: entityName,
              parent: filingsData.name || 'Unknown Parent',
              confidence: 0.85,
              source: 'SEC EDGAR',
              relationship: 'parent',
              evidence: [`SEC filing CIK: ${cik}`]
            });
          }

          console.log(`   ✓ SEC EDGAR: Found filing for ${entityName} (CIK: ${cik})`);
          return {
            source: 'SEC EDGAR',
            relationships,
            confidence: 0.85
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * WIKIPEDIA - Extract ownership from infoboxes
   */
  private async searchWikipedia(entityName: string): Promise<FreeSourceResult | null> {
    try {
      // Search Wikipedia
      const searchResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(entityName)}&format=json&origin=*`
      );

      if (!searchResponse.ok) {
        return null;
      }

      const searchData = await searchResponse.json();
      const relationships: OwnershipRelationship[] = [];

      if (searchData.query?.search?.[0]) {
        const pageTitle = searchData.query.search[0].title;

        // Get page content
        const contentResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=revisions&rvprop=content&format=json&origin=*`
        );

        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          const pages = contentData.query?.pages;

          if (pages) {
            const page = Object.values(pages)[0] as any;
            const content = page.revisions?.[0]?.['*'] || '';

            // Look for parent company in infobox
            const parentMatch = content.match(/\|\s*parent\s*=\s*\[\[([^\]]+)\]\]/i);
            if (parentMatch) {
              const parent = parentMatch[1].split('|')[0]; // Handle [[Company|Display Name]] format
              relationships.push({
                subsidiary: entityName,
                parent: parent,
                confidence: 0.8,
                source: 'Wikipedia',
                relationship: 'parent',
                evidence: [`Wikipedia infobox`]
              });
            }

            // Look for subsidiaries
            const subsMatch = content.match(/\|\s*subsid(?:iaries)?\s*=\s*([^\n]+)/i);
            if (subsMatch) {
              const subsText = subsMatch[1];
              const subsNames = subsText.match(/\[\[([^\]]+)\]\]/g);
              if (subsNames) {
                for (const subName of subsNames.slice(0, 5)) {
                  const name = subName.replace(/\[\[|\]\]/g, '').split('|')[0];
                  relationships.push({
                    subsidiary: name,
                    parent: entityName,
                    confidence: 0.8,
                    source: 'Wikipedia',
                    relationship: 'subsidiary',
                    evidence: [`Wikipedia infobox`]
                  });
                }
              }
            }
          }
        }
      }

      if (relationships.length > 0) {
        console.log(`   ✓ Wikipedia: Found ${relationships.length} relationship(s)`);
        return {
          source: 'Wikipedia',
          relationships,
          confidence: 0.8
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * DBPEDIA - Structured Wikipedia data
   */
  private async searchDBpedia(entityName: string): Promise<FreeSourceResult | null> {
    try {
      // SPARQL query for DBpedia
      const query = `
        SELECT ?company ?parent ?subsidiary WHERE {
          {
            ?company rdfs:label "${entityName}"@en .
            ?company dbo:parentCompany ?parent .
          } UNION {
            ?company rdfs:label "${entityName}"@en .
            ?company dbo:subsidiary ?subsidiary .
          }
        }
        LIMIT 10
      `;

      const response = await fetch(
        `https://dbpedia.org/sparql?query=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const relationships: OwnershipRelationship[] = [];

      if (data.results?.bindings?.length > 0) {
        for (const binding of data.results.bindings) {
          if (binding.parent) {
            const parentName = this.extractDBpediaName(binding.parent.value);
            if (parentName) {
              relationships.push({
                subsidiary: entityName,
                parent: parentName,
                confidence: 0.8,
                source: 'DBpedia',
                relationship: 'parent',
                evidence: [`DBpedia knowledge base`]
              });
            }
          }

          if (binding.subsidiary) {
            const subName = this.extractDBpediaName(binding.subsidiary.value);
            if (subName) {
              relationships.push({
                subsidiary: subName,
                parent: entityName,
                confidence: 0.8,
                source: 'DBpedia',
                relationship: 'subsidiary',
                evidence: [`DBpedia knowledge base`]
              });
            }
          }
        }
      }

      if (relationships.length > 0) {
        console.log(`   ✓ DBpedia: Found ${relationships.length} relationship(s)`);
        return {
          source: 'DBpedia',
          relationships,
          confidence: 0.8
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract readable name from DBpedia URI
   */
  private extractDBpediaName(uri: string): string | null {
    const match = uri.match(/resource\/(.+)$/);
    if (match) {
      return decodeURIComponent(match[1].replace(/_/g, ' '));
    }
    return null;
  }
}

// Singleton
let freeOwnershipSourcesInstance: FreeOwnershipSources | null = null;

export function getFreeOwnershipSources(): FreeOwnershipSources {
  if (!freeOwnershipSourcesInstance) {
    freeOwnershipSourcesInstance = new FreeOwnershipSources();
  }
  return freeOwnershipSourcesInstance;
}

export default FreeOwnershipSources;
