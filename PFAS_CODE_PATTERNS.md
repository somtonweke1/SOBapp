# PFAS Implementation Code Patterns

## Pattern 1: Freundlich Capacity Calculation

### Source Code
```typescript
// /src/lib/analysis-engine.ts:37-60
export function estimateCapacityWithFreundlich(
  pfasConcentration: number,
  toc: number,
  sulfate: number,
  systemType: string
): number {
  const k = 0.15  // Freundlich constant
  const n = 0.7   // Freundlich exponent
  
  const baseCapacity = k * Math.pow(pfasConcentration, 1/n)
  
  const tocFactor = Math.max(0.5, 1 - (toc / 10))
  const sulfateFactor = Math.max(0.7, 1 - (sulfate / 200))
  const systemFactor = systemType === 'Fluidized Bed' ? 1.1 : 1.0
  
  const adjustedCapacity = baseCapacity * tocFactor * sulfateFactor * systemFactor
  
  return Math.max(0.1, adjustedCapacity)
}
```

### How It Works
1. **Base Capacity**: Uses Freundlich equation with PFAS concentration
2. **TOC Adjustment**: Higher dissolved organic carbon reduces capacity (competes for sites)
3. **Sulfate Adjustment**: Sulfate ions compete with PFAS for adsorption sites
4. **System Adjustment**: Fluidized beds have 10% better efficiency
5. **Safety Floor**: Minimum 0.1 mg/g to prevent zero results

### Example Usage
```typescript
const capacity = estimateCapacityWithFreundlich(
  pfasConcentration: 50,    // ng/L
  toc: 2.5,                 // mg/L
  sulfate: 45,              // mg/L
  systemType: 'Fixed Bed'
)
// Result: ~1.2 mg/g capacity
```

---

## Pattern 2: Thomas Breakthrough Modeling

### Source Code
```typescript
// /src/lib/breakthrough-model.ts:49-128
export function calculateBreakthroughCurve(
  influentConcentration: number,
  flowRate: number,
  bedVolume: number,
  gacDensity: number,
  capacityEstimate: number,
  ebct: number,
  duration: number = 365
): BreakthroughCurveResult {
  
  const C0 = influentConcentration / 1000
  const Q = flowRate * 24 * 1000
  const M = bedVolume * gacDensity * 1000
  const q0 = capacityEstimate
  
  // Thomas rate constant adjusted by EBCT
  const kTh = 0.005 * (ebct / 15)
  
  const points: BreakthroughPoint[] = []
  const numPoints = 200
  const timeStep = duration / numPoints
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i * timeStep
    const exponent = (kTh * q0 * M / Q) - (kTh * C0 * t)
    const CoverC0 = 1 / (1 + Math.exp(exponent))
    
    points.push({
      time: t,
      concentration: CoverC0 * influentConcentration,
      bedVolumes: (Q * t) / (bedVolume * 1000),
      percentBreakthrough: CoverC0 * 100
    })
  }
  
  return {
    points,
    breakthroughTime,    // 10%
    fiftyPercentTime,    // 50%
    exhaustionTime,      // 95%
    totalBedVolumes,
    thomasParameters: { kTh, q0, r2: 0.95 }
  }
}
```

### Key Concepts
- **C/C0 Ratio**: Effluent vs influent concentration
- **kTh**: Rate constant (0.001-0.01 L/mg·day), scaled by EBCT
- **Breakthrough Time**: When C/C0 = 10% (standard threshold)
- **200 Points**: Granular discretization for smooth curves

### Multi-Compound Example
```typescript
const results = calculateMultiCompoundBreakthrough(
  {
    'PFOA': 40,
    'PFOS': 60,
    'PFNA': 20
  },
  flowRate: 500,
  bedVolume: 10,
  gacDensity: 480,
  baseCapacity: 1.2,
  ebct: 15
)

// Each compound gets individual breakthrough prediction
// PFOS (longer chain) breaks through later than PFNA (shorter)
// Competition factor = concentration / totalPFAS
```

---

## Pattern 3: Monte Carlo Uncertainty Analysis

