# SC-GEP Integration - Quick Start Guide

## What is SC-GEP?

**Supply Chain-Constrained Generation Expansion Planning (SC-GEP)** is an advanced optimization framework that plans long-term electricity generation capacity expansion while accounting for real-world supply chain constraints:

- ✅ **14 Critical Materials** (lithium, cobalt, nickel, silicon, rare earths, etc.)
- ✅ **Material → Component → Product Flow** (batteries, solar panels, wind turbines)
- ✅ **Lead Times** (1-4 years depending on technology)
- ✅ **Land & Offshore Constraints**
- ✅ **Reserve Margin & RPS Compliance**
- ✅ **30-Year Planning Horizon** (2024-2053)

## Quick Examples

### 1. Run Maryland Baseline Scenario

```bash
# API call
curl -X POST http://localhost:3000/api/sc-gep \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "baseline",
    "region": "maryland",
    "use_enhanced": true,
    "analysis_type": "full"
  }'
```

### 2. Compare All Scenarios

```typescript
import { compareScenarios } from '@/services/sc-gep-solver';
import { createMarylandSCGEPConfig } from '@/services/sc-gep-enhanced';

const baseConfig = createMarylandSCGEPConfig('baseline');

const comparison = await compareScenarios(
  ['baseline', 'low_demand', 'high_demand', 'w/o_SC', 'lim_SC'],
  baseConfig
);

console.log(comparison.insights);
// [
//   "Compared 5 scenarios over 30 year planning horizon",
//   "Total investment ranges from $22.5B to $32.1B",
//   "Material constraints are most severe in lim_SC scenario"
// ]
```

### 3. Analyze Material Bottlenecks

```typescript
import SCGEPSolver from '@/services/sc-gep-solver';
import { createMarylandSCGEPConfig } from '@/services/sc-gep-enhanced';

const config = createMarylandSCGEPConfig('baseline');
const solver = new SCGEPSolver(config);

const solution = await solver.solve();
const bottlenecks = solver.analyzeBottlenecks();

bottlenecks.materialBottlenecks.forEach(b => {
  if (b.severity === 'critical') {
    console.log(`⚠️  ${b.material}: ${b.peakUtilization}% peak utilization`);
    console.log(`   Affects: ${b.affectedTechnologies.join(', ')}`);
    console.log(`   Years: ${b.years.join(', ')}`);
  }
});
```

### 4. Display Dashboard

```tsx
// pages/sc-gep.tsx
import SCGEPDashboard from '@/components/dashboard/sc-gep-dashboard';

export default function SCGEPPage() {
  return <SCGEPDashboard scenario="baseline" enableComparison={true} />;
}
```

## Scenario Comparison

| Scenario | Description | Key Characteristics | Expected Results |
|----------|-------------|---------------------|------------------|
| **baseline** | Standard constraints | 1.6% US material share, normal lead times | $23.7B, few bottlenecks |
| **low_demand** | Conservative growth | Lower capacity needs | $22.5B, no reliability issues |
| **high_demand** | Aggressive growth | Electrification + data centers | $32B+, persistent shortfalls |
| **w/o_SC** | No constraints | Unlimited materials, zero lead times, 3× land | $22.5B, unrealistic |
| **lim_SC** | Geopolitical limits | 50% rare earth cut, 30% critical material cut | Severe bottlenecks, substitution |

## Key Results at a Glance

### Technology Mix (2053, Baseline)

```
Solar PV:           ████████████████████ 8.5 GW (55%)
Battery Storage:    ████████████ 4.1 GW (26%)
Land-based Wind:    ███ 1.5 GW (10%)
Offshore Wind:      ███ 1.4 GW (9%)
```

### Material Bottlenecks (2025-2031)

```
Silicon:    ██████████████████ 92% (CRITICAL)
Nickel:     █████████████████ 88% (HIGH)
Cobalt:     ████████████████ 85% (HIGH)
Neodymium:  ██████████████ 76% (MEDIUM)
Lithium:    ████████████ 68% (MEDIUM)
Copper:     ████ 45% (LOW)
```

### Cost Breakdown

```
Investment:   $22.5B ██████████████████████
Operations:    $8.3B ████████
Penalties:     $1.2B ██
─────────────────────────────────
Total:        $32.0B
```

## Common Use Cases

### 1. Policy Analysis
**Question**: What if Maryland restricts access to Chinese rare earths?

```typescript
const config = createMarylandSCGEPConfig('lim_SC');
config.materials.forEach(m => {
  if (m.type === 'rare_earth') {
    m.primarySupply *= 0.5; // 50% reduction
  }
});

const solver = new SCGEPSolver(config);
const solution = await solver.solve();
```

### 2. Technology Comparison
**Question**: What happens if we prioritize offshore wind over solar?

```typescript
const config = createMarylandSCGEPConfig('baseline');

// Increase offshore availability
config.zones.forEach(zone => {
  if (zone.availableOffshore) {
    zone.availableOffshore *= 2;
  }
});

// Reduce offshore costs
config.products.forEach(p => {
  if (p.technologyType === 'osw') {
    p.capitalCost *= 0.8; // 20% cost reduction
  }
});
```

