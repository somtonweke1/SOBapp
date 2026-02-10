# Supply Chain-Constrained Generation Expansion Planning (SC-GEP) Integration

## Overview

This document describes the complete integration of the **Supply Chain-Constrained Generation Expansion Planning (SC-GEP)** model into the SOBapp platform, based on the research paper:

> **"Integrating Upstream Supply Chains into Generation Expansion Planning"**

The integration provides a comprehensive framework for optimizing power system capacity expansion while accounting for:
- Material supply constraints (14 critical materials)
- Component manufacturing and product assembly
- Deployment lead times (1-4 years by technology)
- Spatial constraints (land and offshore availability)
- Reserve margin and RPS compliance requirements
- Multi-scenario analysis (baseline, low/high demand, constrained/unconstrained supply)

---

## Architecture

### Core Components

```
src/
├── services/
│   ├── sc-gep-enhanced.ts      # Enhanced data models and Maryland configuration
│   ├── sc-gep-solver.ts        # Optimization solver with heuristic algorithms
│   └── sc-gep-model.ts         # Legacy model (backward compatible)
│
├── components/
│   └── dashboard/
│       └── sc-gep-dashboard.tsx # Comprehensive visualization dashboard
│
└── app/api/
    └── sc-gep/
        ├── route.ts            # Main SC-GEP API endpoint
        ├── materials/route.ts  # Material flow analysis
        └── bottlenecks/route.ts # Bottleneck identification
```

---

## Mathematical Formulation

The SC-GEP model implements a **multi-stage mixed-integer linear program (MILP)** with the following objective function:

```
minimize: Σ_y [C^inv_y + C^op_y + C^pe_y]
```

Where:
- **C^inv_y**: Investment costs (capital expenditure for new capacity)
- **C^op_y**: Operational costs (fixed + variable O&M)
- **C^pe_y**: Penalty costs (load shedding, reserve margin, RPS violations)

### Key Constraints

#### 1. Supply Chain Module

**Material Flow Constraints:**
```
u_my ≥ Σ_c v_cy · DCO_mc    (Material demand for components)
v_cy ≥ Σ_p w_py · DPR_cp    (Component demand for products)
u_my ≤ M_my + Σ_g RRM_mg · P_g · r_gy + s_my    (Material availability)
```

**Stock Dynamics:**
```
s_my = s_m(y-1) + M_m(y-1) - u_m(y-1) + Σ_g RRM_mg · P_g · r_g(y-1)
```

**Product Deployment:**
```
Σ_g∈Gk P_g · d_gy ≤ Σ_p∈Pk w_py    (Product availability limits deployment)
```

**Spatial Constraints:**
```
Σ_g∈Gk∩Gi P_g · d_gy / RCAP_k ≤ f^k_iy    (Land availability)
f^k_iy = f^k_i(y-1) + [retirements - new deployments]    (Area dynamics)
```

**Lead Time Constraints:**
```
Σ_y''≤y-T^LEAD_g d_gy'' = Σ_y'≤y b_gy'    (Build only after lead time)
```

#### 2. Generation Expansion Planning Module

**Power Balance:**
```
Σ_g∈Gi p_gthy + [storage discharge - charge] + [net imports] = L_ithy - pLS_ithy
```

**Generation Limits:**
```
0 ≤ p_gthy ≤ F^GEN_igthy · P_g · o_gy    (Renewable availability)
0 ≤ p_gthy ≤ P_g · o_gy                  (Thermal capacity)
```

**Reserve Margin:**
```
Σ_g∈Gk P_g · F^ELCC_ky · o_gy + pRM_y ≥ (1 + RRM_y) · L_y
```

**RPS Compliance:**
```
Σ_g∈Gk Σ_t Σ_h N_ty · p_gthy + eRPS_ky ≥ RRPS_ky · Σ_t Σ_h Σ_i N_ty · L_ithy
```

---

## Data Configuration

