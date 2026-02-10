# PFAS Implementation Quick Reference

## What is Inversion Analytics?
A water treatment optimization platform that uses advanced environmental engineering to predict PFAS (Per- and Polyfluoroalkyl Substances) removal efficiency and optimize GAC (Granular Activated Carbon) system performance.

## Core Algorithms (Must Know)

### 1. Freundlich Isotherm (Capacity Prediction)
- **Equation**: `q = K * C^(1/n)`
- **What it does**: Predicts how much PFAS each kg of GAC can absorb
- **Parameters**: K=0.15, n=0.7 (typical for PFAS)
- **Adjustments**: TOC factor, Sulfate factor, System type
- **Location**: `analysis-engine.ts:37-60`

### 2. Thomas Model (Breakthrough Prediction)
- **Equation**: `C/C₀ = 1 / (1 + exp((kTh*q₀*M/Q) - (kTh*C₀*t)))`
- **What it does**: Predicts when effluent PFAS concentration will increase
- **Key thresholds**: 10% (breakthrough), 50% (midpoint), 95% (exhaustion)
- **Accounts for**: Chain length effects (PFOS vs PFBS)
- **Location**: `breakthrough-model.ts:49-128`

### 3. Monte Carlo Simulation (Uncertainty)
- **What it does**: Tests 5,000 random scenarios to find confidence intervals
- **Output**: p5, p10, p90, p95 percentiles
- **Method**: Box-Muller transform for normal distribution
- **Location**: `analysis-engine.ts:87-141`

### 4. Removal Efficiency (System Performance)
- **Calculation**: Combines EBCT, GAC quality, pH, Temperature
- **Range**: 50% - 99%
- **Location**: `analysis-engine.ts:146-163`

## Key Data Points

### PFAS Compounds (10 tracked)
```
PFOA, PFOS, PFNA, PFHxA, PFHxS, PFDA, PFBS, PFHpA, PFUnDA, PFDoA
Units: ng/L (nanograms per liter)
Range: 0-10,000 ng/L
```

### Water Quality Parameters
```
pH: 4-12 (optimal 7-8)
TOC: 0-100 mg/L (competes with PFAS)
Sulfate: 0-1,000 mg/L (competes with PFAS)
Temperature: 0-50°C
```

### GAC Properties
```
Iodine Number: 200-2,000 mg/g (higher = better)
Surface Area: 100-2,000 m²/g (larger = better)
Particle Size: 0.1-5mm
Density: 200-1,000 kg/m³
```

### System Parameters
```
EBCT (Empty Bed Contact Time): 0.1-60 minutes (longer = better)
Flow Rate: 0.1-10,000 m³/h
Bed Volume: 0.001-500 m³
System Type: Fixed Bed or Fluidized Bed
```

## API Endpoints

### Main Analysis Endpoint
```
POST /api/data-submission
Input:
  - contactRequestId (unique ID)
  - formData (all PFAS/system parameters)

Output:
  - projectedLifespanMonths (when GAC exhausts)
  - capitalAvoidance (annual cost savings)
  - p95SafeLifeMonths (conservative estimate)
  - removalEfficiency (%)
  - reportId (for PDF download)
```

### Advanced Analysis Endpoint
```
POST /api/enhanced-audit
Output:
  - Freundlich isotherm parameters
  - Mass transfer coefficients
  - Reactor hydraulic analysis
  - Reaction kinetics
  - Bed life prediction
  - Cost optimization
```

## Database Schema

### ContactRequest
- Company info + location
- Status tracking (PENDING → REPORT_GENERATED)

### DataSubmissionForm
- All 80+ PFAS/system parameters
- Water quality data
- Economic parameters

### Report
- Analysis results
- PDF URL
- Key metrics

## Testing & Data

### Demo Dataset
- **File**: `demo-hazen-dataset.json`
- **Scenario**: Flint WTP (realistic municipal facility)
- **PFAS**: PFOA 0.08, PFOS 0.12, total 0.36 ng/L
- **System**: Fixed Bed, EBCT 1.44 min, 1,000 m³/h flow
- **GAC**: Coconut Shell F400, 1,050 mg/g iodine

