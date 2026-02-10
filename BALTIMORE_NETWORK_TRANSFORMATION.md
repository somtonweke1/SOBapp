# Baltimore Real Estate Network Transformation

## ✅ Complete Implementation

The SOBapp network systems have been successfully transformed into a **Baltimore Real Estate Network** instance.

---

## 🎯 Transformations Completed

### 1. ✅ Mineral Nodes → Property Nodes

**Replaced:**
- `SupplyChainNode` (mine, processing, transport, storage, manufacturing, market)
- Mineral production data, capacity, utilization

**With:**
- `BaltimorePropertyNode` with fields:
  - **Address**: Property street address
  - **Ward/Section**: Baltimore City ward and section
  - **Last Sale**: Date and amount of last sale
  - **Liens**: Array of property liens (DPW, tax, HOA)
  - **Position**: 3D coordinates for visualization

**Implementation:**
- `src/services/forensics/baltimorePropertyNetwork.ts`
- `BaltimorePropertyNode` interface with all required fields

---

### 2. ✅ Trade Routes → Billing Tiers

**Replaced:**
- `SupplyChainFlow` (material transport routes)
- Trade route connections between mining operations

**With:**
- `BillingTierEdge` with:
  - **Billing Tier Logic**: CCF to Gallon conversion (1 CCF = 748 gallons)
  - **Tier Classification**: Tier 1-4 based on usage
  - **Cost Calculation**: Tiered pricing structure
  - **Edge Types**: BILLING_TIER, SAME_BLOCK, LIEN_CLUSTER

**Billing Tier Structure:**
- **Tier 1**: 0-2,000 gallons @ $0.012/gallon
- **Tier 2**: 2,001-10,000 gallons @ $0.014/gallon
- **Tier 3**: 10,001-20,000 gallons @ $0.016/gallon
- **Tier 4**: 20,000+ gallons @ $0.018/gallon

**Implementation:**
- `ccfToGallons()` - Converts CCF to gallons
- `gallonsToCCF()` - Converts gallons to CCF
- `getBillingTier()` - Determines tier from usage
- Billing tier edges connect properties to tier nodes

---

### 3. ✅ Distress Score Based on Betweenness Centrality

**Implementation:**
- `calculateBetweennessCentrality()` - Calculates betweenness for each property
- `calculateDistressScore()` - Combines betweenness with lien data

**Distress Score Formula:**
```
Distress Score = (
  normalizedBetweenness * 0.5 +    // 50% weight
  lienFactor * 0.3 +                // 30% weight (lien count)
  amountFactor * 0.2                // 20% weight (lien amount)
) * 100
```

**Interpretation:**
- **High Betweenness**: Property is a "bridge" connecting different blocks/clusters
- **Higher Betweenness** = More central to distressed network = Higher distress score
- Properties with high betweenness are critical nodes in the lien network

**Scoring:**
- **0-40**: Low distress (GREEN)
- **40-70**: Medium distress (ORANGE)
- **70-100**: High distress (RED)

---

### 4. ✅ 3D Visualization with RED Color Coding

**Implementation:**
- `BaltimorePropertyNetwork3D.tsx` - 3D visualization component
- Uses Three.js for 3D rendering
- Color codes nodes based on DPW audit results

**Color Coding:**
- **RED**: DPW Audit flags math error (`dpwAuditResult.hasError === true`)
- **GREEN**: No DPW audit error
- Node size increases with severity (critical errors = larger nodes)

**View Modes:**
1. **Distress Score**: Colors by distress score (red = high, green = low)
2. **DPW Audit**: RED if audit error, GREEN if no error
3. **Billing Tiers**: Colors by billing tier (red = Tier 4, green = Tier 1)

---

## 🏗️ Architecture

### Service Layer
```
src/services/forensics/
├── baltimorePropertyNetwork.ts    ✅ Property network builder
├── dpwAuditor.ts                  ✅ DPW audit integration
└── lienMapping.ts                 ✅ Lien network mapping
```

### Components
```
src/components/deal-shield/
└── BaltimorePropertyNetwork3D.tsx ✅ 3D visualization component
```

### API
```
src/app/api/forensics/
└── baltimore-network/route.ts    ✅ Network API endpoint
```

### Pages
```
src/app/deal-shield/
└── network/page.tsx               ✅ Network visualization page
```