### 1. Critical Materials (14 materials from USGS/DOE)

| Material | Type | Primary Supply (tonnes/yr) | Energy Sector Share | Recovery Rate |
|----------|------|---------------------------|-------------------|---------------|
| Silicon | Critical | 128,000 | 30% | 10% |
| Nickel | Critical | 51,200 | 30% | 10% |
| Cobalt | Critical | 2,880 | 30% | 10% |
| Lithium | Critical | 1,376 | 30% | 10% |
| Neodymium | Rare Earth | 480 | 30% | 10% |
| Dysprosium | Rare Earth | 16 | 30% | 10% |
| Aluminum | Standard | 45,000 | 10% | 10% |
| Copper | Standard | - | 10% | 85% |
| ... | ... | ... | ... | ... |

### 2. Technologies

| Technology | Type | Lead Time | Lifetime | Capital Cost | ELCC Factor |
|------------|------|-----------|----------|--------------|-------------|
| Solar PV (c-Si) | Renewable | 2 years | 30 years | $1.2M/MW | 0.7 |
| Solar PV (CdTe) | Renewable | 2 years | 30 years | $1.15M/MW | 0.7 |
| Battery (NMC 111) | Storage | 1 year | 15 years | $350k/MW | 0.95 |
| Battery (NMC 811) | Storage | 1 year | 15 years | $340k/MW | 0.95 |
| Land-based Wind | Renewable | 3 years | 30 years | $1.5M/MW | 0.85 |
| Offshore Wind | Renewable | 4 years | 30 years | $4M/MW | 0.9 |

### 3. Maryland Zones (PJM Service Territories)

| Zone | Peak Load (MW) | Demand CAGR | Available Land (km²) | Available Offshore (km²) |
|------|---------------|-------------|---------------------|------------------------|
| BGE | 6,428 - 6,491 | -0.65% to 0.60% | 500 | 2,000 |
| APS | 1,554 - 1,683 | 0.21% to 4.67% | 800 | - |
| DPL | 961 - 1,036 | -0.45% to 0.42% | 300 | 1,500 |
| PEPCO | 2,958 - 4,472 | 0.20% to 0.65% | 400 | - |

---

## Scenarios

### 1. **Baseline**
- Standard supply chain constraints
- Maryland's 1.6% share of U.S. material supply
- Normal lead times and land availability
- Moderate demand growth

### 2. **Low Demand**
- Conservative demand growth (Table III, Low Scenario)
- Same supply chain constraints as baseline
- Lower capacity expansion needs
- Results: $23.7B total investment, minimal reliability issues

### 3. **High Demand**
- Aggressive electrification + data center growth (Table III, High Scenario)
- Same supply chain constraints as baseline
- Higher capacity expansion pressure
- Results: Persistent reserve margin shortfalls after 2037

### 4. **w/o SC (Without Supply Chain Constraints)**
- Unlimited material availability
- Zero lead times
- 3× land availability
- Demonstrates impact of ignoring supply chain
- Results: Just-in-time deployment, $22.5B investment

### 5. **lim_SC (Limited Supply Chain)**
- Geopolitical constraints (allied countries only)
- 50% reduction in rare earth supply
- 30% reduction in critical material supply
- Most constrained scenario
- Results: Severe bottlenecks, technology substitution

---

## API Reference

### POST `/api/sc-gep`
Solve SC-GEP optimization model

**Request Body:**
```json
{
  "scenario": "baseline" | "low_demand" | "high_demand" | "w/o_SC" | "lim_SC",
  "region": "maryland" | "africa",
  "use_enhanced": true,
  "analysis_type": "full" | "bottlenecks" | "solution",
  "constraints": {
    // Optional custom constraint overrides
  }
}
```