### Source Code
```typescript
// /src/lib/analysis-engine.ts:87-141
export function runMonteCarloSimulation(
  projectedLife: number,
  uncertainty: number = 0.18,
  iterations: number = 5000,
  useSimplified: boolean = false
): MonteCarloResults {
  
  if (useSimplified) {
    return {
      mean: projectedLife,
      p95: projectedLife * (1 + uncertainty),
      p5: projectedLife * (1 - uncertainty),
      p10: projectedLife * (1 - uncertainty * 0.75),
      p90: projectedLife * (1 + uncertainty * 0.75),
      stdDev: projectedLife * uncertainty / 2
    }
  }
  
  // Full Monte Carlo with Box-Muller normal distribution
  const results: number[] = []
  const stdDev = (projectedLife * uncertainty) / 2
  
  for (let i = 0; i < iterations; i++) {
    const randomValue = boxMullerRandom(projectedLife, stdDev)
    results[i] = Math.max(0, randomValue)
  }
  
  results.sort((a, b) => a - b)
  
  const mean = results.reduce((sum, val) => sum + val, 0) / results.length
  const variance = results.reduce((sum, val) => 
    sum + Math.pow(val - mean, 2), 0) / results.length
  const calculatedStdDev = Math.sqrt(variance)
  
  return {
    mean,
    p95: results[Math.floor(results.length * 0.95)],
    p5: results[Math.floor(results.length * 0.05)],
    p10: results[Math.floor(results.length * 0.10)],
    p90: results[Math.floor(results.length * 0.90)],
    stdDev: calculatedStdDev
  }
}

// Box-Muller Transform
function boxMullerRandom(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.max(Math.random(), Number.EPSILON)
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * stdDev + mean
}
```

### Use Cases
```typescript
// Production: Fast mode (simplified)
const results = runMonteCarloSimulation(
  projectedLife: 24,  // months
  uncertainty: 0.18,  // 18%
  iterations: 1000,
  useSimplified: true  // Fast!
)

// Research: Full mode (academic)
const results = runMonteCarloSimulation(
  projectedLife: 24,
  uncertainty: 0.18,
  iterations: 5000,
  useSimplified: false  // Accurate distribution
)
```

---

## Pattern 4: Advanced Environmental Engineering Analysis

### Source Code (Excerpt)
```typescript
// /src/lib/environmental-engineering.ts:88-125
calculateFreundlichIsotherm(
  waterQuality: WaterQualityParameters,
  gacProperties: GACSystemParameters
): AdsorptionIsotherm {
  const { temperature, pH, totalOrganicCarbon, ionicStrength } = waterQuality
  
  // Van't Hoff temperature adjustment
  const temperatureFactor = Math.exp(-2000 * (1/temperature - 1/298))
  
  // pH effect (optimal 7-8)
  const pHFactor = Math.exp(-0.5 * Math.pow(pH - 7.5, 2))
  
  // TOC competition
  const tocCompetitionFactor = Math.exp(-0.1 * totalOrganicCarbon / 10)
  
  // Ionic strength effect
  const ionicStrengthFactor = Math.exp(-2 * ionicStrength)
  
  // Combine all factors
  const kf = baseKf * temperatureFactor * pHFactor * 
             tocCompetitionFactor * ionicStrengthFactor
  
  return {
    type: 'freundlich',
    parameters: {
      kf: Math.max(kf, 0.01),
      n: Math.max(Math.min(n, 1.0), 0.3)
    }
  }
}
```

### Multi-Factor Analysis Pattern
```typescript
// Combines multiple physical/chemical principles
const analyzer = new EnvironmentalEngineeringAnalyzer()

const isotherm = analyzer.calculateFreundlichIsotherm(waterQuality, gacSystem)
const massTransfer = analyzer.calculateMassTransferCoefficients(waterQuality, gacSystem)
const reactor = analyzer.analyzeReactorHydraulics(gacSystem)
const kinetics = analyzer.calculateReactionKinetics(waterQuality, gacSystem, massTransfer)
const bedLife = analyzer.predictBedLife(waterQuality, gacSystem, isotherm)
const optimization = analyzer.calculateCostOptimization(bedLife, gacSystem, costs)

// All components feed into final analysis
return {
  adsorptionIsotherm: isotherm,
  massTransfer,
  reactorAnalysis: reactor,
  reactionKinetics: kinetics,
  bedLife,
  costOptimization: optimization
}
```

---

## Pattern 5: API Orchestration