---

## 📊 Data Flow

### 1. Property Data Input
```typescript
{
  id: string;
  address: string;
  ward?: string;
  section?: string;
  lastSale?: { date: string; amount: number };
  liens: PropertyLien[];
  dpwBillData?: {
    meterReadCurrent: number;
    meterReadLast: number;
    totalBill: number;
  };
  position: { x: number; y: number; z: number };
}
```

### 2. Network Building Process
1. **Convert to PropertyNodes** - Standardize property data
2. **Build Lien Edges** - Create connections based on blocks
3. **Calculate Betweenness** - Compute centrality metrics
4. **Calculate Distress Scores** - Combine centrality + liens
5. **Perform DPW Audits** - If bill data provided
6. **Build Billing Tier Edges** - Connect properties to tiers
7. **Generate Network** - Create final network structure

### 3. Visualization Output
- **3D Scene**: Properties as nodes, billing tiers as edges
- **Color Coding**: RED for DPW errors, distress-based colors
- **Interactive**: Click nodes to view details
- **Multiple Views**: Distress, Audit, Billing modes

---

## 🎨 Visualization Features

### Node Colors
- **Distress Mode**: Red (high) → Orange (medium) → Green (low)
- **Audit Mode**: RED = DPW error, GREEN = no error
- **Billing Mode**: Red (Tier 4) → Orange (Tier 3) → Yellow (Tier 2) → Green (Tier 1)

### Node Sizes
- Based on distress score or severity
- Larger nodes = higher distress/severity

### Edges
- **Billing Tier Edges**: Connect properties to tier nodes
- **Block Connections**: Connect properties on same block
- **Color Coded**: Match tier colors

### Controls
- **View Mode Toggle**: Switch between Distress/Audit/Billing
- **Labels Toggle**: Show/hide property addresses
- **Edges Toggle**: Show/hide connections
- **Orbit Controls**: Rotate, zoom, pan

---

## 🔥 Key Features

### 1. Property Nodes
- ✅ Address, Ward/Section, Last Sale fields
- ✅ Lien data integration
- ✅ Position coordinates for 3D visualization

### 2. Billing Tiers
- ✅ CCF to Gallon conversion (1 CCF = 748 gallons)
- ✅ Tier classification (1-4)
- ✅ Cost calculation
- ✅ Edge connections to tier nodes

### 3. Distress Score
- ✅ Based on Betweenness Centrality
- ✅ Combines centrality + lien count + lien amount
- ✅ 0-100 scale
- ✅ Color-coded visualization

### 4. DPW Audit Integration
- ✅ Automatic audit when bill data provided
- ✅ RED color coding for errors
- ✅ Severity-based node sizing
- ✅ Error details in node info

---

## 🚀 Usage

### API Endpoint
```typescript
POST /api/forensics/baltimore-network
Body: {
  properties: [
    {
      id: 'prop-1',
      address: '123 Main St',
      ward: 'Ward 1',
      section: 'Section A',
      lastSale: { date: '2023-01-15', amount: 85000 },
      liens: [...],
      dpwBillData: { ... }, // Optional
      position: { x: 0, y: 0, z: 0 }
    }
  ]
}
```

### Component Usage
```tsx
<BaltimorePropertyNetwork3D
  nodes={baltimoreNodes}
  edges={billingTierEdges}
  onNodeClick={(node) => console.log(node)}
/>
```

---

## ✅ Implementation Status

- ✅ Property Nodes (Address, Ward/Section, Last Sale)
- ✅ Billing Tiers (CCF to Gallon conversion)
- ✅ Distress Score (Betweenness Centrality)
- ✅ 3D Visualization (Three.js)
- ✅ RED Color Coding (DPW Audit errors)
- ✅ API Endpoint
- ✅ Page Component
- ✅ Interactive Controls

**All requirements implemented and ready for use!**

---

## 🎯 The Transformation

**From:** Mining Intelligence Platform (Mineral Nodes, Trade Routes)
**To:** Baltimore Real Estate Network (Property Nodes, Billing Tiers)

**Same Network Science. Different Domain.**

The SOBapp network intelligence engine now powers Baltimore real estate forensics with:
- Property network visualization
- Distress score calculation
- DPW audit integration
- Billing tier mapping

**This is "Urban Mining Intelligence" - network science applied to real estate.**