**Response:**
```json
{
  "success": true,
  "solution": {
    "objectiveValue": 32000000000,
    "feasibility": true,
    "convergence": "optimal",
    "solveTime": 2.45,
    "iterations": 15,
    "costs": {
      "investment": [/* by year */],
      "operational": [/* by year */],
      "penalty": [/* by year */],
      "total": 32000000000
    },
    "metrics": {
      "totalCapacityByYear": { /* by tech */ },
      "materialUtilizationRate": { /* by material */ },
      "loadSheddingTotal": [/* by year */]
    }
  },
  "bottleneckAnalysis": {
    "materialBottlenecks": [
      {
        "material": "Silicon",
        "years": [2025, 2026, 2027],
        "severity": "critical",
        "peakUtilization": 92,
        "affectedTechnologies": ["spv"]
      }
    ],
    "reliabilityIssues": [/* ... */]
  },
  "metadata": {
    "scenario": "baseline",
    "region": "maryland",
    "timestamp": "2025-10-10T...",
    "modelVersion": "2.0.0-enhanced",
  }
}
```

### GET `/api/sc-gep/materials`
Get material flow data and forecasts

**Query Parameters:**
- `type`: 'critical' | 'standard' | 'rare_earth' | 'all'
- `region`: 'global' | 'africa'

### POST `/api/sc-gep/bottlenecks`
Analyze supply chain bottlenecks with sensitivity analysis

**Request Body:**
```json
{
  "materials": [/* optional custom materials */],
  "technologies": [/* optional custom techs */],
  "timeHorizon": 30,
  "sensitivity_analysis": true
}
```

---

## Dashboard Components

### Main Dashboard (`sc-gep-dashboard.tsx`)

The dashboard provides 5 main views:

#### 1. **Overview**
- Technology mix visualization
- Critical bottleneck summary
- Cost breakdown
- Key insights

#### 2. **Capacity Expansion**
- Timeline of capacity additions/retirements
- Technology-specific deployment schedules
- Lead time impact visualization

#### 3. **Material Flows**
- Material utilization rates over time
- Sankey diagrams showing material → component → product flows
- Bottleneck severity indicators

#### 4. **Cost Analysis**
- Investment cost timeline
- Operational cost breakdown
- Penalty cost analysis
- Net present value calculations

#### 5. **Reliability**
- Reserve margin satisfaction
- Load shedding events
- RPS compliance tracking
- Zone-level reliability metrics

### Usage Example

```tsx
import SCGEPDashboard from '@/components/dashboard/sc-gep-dashboard';

export default function Page() {
  return (
    <SCGEPDashboard
      scenario="baseline"
      enableComparison={true}
    />
  );
}
```

---

## Key Findings from Maryland Case Study

### Baseline Scenario

1. **Capacity Mix (2053)**:
   - Solar PV: 8.5 GW
   - Land-based Wind: 1.5 GW
   - Offshore Wind: 1.4 GW
   - Battery Storage: 4.1 GW

2. **Material Bottlenecks (2025-2031)**:
   - **Silicon**: 92% utilization (critical)
   - **Nickel**: 88% utilization (high)
   - Limits early SPV and BSS deployment

3. **Technology Evolution**:
   - **2025-2031**: Battery storage + c-Si/CdTe solar (rapid deployment)
   - **2031-2044**: Material constraints ease, continued solar
   - **2045-2053**: Shift to land-based wind (cost-driven)

4. **Total Costs**:
   - Investment: $22.5B
   - Operations: $8.3B
   - Penalties: $1.2B (low demand) to $5B+ (high demand)

### High Demand Scenario

1. **Sustained Capacity Pressure**:
   - Continuous SPV deployment through 2046
   - NMC chemistry shifts based on material availability
   - Wind deployment begins in 2047

2. **Reliability Challenges**:
   - Load shedding from 2037 onward
   - Reserve margin violations throughout
   - 1.8 GW shortfall in 2048-2049

3. **Material Constraints**:
   - Persistent nickel, silicon, cobalt bottlenecks
   - Forces technology substitution decisions
   - Limits optimal technology choices

### w/o SC vs. Baseline Comparison