### Test Coverage
- ✅ Freundlich capacity calculations
- ✅ Thomas breakthrough modeling
- ✅ Monte Carlo simulation
- ✅ Multi-compound adsorption
- ✅ Cost optimization
- ⚠️ Geographic mapping (untested)

## Key Files & Locations

| File | Purpose |
|------|---------|
| `analysis-engine.ts` | Freundlich, MC, removal efficiency |
| `breakthrough-model.ts` | Thomas model, multi-compound |
| `environmental-engineering.ts` | Advanced physical/chemical models |
| `enhanced-audit-engine.ts` | Complete audit workflow |
| `pdf-generator.ts` | Report generation |
| `validations.ts` | Input validation (Zod) |
| `data-submission/route.ts` | Main API orchestrator |
| `schema.prisma` | Database schema |

## Regulatory Context

### EPA MCLs (Maximum Contaminant Levels)
```
PFOA: 4.0 ng/L
PFOS: 4.0 ng/L
PFNA: 10 ng/L (provisional)
HAD-PFHxS: 10 ng/L (provisional)
```

### Standards Referenced
- EPA (2021) - GAC parameters
- ITRC/EPA (2020) - PFAS protocols
- Federal Register - Citations
- State MCLs - Varies by location

## How It Differs from MIAR

### MIAR (BIS Scanner)
- **Entity**: Company names
- **Match**: Parent/subsidiary relationships
- **Risk**: Sanctions, compliance
- **Database**: 150+ ownership relationships

### PFAS Module
- **Entity**: Water treatment facility
- **Match**: PFAS compound properties
- **Risk**: Environmental/regulatory exposure
- **Database**: Compound interaction models

### Shared Patterns
- Advanced resolution engine
- Confidence scoring (0-1)
- Evidence trails
- Risk assessment
- Multi-factor analysis
- Automated reporting

## Integration Roadmap

### Phase 1: Module Foundation (2-3 days)
- Create `/src/services/pfas/` directory
- Implement capacity, breakthrough, risk engines
- Database schema for facilities

### Phase 2: Integration (1-2 days)
- Connect to MIAR resolution engine
- Confidence scoring alignment
- Evidence trail documentation

### Phase 3: Visualization (2-3 days)
- Breakthrough curve charts
- Risk dashboard
- Geographic mapping

### Phase 4: Compliance (1 day)
- Regulatory framework
- Automated reports
- Monitoring alerts

## Key Insights

### Scientific Credibility
- Peer-reviewed models (Appleman, Kothawala, EPA)
- Published in Water Research, EST
- Industry-standard parameters

### Economic Impact
- Quantifies cost savings
- Optimizes replacement schedules
- Calculates ROI

### Regulatory Alignment
- EPA MCLs integrated
- Federal Register tracking
- State-specific standards
- Compliance documentation

## Red Flags / Known Issues
- PDF currently text-based (not fancy graphics)
- Geographic mapping untested
- Admin dashboard partial
- Some report details hardcoded (vs dynamic)

## Files You'll Need to Understand

1. **For Capacity**: `analysis-engine.ts` (Freundlich equation)
2. **For Breakthrough**: `breakthrough-model.ts` (Thomas model)
3. **For API Design**: `data-submission/route.ts` (orchestration)
4. **For Database**: `schema.prisma` (data model)
5. **For Validation**: `validations.ts` (input constraints)
6. **For Advanced**: `environmental-engineering.ts` (physics)

---

## FAQ

**Q: Why Freundlich over Langmuir?**
A: Freundlich better fits PFAS adsorption kinetics at the relevant concentration ranges (EPA recommendation).

**Q: Why 5,000 Monte Carlo iterations?**
A: Research-grade accuracy; production uses 1,000 for speed.

**Q: How does chain length affect PFAS?**
A: Longer chains (PFOS C8, PFOA C8) adsorb 1.2-1.3x stronger than shorter chains (PFBS C4).

**Q: What's the safety factor for?**
A: Operational uncertainty; conservative estimate for real-world conditions (1.0-5.0x reduction).

**Q: Can this handle saltwater?**
A: Yes, through ionic strength parameter; higher salinity reduces capacity slightly.

**Q: Why track 10 PFAS compounds?**
A: EPA MCL covers multiple compounds; competitive adsorption varies by compound.
