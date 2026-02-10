/**
 * Supplier File Parser
 * Parses CSV, Excel, and PDF files to extract supplier company names
 */

export interface ParsedSupplier {
  originalName: string;
  normalizedName: string;
  location?: string;
  category?: string;
  annualSpend?: string;
  rowIndex: number;
}

export interface ParseResult {
  suppliers: ParsedSupplier[];
  totalRows: number;
  skippedRows: number;
  errors: string[];
  fileType: string;
}

class SupplierFileParser {

  /**
   * Parse uploaded file based on file type
   */
  public async parseFile(fileContent: string, fileName: string): Promise<ParseResult> {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
      case 'csv':
        return this.parseCSV(fileContent);
      case 'xlsx':
      case 'xls':
        // For now, treat as CSV (user should export to CSV)
        // In production, use a library like 'xlsx' to parse Excel
        return this.parseCSV(fileContent);
      case 'txt':
        return this.parseText(fileContent);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  /**
   * Parse CSV file content
   */
  private parseCSV(content: string): ParseResult {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const suppliers: ParsedSupplier[] = [];
    const errors: string[] = [];
    let skippedRows = 0;

    if (lines.length === 0) {
      return {
        suppliers: [],
        totalRows: 0,
        skippedRows: 0,
        errors: ['File is empty'],
        fileType: 'csv'
      };
    }

    // Try to detect header row
    const headerRow = lines[0];
    const companyNameColumnIndex = this.detectCompanyNameColumn(headerRow);
    const locationColumnIndex = this.detectColumn(headerRow, ['location', 'country', 'address', 'city']);
    const categoryColumnIndex = this.detectColumn(headerRow, ['category', 'type', 'industry', 'sector']);
    const spendColumnIndex = this.detectColumn(headerRow, ['spend', 'annual spend', 'cost', 'value', 'amount']);

    // Start from row 1 if header detected, otherwise row 0
    const startRow = companyNameColumnIndex !== -1 ? 1 : 0;

    for (let i = startRow; i < lines.length; i++) {
      const line = lines[i];
      const cells = this.parseCSVLine(line);

      if (cells.length === 0) {
        skippedRows++;
        continue;
      }

      try {
        let companyName: string;

        if (companyNameColumnIndex !== -1 && cells[companyNameColumnIndex]) {
          // Use detected column
          companyName = cells[companyNameColumnIndex].trim();
        } else {
          // Use first non-empty cell as company name
          companyName = cells.find(cell => cell && cell.trim().length > 0)?.trim() || '';
        }

        if (!companyName || this.isLikelyNotCompanyName(companyName)) {
          skippedRows++;
          continue;
        }

        suppliers.push({
          originalName: companyName,
          normalizedName: this.normalizeCompanyName(companyName),
          location: locationColumnIndex !== -1 ? cells[locationColumnIndex]?.trim() : undefined,
          category: categoryColumnIndex !== -1 ? cells[categoryColumnIndex]?.trim() : undefined,
          annualSpend: spendColumnIndex !== -1 ? cells[spendColumnIndex]?.trim() : undefined,
          rowIndex: i
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        skippedRows++;
      }
    }

    return {
      suppliers,
      totalRows: lines.length,
      skippedRows,
      errors,
      fileType: 'csv'
    };
  }

  /**
   * Parse plain text file (one company per line)
   */
  private parseText(content: string): ParseResult {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const suppliers: ParsedSupplier[] = [];
    let skippedRows = 0;

    for (let i = 0; i < lines.length; i++) {
      const companyName = lines[i].trim();

      if (!companyName || this.isLikelyNotCompanyName(companyName)) {
        skippedRows++;
        continue;
      }

      suppliers.push({
        originalName: companyName,
        normalizedName: this.normalizeCompanyName(companyName),
        rowIndex: i
      });
    }

    return {
      suppliers,
      totalRows: lines.length,
      skippedRows,
      errors: [],
      fileType: 'text'
    };
  }

  /**
   * Parse a single CSV line, respecting quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells;
  }

  /**
   * Detect which column contains company names
   */
  private detectCompanyNameColumn(headerRow: string): number {
    const cells = this.parseCSVLine(headerRow.toLowerCase());
    const companyKeywords = [
      'company',
      'supplier',
      'vendor',
      'name',
      'business',
      'organization',
      'firm',
      'entity'
    ];

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i].trim();
      if (companyKeywords.some(keyword => cell.includes(keyword))) {
        return i;
      }
    }

    return -1; // Not found
  }

  /**
   * Detect column by keywords
   */
  private detectColumn(headerRow: string, keywords: string[]): number {
    const cells = this.parseCSVLine(headerRow.toLowerCase());

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i].trim();
      if (keywords.some(keyword => cell.includes(keyword))) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Check if string is likely not a company name
   */
  private isLikelyNotCompanyName(str: string): boolean {
    const lowerStr = str.toLowerCase().trim();

    // Skip if too short
    if (lowerStr.length < 2) return true;

    // Skip common header words
    const headerWords = [
      'company', 'supplier', 'vendor', 'name', 'address', 'location',
      'contact', 'email', 'phone', 'date', 'amount', 'total', 'cost'
    ];

    if (headerWords.includes(lowerStr)) return true;

    // Skip if it's just numbers
    if (/^\d+$/.test(lowerStr)) return true;

    // Skip if it's an email
    if (lowerStr.includes('@')) return true;

    // Skip if it's a URL
    if (lowerStr.startsWith('http') || lowerStr.startsWith('www')) return true;

    return false;
  }

  /**
   * Normalize company name for comparison
   */
  private normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[,\.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Singleton instance
let parserInstance: SupplierFileParser | null = null;

export function getSupplierFileParser(): SupplierFileParser {
  if (!parserInstance) {
    parserInstance = new SupplierFileParser();
  }
  return parserInstance;
}

export default SupplierFileParser;