| Metric | w/o SC | Baseline | Impact |
|--------|--------|----------|--------|
| Total Investment | $22.5B | $23.7B | +$1.2B (+5.3%) |
| Load Shedding (Low) | 0 MWh | 0 MWh | None |
| Load Shedding (High) | 0 MWh | >1000 MWh | Significant |
| Material Bottlenecks | 0 | 4-6 | Critical |
| Technology Diversity | Lower | Higher | Forced diversification |

---

## Implementation Notes

### Solver Algorithm

The current implementation uses a **greedy heuristic** with the following approach:

1. **Capacity Planning**:
   - Calculate capacity gap per zone per year
   - Sort technologies by deployment attractiveness:
     - ELCC factor (reliability contribution)
     - Lead time (faster = better)
     - Material intensity (lower = better)
     - Cost (lower = better)

2. **Material Allocation**:
   - Check material availability before deployment
   - Consume materials from supply → components → products
   - Track stock dynamics year-over-year

3. **Feasibility Checking**:
   - Validate material constraints
   - Validate spatial constraints
   - Validate lead time constraints
   - Adjust if violations detected

### Future Enhancements

For production deployment, consider:

1. **Commercial MILP Solver Integration**:
   - Gurobi, CPLEX, or MOSEK for exact solutions
   - Nested Benders Decomposition (Algorithm 1 from paper)
   - Lagrangian relaxation for tighter bounds

2. **Advanced Features**:
   - Stochastic programming for demand uncertainty
   - Transmission expansion co-optimization
   - Weather-year clustering for renewable profiles
   - Ancillary service markets

3. **Data Integration**:
   - Real-time material price feeds
   - EIA Form 860 updates
   - PJM market data
   - USGS mineral supply updates

---

## Testing & Validation

### Unit Tests (Recommended)

```typescript
// Test material constraint satisfaction
test('Material constraints are satisfied', async () => {
  const config = createMarylandSCGEPConfig('baseline');
  const solver = new SCGEPSolver(config);
  const solution = await solver.solve();

  expect(solution.feasibility).toBe(true);

  // Check no material over-utilization
  for (const material of config.materials) {
    for (let year = 0; year < config.systemParameters.planningHorizon; year++) {
      const util = solution.variables.materialUtilization[material.id][year];
      const supply = material.primarySupply * material.energySectorShare;
      expect(util).toBeLessThanOrEqual(supply);
    }
  }
});
```

### Integration Tests

```typescript
// Test API endpoint
test('SC-GEP API returns valid solution', async () => {
  const response = await fetch('/api/sc-gep', {
    method: 'POST',
    body: JSON.stringify({
      scenario: 'baseline',
      region: 'maryland',
      use_enhanced: true
    })
  });

  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.solution.feasibility).toBe(true);
  expect(data.metadata.paperReference).toContain('Yao');
});
```

---

## References

1. **Primary Paper**:

2. **Data Sources**:
   - U.S. Geological Survey (USGS) - Critical Minerals List
   - U.S. Department of Energy (DOE) - Energy Sector Material Demands
   - PJM Interconnection - Load data, ELCC factors, Net CONE
   - Maryland Public Service Commission - Ten-Year Plan (2023-2032)
   - EIA Form 860 - Existing generation units

3. **Related Work**:
   - Zhang et al. (2023) - "Global supply risk assessment of metals"
   - Patankar et al. (2023) - "Land use trade-offs in decarbonization"
   - National Renewable Energy Laboratory (NREL) - Annual Technology Baseline 2024

---

## Contact & Support

For questions or issues with the SC-GEP integration:

- **Documentation**: This file + code comments
- **API Docs**: `/api/sc-gep` endpoints
- **Dashboard Demo**: `/dashboard/sc-gep`
- **Source Code**: `src/services/sc-gep-*.ts`

**Last Updated**: October 10, 2025
**Version**: 2.0.0-enhanced
**Status**: Production Ready (pending production solver integration)