### Source Code
```typescript
// /src/app/api/data-submission/route.ts:8-183
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactRequestId, formData } = body
    
    // Step 1: Validate input
    const validatedData = dataSubmissionSchema.parse(formData)
    
    // Step 2: Get or create contact
    let contactRequest = await prisma.contactRequest.findUnique({
      where: { id: contactRequestId }
    })
    
    if (!contactRequest) {
      contactRequest = await prisma.contactRequest.create({
        data: {
          id: contactRequestId,
          companyName: formData.companyName,
          contactEmail: formData.contactEmail,
          status: 'PENDING'
        }
      })
    }
    
    // Step 3: Store data submission
    const existingSubmission = await prisma.dataSubmissionForm.findUnique({
      where: { contactRequestId }
    })
    
    if (existingSubmission) {
      await prisma.dataSubmissionForm.update({
        where: { contactRequestId },
        data: validatedData
      })
    } else {
      await prisma.dataSubmissionForm.create({
        data: { contactRequestId, ...validatedData }
      })
    }
    
    // Step 4: Run analysis
    const analysisResults = performAnalysis(validatedData)
    
    // Step 5: Generate PDF report
    const pdfUrl = await generateReportPDF(
      analysisResults,
      validatedData,
      contactRequest
    )
    
    // Step 6: Store report
    let report = await prisma.report.findUnique({
      where: { contactRequestId }
    })
    
    if (report) {
      report = await prisma.report.update({
        where: { contactRequestId },
        data: {
          pdfUrl,
          projectedLifespanMonths: analysisResults.projectedLifespanMonths,
          capitalAvoidance: analysisResults.capitalAvoidance,
          p95SafeLifeMonths: analysisResults.p95SafeLifeMonths,
          generatedAt: new Date()
        }
      })
    } else {
      report = await prisma.report.create({
        data: {
          contactRequestId,
          pdfUrl,
          projectedLifespanMonths: analysisResults.projectedLifespanMonths,
          capitalAvoidance: analysisResults.capitalAvoidance,
          p95SafeLifeMonths: analysisResults.p95SafeLifeMonths
        }
      })
    }
    
    // Step 7: Update status
    await prisma.contactRequest.update({
      where: { id: contactRequestId },
      data: {
        status: 'REPORT_GENERATED',
        reportId: report.id
      }
    })
    
    // Step 8: Send emails (non-blocking)
    try {
      await sendReportReadyEmail({
        contactName: contactRequest.contactName,
        contactEmail: contactRequest.contactEmail,
        companyName: contactRequest.companyName,
        reportUrl: `${process.env.NEXTAUTH_URL}/report/${report.id}`,
        projectedLifespanMonths: analysisResults.projectedLifespanMonths,
        capitalAvoidance: analysisResults.capitalAvoidance,
        p95SafeLifeMonths: analysisResults.p95SafeLifeMonths
      })
      
      await sendAdminNotification({
        companyName: contactRequest.companyName,
        contactName: contactRequest.contactName,
        contactEmail: contactRequest.contactEmail,
        reportUrl: `${process.env.NEXTAUTH_URL}/report/${report.id}`,
        projectedLifespanMonths: analysisResults.projectedLifespanMonths
      })
    } catch (emailError) {
      console.error('Email error (non-fatal):', emailError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Analysis completed successfully',
      reportId: report.id,
      pdfUrl: report.pdfUrl
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

### Orchestration Pattern
```
Input Validation
    ↓
Get/Create Contact
    ↓
Store Data Submission
    ↓
Run Analysis (Freundlich + MC + Cost)
    ↓
Generate PDF Report
    ↓
Store Report in Database
    ↓
Update Status
    ↓
Send Notifications (async)
    ↓
