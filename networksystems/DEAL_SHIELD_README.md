# Deal-Shield & DPW Auditor

**Baltimore Real Estate Forensics Platform**

Transform your SOBapp network intelligence engine into a powerful Baltimore real estate deal analysis and DPW billing auditor.

## Overview

Deal-Shield repurposes the SOBapp mining intelligence platform for Baltimore real estate forensics:

- **DPW Water Bill Auditor**: Detect Baltimore City water billing discrepancies and overcharges
- **DSCR Stress Test**: Analyze real estate deals for fundability and lender requirements
- **Network Visualization**: Map property relationships, lien networks, and water bill clusters

## Features

### 1. DPW Water Bill Auditor

Detects Baltimore City water billing discrepancies using official tiered water rates:

- **Tiered Pricing Calculation**: Uses Baltimore City's 4-tier water rate structure
- **CCF to Gallons Conversion**: Automatically converts meter readings (1 CCF = 748 gallons)
- **Discrepancy Detection**: Flags bills with >10% error
- **Severity Classification**: Low, Medium, High, Critical
- **Actionable Recommendations**: Provides dispute guidance and DPW contact info

**Baltimore City Water Rates:**
- Tier 1: First 2,000 gallons @ $0.012/gallon
- Tier 2: 2,001-10,000 gallons @ $0.014/gallon
- Tier 3: 10,001-20,000 gallons @ $0.016/gallon
- Tier 4: 20,000+ gallons @ $0.018/gallon
- Sewer Charge: Typically 100% of water cost

### 2. DSCR Stress Test

Analyzes real estate deals for fundability:

- **DSCR Calculation**: Debt Service Coverage Ratio = NOI / Debt Service
- **Lender Status**: FUNDABLE (≥1.25), MARGINAL (1.10-1.24), REJECTED (<1.10)
- **Max Loan Capacity**: Reverse calculates maximum loan amount
- **Financial Metrics**: Complete breakdown of income, expenses, and NOI
- **Risk Assessment**: Low, Medium, High risk classification

**DSCR Formula:**
```
NOI = (Gross Rent × (1 - Vacancy Rate)) - Operating Expenses
DSCR = NOI / Debt Service
```

## Quick Start

### 1. Install Dependencies

```bash
cd networksystems
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Access Deal-Shield Dashboard

Navigate to: `http://localhost:3000/deal-shield`

## API Endpoints

### DPW Water Bill Auditor

**POST** `/api/forensics/dpw-audit`

```json
{
  "meterReadCurrent": 125.5,
  "meterReadLast": 100.0,
  "totalBill": 150.00,
  "serviceCharge": 10.00,
  "sewerCharge": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "isError": false,
    "discrepancyAmount": "5.23",
    "actualGallons": 19050,
    "actualCCF": 25.5,
    "expectedBill": 144.77,
    "actualBill": 150.00,
    "tierBreakdown": [...],
    "errorPercentage": 3.61,
    "recommendation": "...",
    "severity": "low"
  }
}
```

### DSCR Stress Test

**POST** `/api/forensics/dscr-test`

```json
{
  "deal": {
    "grossRent": 5000,
    "expenses": 2000,
    "debtService": 3000,
    "vacancyRate": 0.10,
    "operatingExpenseRatio": 0.50
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "ratio": "1.50",
    "ratioValue": 1.5,
    "status": "FUNDABLE",
    "noi": 4500,
    "maxLoanPossible": 540000,
    "monthlyPaymentCapacity": 3600,
    "recommendation": "...",
    "riskLevel": "low",
    "metrics": {...}
  }
}
```

## Use Cases

### Baltimore Real Estate Investors

1. **Pre-Purchase Analysis**: Stress test deals before making offers
2. **DPW Disputes**: Audit water bills for overcharges
3. **Portfolio Management**: Monitor water bill spikes across properties
4. **Lender Negotiation**: Show DSCR calculations to secure financing

### Property Managers

1. **Bill Verification**: Automatically audit all tenant water bills
2. **Leak Detection**: Flag properties with >20% bill increases
3. **Expense Tracking**: Monitor operating expenses vs. ratios

### Deal Analysis

1. **Quick DSCR Check**: Instantly see if a deal is fundable
2. **Scenario Planning**: Test different vacancy and expense scenarios
3. **Max Purchase Price**: Calculate maximum offer based on NOI

## Monetization Strategy

### The "Spill" in GroupMe

> "I've repurposed my SOBapp network engine to track **Baltimore City DPW billing anomalies.** I just ran a sweep of the 21223 zip code and found 14 properties being overcharged based on the CCF-Gallon discrepancy.
>
> I'm opening up the **Deal-Shield Dashboard** for $32. You get the DPW Auditor and the DSCR Stress-Test tool built in. Who wants in?"

### Pricing

- **Single Access**: $32 one-time
- **Portfolio Access**: $99/month (unlimited properties)
- **Enterprise**: Custom pricing for property management companies

## Technical Details

### Built On

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **React** for UI components
- **Tailwind CSS** for styling

### Architecture

- **Services Layer**: `src/services/forensics/` - Core business logic
- **API Routes**: `src/app/api/forensics/` - REST endpoints
- **UI Components**: `src/components/deal-shield/` - React components
- **Pages**: `src/app/deal-shield/` - Main dashboard

## Future Enhancements

1. **Lien Mapping**: Visualize DPW liens on interactive map
2. **Batch Processing**: Upload CSV of multiple properties
3. **Historical Analysis**: Track bill trends over time
4. **Alert System**: Email notifications for bill spikes
5. **Integration**: Connect to Baltimore City APIs (when available)

## Support

For questions or issues:
- Email: support@deal-shield.com
- GitHub Issues: [Create an issue](https://github.com/somtonweke1/SOBapp/issues)

## License

This project is proprietary. Unauthorized use or reproduction is prohibited.

---

**Deal-Shield - Where Network Intelligence Meets Real Estate Forensics**

Built on the SOBapp Mining Intelligence Platform