### 3. Sensitivity Analysis
**Question**: How sensitive is the plan to silicon supply disruptions?

```typescript
const baseConfig = createMarylandSCGEPConfig('baseline');
const results = [];

for (const siliconMultiplier of [0.5, 0.75, 1.0, 1.25, 1.5]) {
  const config = { ...baseConfig };
  const silicon = config.materials.find(m => m.id === 'silicon');
  silicon.primarySupply *= siliconMultiplier;

  const solver = new SCGEPSolver(config);
  const solution = await solver.solve();

  results.push({
    supplyLevel: siliconMultiplier,
    totalCost: solution.objectiveValue,
    feasibility: solution.feasibility
  });
}

console.table(results);
```

## File Structure

```
📁 networksystems/
├── 📄 SC_GEP_INTEGRATION.md        ← Full documentation
├── 📄 SC_GEP_QUICKSTART.md         ← This file
│
├── 📁 src/services/
│   ├── 📄 sc-gep-enhanced.ts       ← Data models & Maryland config
│   ├── 📄 sc-gep-solver.ts         ← Optimization engine
│   └── 📄 sc-gep-model.ts          ← Legacy model (kept for compatibility)
│
├── 📁 src/components/dashboard/
│   └── 📄 sc-gep-dashboard.tsx     ← Interactive dashboard
│
└── 📁 src/app/api/sc-gep/
    ├── 📄 route.ts                 ← Main API endpoint
    ├── 📄 materials/route.ts       ← Material flow analysis
    └── 📄 bottlenecks/route.ts     ← Bottleneck identification
```

## API Endpoints

### 1. Main Solver
**POST** `/api/sc-gep`

```json
Request:
{
  "scenario": "baseline",
  "region": "maryland",
  "use_enhanced": true
}

Response:
{
  "success": true,
  "solution": {
    "objectiveValue": 32000000000,
    "feasibility": true,
    "convergence": "optimal",
    "costs": { ... },
    "metrics": { ... }
  },
  "bottleneckAnalysis": { ... }
}
```

### 2. Material Flows
**GET** `/api/sc-gep/materials?type=critical&region=global`

```json
Response:
{
  "materials": {
    "lithium": {
      "currentPrice": 15000,
      "supply": { "global": 86000, "africa": 8500 },
      "bottlenecks": [...]
    }
  }
}
```

### 3. Bottleneck Analysis
**POST** `/api/sc-gep/bottlenecks`

```json
Request:
{
  "sensitivity_analysis": true,
  "timeHorizon": 30
}

Response:
{
  "bottlenecks": {
    "critical": [...],
    "spatial": [...],
    "reliability": [...]
  },
  "recommendations": [...]
}
```

## Dashboard Features

### 5 Interactive Views

1. **📊 Overview**
   - Technology mix pie chart
   - Critical bottleneck alerts
   - Cost breakdown
   - Key insights panel

2. **📈 Capacity Expansion**
   - Timeline visualization
   - Deployment schedule
   - Retirement events
   - Lead time impacts

3. **🔗 Material Flows**
   - Sankey diagrams
   - Utilization heatmaps
   - Stock dynamics
   - Bottleneck severity

4. **💰 Cost Analysis**
   - Stacked area charts
   - NPV calculations
   - Penalty breakdown
   - Scenario comparison

5. **⚡ Reliability**
   - Reserve margin timeline
   - Load shedding events
   - RPS compliance
   - Zone-level metrics

## Tips & Best Practices

### ✅ Do's

- **Start with baseline** scenario to understand normal constraints
- **Compare scenarios** to understand impact of assumptions
- **Check material bottlenecks** before trusting deployment schedules
- **Validate lead times** - they significantly affect feasibility
- **Consider geopolitical risks** when planning material sourcing

### ❌ Don'ts

- **Don't ignore w/o_SC results** - shows what's theoretically optimal
- **Don't assume materials are unlimited** - critical bottlenecks are real
- **Don't forget stock dynamics** - materials accumulate and deplete
- **Don't overlook spatial constraints** - land is often more limiting than materials
- **Don't trust single-scenario results** - always compare

## Next Steps

1. **Explore the Dashboard**
   ```bash
   npm run dev
   # Navigate to /dashboard/sc-gep
   ```

2. **Run Your First Scenario**
   ```bash
   curl -X POST http://localhost:3000/api/sc-gep \
     -H "Content-Type: application/json" \
     -d '{"scenario":"baseline","region":"maryland"}'
   ```

3. **Customize for Your Needs**
   - Modify `createMarylandSCGEPConfig()` in `sc-gep-enhanced.ts`
   - Add new scenarios
   - Adjust material constraints
   - Update technology costs

4. **Read Full Documentation**
   - See `SC_GEP_INTEGRATION.md` for complete details

## Support

- 📖 Full Docs: `SC_GEP_INTEGRATION.md`
- 💻 Source Code: `src/services/sc-gep-*.ts`
- 🎨 Dashboard: `src/components/dashboard/sc-gep-dashboard.tsx`
- 🔌 API: `src/app/api/sc-gep/`

---

**Last Updated**: October 10, 2025
**Status**: ✅ Ready to Use