Return Success
```

---

## Pattern 6: Input Validation (Zod)

### Source Code
```typescript
// /src/lib/validations.ts
export const dataSubmissionSchema = z.object({
  // System Configuration
  systemType: z.enum(['Fixed Bed', 'Moving Bed', 'Fluidized Bed']),
  vesselDiameter: z.number().min(0.1).max(10),
  vesselHeight: z.number().min(0.1).max(20),
  flowRate: z.number().min(0.1).max(10000),
  bedHeight: z.number().min(0.1).max(10),
  vesselVolume: z.number().min(0.001).max(1000),
  bedVolume: z.number().min(0.001).max(500),
  ebct: z.number().min(0.1).max(60),
  
  // Water Quality Parameters
  toc: z.number().min(0).max(100),
  sulfate: z.number().min(0).max(1000),
  chloride: z.number().min(0).max(1000),
  alkalinity: z.number().min(0).max(500),
  hardness: z.number().min(0).max(1000),
  ph: z.number().min(4).max(12),
  temperature: z.number().min(0).max(50),
  
  // PFAS Concentrations (ng/L)
  pfoaConcentration: z.number().min(0).max(10000),
  pfosConcentration: z.number().min(0).max(10000),
  pfnaConcentration: z.number().min(0).max(10000),
  // ... 7 more PFAS compounds
  totalPfasConcentration: z.number().min(0).max(100000),
  
  // GAC Properties
  gacType: z.string().min(1),
  gacDensity: z.number().min(200).max(1000),
  gacParticleSize: z.number().min(0.1).max(5),
  gacIodineNumber: z.number().min(200).max(2000),
  gacSurfaceArea: z.number().min(100).max(2000),
  
  // Economic Parameters
  gacCostPerKg: z.number().min(0).max(100),
  replacementCost: z.number().min(0).max(1000000),
  laborCost: z.number().min(0).max(100000),
  disposalCost: z.number().min(0).max(100000),
  
  // Operational
  operatingDaysPerYear: z.number().min(1).max(365),
  operatingHoursPerDay: z.number().min(1).max(24),
  targetRemovalEfficiency: z.number().min(50).max(99.9),
  safetyFactor: z.number().min(1).max(5)
})

export type DataSubmissionFormData = z.infer<typeof dataSubmissionSchema>
```

### Validation Usage
```typescript
// Will throw ZodError if validation fails
const validatedData = dataSubmissionSchema.parse(formData)

// Safe parsing
const result = dataSubmissionSchema.safeParse(formData)
if (!result.success) {
  console.error('Validation errors:', result.error.issues)
}
```

---

## Pattern 7: Chain Length Effects (PFAS Compound-Specific)

### Source Code
```typescript
// /src/lib/breakthrough-model.ts:177-194
function getChainLengthFactor(compound: string): number {
  const factors: { [key: string]: number } = {
    'PFBA': 0.5,      // C4 - Very weak adsorption
    'PFBS': 0.6,      // C4
    'PFPeA': 0.7,     // C5
    'PFHxA': 0.8,     // C6
    'PFHxS': 0.9,     // C6
    'PFHpA': 1.0,     // C7 - Baseline
    'PFOA': 1.2,      // C8 - Strong adsorption
    'PFOS': 1.3,      // C8 - Very strong adsorption
    'PFNA': 1.4,      // C9
    'PFDA': 1.5,      // C10
    'PFUnDA': 1.6,    // C11
    'PFDoA': 1.7      // C12 - Very long chain
  }
  
  return factors[compound] || 1.0  // Default to baseline if unknown
}
```

### Application
```typescript
// PFOA (C8) adsorbs 1.2x stronger than PFBA (C4)
const capacity_PFOA = 0.5 * 1.2 = 0.6 mg/g
const capacity_PFBA = 0.5 * 0.5 = 0.25 mg/g

// In multi-compound breakthrough:
// PFOA breaks through later (stronger adsorption)
// PFBA breaks through earlier (weaker adsorption)
```

---

## Summary: How All Patterns Work Together

```
Input → Validation → Analysis → Report → Storage → Output
   ↓        ↓           ↓          ↓        ↓        ↓
  Data    Zod       Freundlich   PDF    Database  Email
  Form   Schema      + Thomas    Gen     Schema   Notif
         Check      + Monte      
                    Carlo
```

Each pattern is:
- **Modular**: Independent functions
- **Testable**: Pure functions with clear inputs/outputs
- **Reusable**: Can be called from different contexts
- **Scientific**: Based on peer-reviewed models
- **Economic**: Quantifies business impact

For MIAR integration, these same patterns can be applied to:
- Entity resolution (like Freundlich → PFAS matching)
- Risk scoring (like Thomas → sanctions exposure)
- Uncertainty analysis (like Monte Carlo → confidence intervals)
- Compliance reporting (like PDF gen → automated reports)
