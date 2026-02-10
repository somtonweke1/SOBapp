# SOBapp Platform User Guide

Welcome to the Mining Intelligence & Analytics (SOBapp) platform! This comprehensive guide will help you get started and make the most of the platform's powerful features.

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Supply Chain Analysis](#supply-chain-analysis)
- [Material Flow Tracking](#material-flow-tracking)
- [Market Intelligence](#market-intelligence)
- [Mining Intelligence](#mining-intelligence)
- [Scenario Analysis](#scenario-analysis)
- [Visualization Tools](#visualization-tools)
- [Export & Reporting](#export--reporting)
- [Account Management](#account-management)
- [Tips & Best Practices](#tips--best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Creating an Account

1. Visit [miar-platform.com](https://miar-platform.com)
2. Click "Sign Up" in the top right corner
3. Fill in your details:
   - Name
   - Email address
   - Password (minimum 8 characters)
   - Organization (optional)
4. Verify your email address
5. Complete your profile

### First Login

After creating your account:

1. **Dashboard Tour**: Take the guided tour to familiarize yourself with key features
2. **Sample Data**: Explore pre-loaded sample data to understand capabilities
3. **Tutorial Videos**: Watch quick-start videos in the Help Center
4. **Documentation**: Review this guide and API documentation

### Navigation

The platform uses a consistent navigation structure:

- **Top Bar**: Account menu, notifications, search
- **Side Navigation**: Main features and modules
- **Breadcrumbs**: Current location path
- **Context Menu**: Right-click for quick actions

## Dashboard Overview

The dashboard provides a comprehensive view of your supply chain and mining operations.

### Key Sections

#### 1. Key Metrics

**Location**: Top of dashboard

**Displays**:
- **Total Analyses**: Number of completed supply chain analyses
- **Active Scenarios**: Running scenario simulations
- **Monitored Materials**: Materials being tracked
- **Network Nodes**: Total supply chain nodes

**Usage**:
- Click any metric to view detailed breakdown
- Hover for trend information
- Use date picker to filter time ranges

#### 2. Supply Chain Health

**Location**: Left panel

**Features**:
- **Health Score**: Overall supply chain resilience (0-100)
- **Risk Indicators**: Active warnings and alerts
- **Bottleneck Summary**: Critical chokepoints identified
- **Recent Changes**: Timeline of significant events

**Color Coding**:
- 🟢 Green (80-100): Healthy, low risk
- 🟡 Yellow (50-79): Moderate risk, attention needed
- 🔴 Red (0-49): High risk, immediate action required

#### 3. Material Flow Visualization

**Location**: Center panel

**Features**:
- Interactive flow diagram
- Material volume indicators
- Lead time display
- Disruption alerts

**Interactions**:
- **Click nodes**: View detailed information
- **Drag**: Rearrange visualization
- **Hover**: See connection details
- **Zoom**: Mouse wheel or pinch gesture

#### 4. Market Intelligence

**Location**: Right panel

**Displays**:
- Latest commodity prices
- Market trends and analysis
- News and insights
- Price alerts

**Customization**:
- Select materials to track
- Configure price alerts
- Choose news sources
- Set update frequency

#### 5. Recent Activity

**Location**: Bottom panel

**Shows**:
- Completed analyses
- Updated scenarios
- System alerts
- Team activity (enterprise plans)

## Supply Chain Analysis

Supply chain analysis helps identify risks, bottlenecks, and optimization opportunities.

### Running an Analysis

#### Step 1: Create New Analysis

1. Click **"New Analysis"** button
2. Choose analysis type:
   - **Quick Analysis**: Automated with default settings
   - **Custom Analysis**: Configure specific parameters
   - **Scenario Comparison**: Compare multiple scenarios

#### Step 2: Configure Network

**Option A: Import Data**

```json
{
  "nodes": [
    {
      "id": "supplier_1",
      "name": "Primary Lithium Supplier",
      "type": "supplier",
      "location": "Chile",
      "capacity": 50000
    },
    {
      "id": "manufacturer_1",
      "name": "Battery Manufacturer",
      "type": "manufacturer",
      "location": "China",
      "capacity": 100000
    }
  ],
  "links": [
    {
      "source": "supplier_1",
      "target": "manufacturer_1",
      "material": "lithium",
      "volume": 45000,
      "leadTime": 30
    }
  ]
}
```

**Option B: Visual Builder**

1. Drag nodes from palette
2. Connect with links
3. Set properties in sidebar
4. Save as template for reuse

**Option C: Upload File**

- Supported formats: JSON, CSV, Excel
- Use provided template
- Map columns to fields
- Validate before import

#### Step 3: Select Analysis Types

- **Centrality Analysis**: Identify critical nodes
  - Betweenness centrality
  - Degree centrality
  - Eigenvector centrality
  - Closeness centrality

- **Bottleneck Detection**: Find capacity constraints
  - Capacity utilization
  - Lead time analysis
  - Risk concentration

- **Resilience Assessment**: Evaluate robustness
  - Redundancy analysis
  - Failure impact simulation
  - Recovery time estimation

- **Optimization**: Suggest improvements
  - Route optimization
  - Inventory optimization
  - Supplier diversification

#### Step 4: Run Analysis

1. Click **"Run Analysis"**
2. Monitor progress (typically 30-120 seconds)
3. Receive notification when complete
4. Review results

### Understanding Results

#### Centrality Metrics

**Betweenness Centrality** (0-1):
- Measures how often a node appears on shortest paths
- High values: Critical intermediaries
- **Action**: Ensure redundancy for high-centrality nodes

**Degree Centrality**:
- Number of connections a node has
- Hub nodes have high degree
- **Action**: Monitor highly connected nodes for disruptions

**Example**:
```
Node: "Primary Supplier A"
├─ Betweenness: 0.85 (High - Critical)
├─ Degree: 12 (Highly connected)
├─ Eigenvector: 0.76 (Influential)
└─ Risk Level: HIGH
   └─ Recommendation: Diversify suppliers
```

#### Bottleneck Analysis

**Identified Bottlenecks**:
1. **Production Capacity**
   - Location: Manufacturer B
   - Impact: 30% throughput reduction
   - Mitigation: Increase capacity or diversify

2. **Transportation**
   - Location: Port of Shanghai
   - Impact: 45-day delays possible
   - Mitigation: Alternative routes

3. **Critical Supplier**
   - Location: Rare Earth Supplier
   - Impact: Complete production halt
   - Mitigation: Build strategic reserves

#### Recommendations

The platform provides actionable recommendations:

**Example Recommendation**:
```
Priority: HIGH
Category: Supplier Diversification

Issue:
Single-source dependency for Lithium Carbonate
creates critical supply chain risk.

Recommendation:
Engage 2-3 additional suppliers in different
geographic regions.

Expected Impact:
- Risk reduction: 60%
- Cost increase: 5-8%
- Lead time: +3 days

Implementation:
1. Identify alternative suppliers
2. Conduct quality assessment
3. Negotiate contracts
4. Phase in over 6 months

ROI: Positive within 18 months
```

## Material Flow Tracking

Track materials through your supply chain in real-time.

### Setting Up Tracking

#### 1. Select Materials

Navigate to **Material Flow** > **Add Material**

**Critical Materials** (pre-configured):
- Battery metals: Li, Co, Ni, Mn
- Rare earth elements: Nd, Pr, Dy
- Base metals: Cu, Al, Fe
- Precious metals: Au, Ag, Pt

**Custom Materials**:
- Add any material
- Configure properties
- Set tracking parameters

#### 2. Configure Tracking

**Basic Settings**:
- Material name and code
- Unit of measurement
- Tracking frequency
- Alert thresholds

**Advanced Settings**:
- Price tracking sources
- Quality specifications
- Regulatory requirements
- Sustainability metrics

#### 3. Connect Sources

**Data Sources**:
- ERP systems (SAP, Oracle)
- IoT sensors
- Manual entry
- Partner APIs
- Market data feeds

**Integration Methods**:
- API endpoints
- File upload (scheduled)
- Database connection
- Manual updates

### Viewing Material Flow

#### Flow Diagram

**Elements**:
- **Nodes**: Supply chain participants
- **Links**: Material movements
- **Thickness**: Volume indicator
- **Color**: Status/health
- **Animation**: Real-time flow

**Interactions**:
```
Click Node:
├─ View details panel
├─ Historical data
├─ Connected flows
└─ Edit properties

Click Link:
├─ Flow volume and rate
├─ Lead time analysis
├─ Historical trends
└─ Identify delays

Right-click:
├─ Add alert
├─ Export data
├─ Create scenario
└─ Share view
```

#### Data Table View

Switch to table view for detailed data:

| Material | Source | Destination | Volume | Lead Time | Status |
|----------|--------|-------------|--------|-----------|--------|
| Lithium | Chile | China | 45,000t | 32 days | ✅ On Time |
| Cobalt | DRC | Belgium | 12,000t | 28 days | ⚠️ Delayed |
| Nickel | Australia | Japan | 35,000t | 21 days | ✅ On Time |

**Features**:
- Sort by any column
- Filter by status, material, location
- Export to Excel/CSV
- Create custom views

### Alerts and Notifications

#### Setting Up Alerts

1. **Navigate**: Material Flow > Alerts
2. **Create**: New Alert
3. **Configure**:
   - Material to monitor
   - Condition (price, volume, delay)
   - Threshold value
   - Notification method

**Example Alert**:
```yaml
Name: Lithium Price Spike
Condition: Price > $30,000/tonne
Action: Email + SMS
Recipients: procurement@company.com
Frequency: Immediate
```

#### Alert Types

**Price Alerts**:
- Threshold exceeded
- Rapid price changes
- Historical anomalies

**Supply Alerts**:
- Delivery delays
- Quality issues
- Capacity constraints

**Risk Alerts**:
- Geopolitical events
- Natural disasters
- Supplier issues

## Market Intelligence

Access real-time market data and AI-powered insights.

### Commodity Prices

#### Viewing Prices

**Navigate**: Market Intelligence > Commodities

**Display Options**:
- List view
- Chart view
- Heat map
- Comparison view

**Example Display**:
```
Lithium Carbonate (Battery Grade)
├─ Current: $25,150 USD/tonne
├─ Change: +$1,250 (+5.2%)
├─ Volume: 145,000 tonnes
├─ 52-Week Range: $18,500 - $32,000
└─ Forecast: ↗ Upward trend expected
```

#### Price Charts

**Chart Types**:
- Line chart: Price over time
- Candlestick: OHLC (Open, High, Low, Close)
- Volume chart: Trading volumes
- Comparison: Multiple commodities

**Timeframes**:
- 1D: Intraday (15-min intervals)
- 1W: Week view
- 1M: Month view
- 1Y: Year view
- 5Y: Five-year historical
- All: Complete history

**Technical Indicators**:
- Moving averages (SMA, EMA)
- Bollinger Bands
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)

#### Price Alerts

Set alerts for price movements:

```
Alert: Lithium Price Alert
Trigger: Price crosses $28,000
Action: Send email notification
Frequency: Once
Valid Until: 2025-12-31
```

### News & Insights

#### News Feed

**Features**:
- Real-time mining and commodities news
- AI-powered relevance filtering
- Sentiment analysis
- Source credibility scoring

**Sources**:
- Bloomberg
- Reuters
- Mining.com
- Industry publications
- Company announcements

**Filtering**:
```
Filters:
├─ Material: Lithium, Cobalt
├─ Region: South America
├─ Type: Supply disruption
├─ Sentiment: Negative
└─ Date: Last 7 days
```

#### AI Insights

**Perplexity AI Integration**:

Ask questions in natural language:

**Example Queries**:
- "What's driving lithium prices this month?"
- "Analyze copper supply chain risks"
- "Compare nickel producers by cost"
- "Predict rare earth demand for EVs"

**Response Format**:
```
Query: "What's driving lithium prices?"

AI Insight:
Lithium prices are rising due to three main factors:

1. **EV Demand Growth** (65% impact)
   - Global EV sales up 28% YoY
   - Major automakers expanding production
   - Government incentives increasing

2. **Supply Constraints** (25% impact)
   - Delayed Australian mine expansions
   - Chilean production limitations
   - Processing capacity bottlenecks

3. **Inventory Drawdowns** (10% impact)
   - Strategic reserves being depleted
   - Just-in-time procurement challenges

Forecast: Prices likely to remain elevated
through Q4 2025, with potential relief in
early 2026 as new capacity comes online.

Confidence: 89%
Sources: 12 analyzed
Last Updated: 2 hours ago
```

## Mining Intelligence

Access comprehensive global mining data and analytics.

### Mining Database

**Navigate**: Mining Intelligence > Database

**Search Capabilities**:
- Mine name or operator
- Commodity type
- Country or region
- Production volume
- Operational status

**Example Entry**:
```
Escondida Mine
├─ Location: Antofagasta, Chile
├─ Operator: BHP
├─ Commodity: Copper
├─ Status: ⚪ Operational
├─ Production: 1.2M tonnes/year (2024)
├─ Reserves: 35M tonnes
├─ Coordinates: -69.0°, -24.2°
├─ Employment: 3,000+
└─ Environmental: ISO 14001 certified
```

**Data Export**:
- CSV: For Excel analysis
- JSON: For API integration
- PDF: For reports
- GeoJSON: For mapping

### Exploration Discoveries

Track new mineral discoveries and exploration projects.

**Filters**:
- Discovery date
- Material type
- Geographic region
- Reserve estimates
- Development stage

**Example**:
```
New Discovery: Rare Earth Deposit

Location: Northern Territory, Australia
Material: Nd, Pr, Dy (Heavy Rare Earths)
Estimated Reserves: 2.5M tonnes
Grade: 8.5% TREO
Discovery Date: July 2025
Development Stage: Exploration
Expected Production: 2028
Confidence: Moderate (68%)
```

### Extraction Optimization

Analyze and optimize mining operations.

**Input Data**:
```json
{
  "mine": "Copper Mountain",
  "oreGrade": 1.2,
  "recoveryRate": 0.85,
  "throughput": 50000,
  "costs": {
    "mining": 15,
    "processing": 8,
    "transport": 3
  }
}
```

**Optimization Results**:
```
Current Efficiency: 78%
Optimized Efficiency: 89% (+11%)

Recommendations:
1. Increase crushing circuit efficiency
   Impact: +5% recovery
   Cost: $1.2M
   ROI: 8 months

2. Optimize blasting patterns
   Impact: +3% ore recovery
   Cost: $350K
   ROI: 4 months

3. Implement flotation automation
   Impact: +3% metallurgical recovery
   Cost: $2.5M
   ROI: 14 months

Total Annual Benefit: $8.5M
Total Investment: $4.05M
Payback Period: 5.7 months
```

### Tailings Analysis

Assess economic potential of mine tailings.

**Sample Input**:
```json
{
  "mineId": "goldmine_123",
  "tailingsVolume": 1000000,
  "composition": {
    "gold": 0.3,
    "silver": 2.5,
    "copper": 0.15
  },
  "accessibility": "good",
  "infrastructure": "existing"
}
```

**Economic Assessment**:
```
Recoverable Value Analysis

Gold:    3,000 oz  × $2,000/oz = $6.0M
Silver:  25,000 oz × $25/oz   = $0.625M
Copper:  1,500 t   × $9,000/t = $13.5M

Total Gross Value: $20.125M

Reprocessing Costs:
├─ Extraction: $8.5M
├─ Processing: $5.2M
├─ Transport: $1.8M
└─ Environmental: $2.1M
Total: $17.6M

Net Economic Value: $2.525M

Recommendation: PROCEED
ROI: 14.3%
Environmental Benefit: Reduced waste
```

## Scenario Analysis

Create and compare "what-if" scenarios.

### Creating Scenarios

#### Step 1: Start New Scenario

**Navigate**: Scenarios > Create New

**Scenario Types**:
- **Supply Disruption**: Model supplier failures
- **Demand Shock**: Analyze demand changes
- **Price Volatility**: Test price scenarios
- **Technology Shift**: New materials or processes
- **Geopolitical**: Regional instability
- **Climate Events**: Natural disasters
- **Custom**: Define your own parameters

#### Step 2: Define Parameters

**Example: Supply Disruption Scenario**
```yaml
Name: "Chilean Lithium Mine Closure"

Base Assumptions:
  - Current supply: 500,000 tonnes/year
  - Affected supply: 125,000 tonnes/year (25%)
  - Duration: 6 months
  - Recovery: Gradual over 3 months

Impact Areas:
  - Price: Expected increase
  - Lead times: Extended
  - Alternative sources: Australia, Argentina
  - Inventory: Draw down strategic reserves

External Factors:
  - EV demand continues growing
  - No other major disruptions
  - Weather conditions normal
  - Political stability maintained
```

#### Step 3: Run Simulation

1. Click "Run Scenario"
2. AI processes multiple variables
3. Monte Carlo simulation (1,000+ runs)
4. Results generated (2-5 minutes)

### Analyzing Results

**Scenario Results Dashboard**:

```
Scenario: Chilean Lithium Mine Closure
Status: ✅ Completed
Confidence: 87%

Key Findings:

1. Price Impact
   ├─ Immediate: +15% ($4,000)
   ├─ Peak (Month 3): +28% ($7,500)
   ├─ Recovery (Month 9): +8% ($2,000)
   └─ Probability Distribution:
       - 50% probability: +20-25%
       - 95% probability: +10-35%

2. Supply Chain Impact
   ├─ Lead Times: +18 days average
   ├─ Spot Market: 40% increase in activity
   ├─ Inventory: Critical levels by Month 4
   └─ Alternative Sources: +45% Australian imports

3. Business Impact
   ├─ Procurement Costs: +$12M annually
   ├─ Production Delays: Potential 3-week halt
   ├─ Customer Commitments: 85% maintained
   └─ Mitigation Cost: $2.5M

Recommendations:
1. Build strategic inventory (3-month supply)
2. Diversify suppliers immediately
3. Lock in contracts with Australian producers
4. Consider spot market hedging
```

### Comparing Scenarios

**Multi-Scenario Comparison**:

| Metric | Baseline | Scenario A | Scenario B | Scenario C |
|--------|----------|------------|------------|------------|
| Price Impact | - | +15% | +25% | +8% |
| Lead Time | 30d | 48d | 55d | 35d |
| Cost Increase | - | $12M | $18M | $6M |
| Risk Level | Low | High | Critical | Moderate |
| Mitigation Cost | - | $2.5M | $5M | $1.2M |

**Visualization**:
- Side-by-side charts
- Tornado diagrams (sensitivity)
- Probability distributions
- Timeline comparisons

### Scenario Library

**Pre-built Scenarios**:
- EV Demand Surge (2x growth)
- China Trade Restrictions
- Green Energy Transition (2030)
- Pandemic-like Disruption
- Climate Change Impacts
- Technology Breakthrough (Solid-state batteries)

**Custom Templates**:
- Save your scenarios as templates
- Share with team members
- Version control
- Export/import

## Visualization Tools

The platform provides multiple visualization options.

### 2D Network Graph

**Features**:
- Force-directed layout
- Hierarchical views
- Custom positioning
- Multiple layouts (circular, tree, force)

**Controls**:
```
Mouse:
├─ Click: Select node/link
├─ Drag: Move nodes
├─ Wheel: Zoom in/out
└─ Right-click: Context menu

Keyboard:
├─ Arrow keys: Pan view
├─ +/- : Zoom
├─ Space: Reset view
└─ Esc: Deselect

Touch:
├─ Tap: Select
├─ Drag: Pan
├─ Pinch: Zoom
└─ Long press: Context menu
```

### 3D Visualization

**Navigate**: Visualization > 3D View

**Features**:
- Three.js-powered 3D rendering
- Real-time material flow
- Interactive globe view
- Zoom from global to node level

**Controls**:
```
Mouse:
├─ Left drag: Rotate
├─ Right drag: Pan
├─ Wheel: Zoom
└─ Click: Select

Keyboard:
├─ Arrow keys: Rotate
├─ Shift + Arrows: Pan
├─ +/- : Zoom
└─ R: Reset view

VR Mode:
├─ WebVR support
├─ Oculus Quest compatible
└─ Immersive exploration
```

### Geographic Map

**Map Providers**:
- Mapbox (default)
- Google Maps
- OpenStreetMap

**Layers**:
```
Available Layers:
├─ ☑ Mines
├─ ☑ Suppliers
├─ ☑ Manufacturers
├─ ☑ Distribution Centers
├─ ☑ Trade Routes
├─ ☐ Ports
├─ ☐ Airports
├─ ☐ Rail Lines
└─ ☐ Political Boundaries
```

**Heat Maps**:
- Production density
- Risk concentration
- Price variations
- Environmental impact

### Charts & Graphs

**Chart Types**:
- **Line**: Trends over time
- **Bar**: Comparisons
- **Pie/Donut**: Proportions
- **Scatter**: Correlations
- **Sankey**: Flow diagrams
- **Treemap**: Hierarchical data
- **Radar**: Multi-dimensional comparison

**Customization**:
- Color schemes
- Labels and annotations
- Axes configuration
- Export options (PNG, SVG, PDF)

### Data Table

**Features**:
- Sortable columns
- Filterable rows
- Resizable columns
- Column show/hide
- Cell formatting
- Conditional formatting
- Pivot tables
- Export to Excel/CSV

## Export & Reporting

Generate comprehensive reports from your analyses.

### Export Options

#### PDF Export

**Navigate**: Analysis > Export > PDF

**Template Options**:
1. **Executive Summary**
   - Key findings
   - Recommendations
   - High-level visualizations
   - 2-3 pages

2. **Detailed Report**
   - Complete analysis
   - All visualizations
   - Data tables
   - Methodology
   - 10-20 pages

3. **Custom Report**
   - Select sections
   - Choose visualizations
   - Add commentary
   - Custom branding

**Example Report Structure**:
```
Executive Summary Report

Cover Page
├─ Title
├─ Date
├─ Company Logo
└─ Confidentiality Notice

Executive Summary (1 page)
├─ Key Findings (3-5 points)
├─ Critical Risks
├─ Top Recommendations
└─ Overall Health Score

Supply Chain Overview (1-2 pages)
├─ Network Diagram
├─ Material Flow Visualization
├─ Key Metrics Table
└─ Status Indicators

Risk Analysis (2-3 pages)
├─ Identified Risks
├─ Risk Matrix
├─ Mitigation Strategies
└─ Timeline

Recommendations (1-2 pages)
├─ Prioritized Actions
├─ Implementation Plan
├─ Expected Outcomes
└─ ROI Analysis

Appendix
├─ Methodology
├─ Data Sources
├─ Assumptions
└─ Glossary
```

#### Excel Export

**Data Tables**:
- Raw data
- Calculated metrics
- Charts
- Pivot tables
- Formulas preserved

**Multiple Sheets**:
```
Workbook Structure:
├─ Summary
├─ Network Data
├─ Material Flow
├─ Price Data
├─ Risk Analysis
├─ Recommendations
└─ Charts
```

#### API Export

**Programmatic Access**:
```typescript
// Export analysis results
const exportData = await client.analysis.export({
  analysisId: 'analysis_123',
  format: 'json',
  sections: ['all']
});

// Download PDF
const pdfUrl = await client.reports.generate({
  analysisId: 'analysis_123',
  template: 'executive-summary'
});
```

### Scheduling Reports

**Automated Reports**:
```yaml
Report Schedule:
  Name: "Weekly Supply Chain Summary"
  Template: Executive Summary
  Recipients:
    - executive@company.com
    - ops@company.com
  Frequency: Weekly (Monday 9 AM)
  Format: PDF + Excel
  Delivery: Email
  Include:
    - Latest analysis results
    - Material price changes
    - Risk alerts
    - News summary
```

### Sharing & Collaboration

**Share Options**:
1. **Email**: Send directly from platform
2. **Link**: Generate shareable link (expiring)
3. **Embed**: Iframe embedding code
4. **Public URL**: Public access (enterprise only)

**Permissions**:
- View only
- View + Comment
- View + Edit
- Full control

## Account Management

Manage your account settings and subscription.

### Profile Settings

**Navigate**: Account > Profile

**Editable Fields**:
- Name
- Email
- Password
- Organization
- Time zone
- Language
- Notification preferences

### Subscription

**Current Plans**:

**Free Tier**:
- ✅ 3 analyses per month
- ✅ Basic visualizations
- ✅ Limited API access (100 req/min)
- ❌ Advanced features
- ❌ Priority support

**Professional ($299/month)**:
- ✅ Unlimited analyses
- ✅ Advanced visualizations
- ✅ Full API access (1000 req/min)
- ✅ Scenario analysis
- ✅ PDF exports
- ✅ Email support

**Enterprise (Custom)**:
- ✅ Everything in Professional
- ✅ Custom integrations
- ✅ Dedicated support
- ✅ SLA guarantees
- ✅ On-premise deployment
- ✅ Training & onboarding

**Upgrade**:
1. Navigate to Account > Billing
2. Click "Upgrade Plan"
3. Select plan
4. Enter payment details
5. Confirm upgrade

### API Keys

**Navigate**: Account > API Keys

**Create API Key**:
1. Click "Generate New Key"
2. Name your key
3. Select permissions
4. Set expiration
5. Copy key (shown once!)

**Key Management**:
```
API Key: Production Key
├─ Created: 2025-10-16
├─ Last Used: 2 hours ago
├─ Permissions: Read/Write scenarios
├─ Rate Limit: 1000 req/min
├─ Expires: 2026-10-16
└─ Status: ✅ Active
   └─ Actions: [Regenerate] [Revoke]
```

### Team Management (Enterprise)

**Navigate**: Account > Team

**Features**:
- Add team members
- Assign roles
- Set permissions
- View activity logs
- Manage licenses

**Roles**:
- **Admin**: Full access, billing
- **Analyst**: Create analyses, scenarios
- **Viewer**: Read-only access
- **API User**: API access only

## Tips & Best Practices

### Performance Tips

1. **Cache Data Locally**
   - Use browser caching for repeated queries
   - Download datasets for offline analysis

2. **Optimize Visualizations**
   - Limit nodes in 3D view (<1000)
   - Use aggregation for large datasets
   - Disable animations for complex networks

3. **Batch Operations**
   - Run multiple analyses overnight
   - Schedule reports during off-peak hours
   - Use API batching for bulk operations

### Data Quality

1. **Regular Updates**
   - Keep material data current
   - Review supplier information quarterly
   - Update network connections

2. **Validation**
   - Verify imported data
   - Check for outliers
   - Validate against known benchmarks

3. **Documentation**
   - Document assumptions
   - Note data sources
   - Track methodology changes

### Security

1. **API Keys**
   - Rotate keys every 90 days
   - Use different keys for dev/prod
   - Never commit keys to version control

2. **Access Control**
   - Follow principle of least privilege
   - Review team access regularly
   - Enable two-factor authentication

3. **Data Handling**
   - Don't share sensitive data via email
   - Use secure sharing features
   - Enable expiring links

## Troubleshooting

### Common Issues

#### Slow Performance

**Symptoms**:
- Long load times
- Laggy visualizations
- Timeout errors

**Solutions**:
1. **Check Internet Connection**
   - Run speed test
   - Try wired connection
   - Contact IT if needed

2. **Clear Browser Cache**
   ```
   Chrome: Ctrl+Shift+Delete
   Firefox: Ctrl+Shift+Delete
   Safari: Cmd+Option+E
   ```

3. **Reduce Visualization Complexity**
   - Filter to fewer nodes
   - Disable 3D rendering
   - Use 2D view

4. **Optimize Query Parameters**
   - Limit date ranges
   - Use pagination
   - Apply filters

#### Data Not Loading

**Symptoms**:
- Empty charts
- "No data available" messages
- Failed API calls

**Solutions**:
1. **Verify Data Connection**
   - Check network status
   - Verify API credentials
   - Test endpoint connectivity

2. **Check Permissions**
   - Verify account access level
   - Check API key permissions
   - Contact admin if restricted

3. **Refresh Data Sources**
   - Force refresh (Ctrl+F5)
   - Clear cache
   - Re-authenticate

#### Export Failures

**Symptoms**:
- PDF generation fails
- Incomplete exports
- Error messages

**Solutions**:
1. **Reduce Export Size**
   - Select fewer sections
   - Lower image resolution
   - Remove unnecessary data

2. **Try Alternative Format**
   - Use Excel instead of PDF
   - Export data only (no viz)
   - Split into multiple exports

3. **Check Browser Compatibility**
   - Use Chrome or Firefox
   - Update to latest version
   - Disable pop-up blockers

### Getting Help

**Support Channels**:

1. **Documentation**
   - This user guide
   - API documentation
   - Video tutorials

2. **In-App Help**
   - Click "?" icon
   - Context-sensitive help
   - Guided tours

3. **Email Support**
   - support@miar-platform.com
   - Response time: <24 hours (Pro)
   - Response time: <4 hours (Enterprise)

4. **Community Forum**
   - community.miar-platform.com
   - Ask questions
   - Share best practices
   - Connect with users

5. **Live Chat** (Enterprise)
   - Click chat icon
   - Connect with support agent
   - Screen sharing available

**When Contacting Support**:

Provide:
- ✅ Account email
- ✅ Description of issue
- ✅ Steps to reproduce
- ✅ Screenshots if applicable
- ✅ Browser/OS information
- ✅ Error messages

Example:
```
Subject: Export Failure - Analysis #123

Account: john@company.com
Issue: PDF export fails with error 500

Steps to Reproduce:
1. Create analysis with 500+ nodes
2. Navigate to Export > PDF
3. Select "Detailed Report" template
4. Click "Generate PDF"
5. Error appears after ~2 minutes

Error Message: "Export generation failed (500)"

Browser: Chrome 118.0.5993.70
OS: Windows 11
Screenshot: [attached]
```

## Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts:

### Global
- `Ctrl/Cmd + K`: Search
- `Ctrl/Cmd + /`: Show shortcuts
- `Ctrl/Cmd + ,`: Settings
- `Esc`: Close modal/panel

### Navigation
- `G then D`: Go to Dashboard
- `G then A`: Go to Analysis
- `G then M`: Go to Materials
- `G then S`: Go to Scenarios

### Analysis
- `Ctrl/Cmd + N`: New analysis
- `Ctrl/Cmd + R`: Run analysis
- `Ctrl/Cmd + E`: Export
- `Ctrl/Cmd + S`: Save

### Visualization
- `+/-`: Zoom in/out
- `R`: Reset view
- `F`: Fit to screen
- `Space`: Pan mode

### Data Table
- `Ctrl/Cmd + F`: Find in table
- `Ctrl/Cmd + A`: Select all
- `Ctrl/Cmd + C`: Copy selection
- `Tab`: Next cell

---

## Additional Resources

- **API Documentation**: [docs/API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Video Tutorials**: [miar-platform.com/tutorials](https://miar-platform.com/tutorials)
- **Blog**: [blog.miar-platform.com](https://blog.miar-platform.com)
- **GitHub**: [github.com/miar/platform](https://github.com/miar/platform)

**Last Updated**: October 16, 2025
