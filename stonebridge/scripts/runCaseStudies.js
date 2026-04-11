/**
 * Case Study Analysis Script
 * Analyzes Baltimore properties for GIS research project
 *
 * Usage: node scripts/runCaseStudies.js
 */

const { prisma } = require('../src/lib/prisma');
const { diagnose } = require('../src/engine/diagnose');
const { computeSpatialRisk, getSpatialContext } = require('../src/services/spatialRisk');
const fs = require('fs');
const path = require('path');

// Define case study properties (3 Baltimore addresses representing different risk levels)
const CASE_STUDY_PROPERTIES = [
  {
    id: 'case_study_1',
    address: '100 N Holliday St',
    city: 'Baltimore',
    state: 'MD',
    description: 'Downtown Baltimore - Expected low-moderate risk'
  },
  {
    id: 'case_study_2',
    address: '1500 W North Ave',
    city: 'Baltimore',
    state: 'MD',
    description: 'West Baltimore - Expected moderate-high risk'
  },
  {
    id: 'case_study_3',
    address: '3001 E Baltimore St',
    city: 'Baltimore',
    state: 'MD',
    description: 'East Baltimore - Expected high risk'
  }
];

/**
 * Run diagnostic and spatial analysis for a property
 */
async function analyzeCaseStudy(property) {
  console.log('\n' + '='.repeat(70));
  console.log(`Analyzing: ${property.address}`);
  console.log(`Description: ${property.description}`);
  console.log('='.repeat(70));

  try {
    // Run diagnostic (includes geocoding)
    console.log('\n[1/3] Running diagnostic...');
    const diagnostic = await diagnose(property.address);

    if (!diagnostic.coordinates) {
      console.warn('⚠️  Geocoding failed. Spatial analysis cannot proceed.');
      return {
        property,
        diagnostic,
        spatialRisk: null,
        spatialContext: null,
        error: 'Geocoding failed'
      };
    }

    const { latitude, longitude } = diagnostic.coordinates;
    console.log(`✓ Geocoded to: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    console.log(`✓ Risk Score: ${diagnostic.riskScore}/100`);
    console.log(`✓ Verdict: ${diagnostic.verdict}`);
    console.log(`✓ Flags: ${diagnostic.flagCount}`);
    console.log(`✓ Signals: ${diagnostic.signals.length}`);

    // Run spatial risk analysis
    console.log('\n[2/3] Running spatial risk analysis...');
    const spatialRisk = await computeSpatialRisk(latitude, longitude);

    if (spatialRisk.spatialRiskScore !== null) {
      console.log(`✓ Spatial Risk Score: ${spatialRisk.spatialRiskScore}/100`);
      console.log(`✓ Spatial Verdict: ${spatialRisk.spatialVerdict}`);
      console.log(`✓ Complaints (500m): ${spatialRisk.indicators.complaints.count}`);
      console.log(`✓ Vacant Properties (500m): ${spatialRisk.indicators.vacancy.count}`);
      console.log(`✓ In Flood Zone: ${spatialRisk.indicators.floodZone.inFloodZone ? 'Yes' : 'No'}`);
    } else {
      console.warn('⚠️  Spatial risk analysis incomplete (missing spatial data)');
    }

    // Get spatial context for GeoJSON export
    console.log('\n[3/3] Generating spatial context...');
    const spatialContext = await getSpatialContext(latitude, longitude, 500);
    console.log(`✓ Generated GeoJSON with ${spatialContext.features.length} features`);

    return {
      property,
      diagnostic: {
        riskScore: diagnostic.riskScore,
        verdict: diagnostic.verdict,
        flagCount: diagnostic.flagCount,
        signalCount: diagnostic.signals.length,
        coordinates: diagnostic.coordinates,
        signals: diagnostic.signals.map(s => ({
          category: s.category,
          severity: s.severity,
          label: s.label
        }))
      },
      spatialRisk,
      spatialContext
    };
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    return {
      property,
      error: error.message
    };
  }
}

/**
 * Generate summary table for report
 */
function generateSummaryTable(results) {
  console.log('\n' + '='.repeat(70));
  console.log('CASE STUDY SUMMARY TABLE');
  console.log('='.repeat(70));
  console.log('');
  console.log('Property | Risk Score | Verdict | Spatial Score | Complaints | Vacancies');
  console.log('-'.repeat(70));

  for (const result of results) {
    if (result.error) {
      console.log(`${result.property.address} | ERROR | - | - | - | -`);
      continue;
    }

    const riskScore = result.diagnostic.riskScore || '-';
    const verdict = result.diagnostic.verdict || '-';
    const spatialScore = result.spatialRisk?.spatialRiskScore ?? '-';
    const complaints = result.spatialRisk?.indicators?.complaints?.count ?? '-';
    const vacancies = result.spatialRisk?.indicators?.vacancy?.count ?? '-';

    console.log(`${result.property.address} | ${riskScore} | ${verdict} | ${spatialScore} | ${complaints} | ${vacancies}`);
  }

  console.log('');
}

/**
 * Export results to JSON file
 */
function exportResults(results) {
  const outputDir = path.join(__dirname, '..', 'outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'case_study_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✓ Results exported to: ${outputPath}`);

  // Export GeoJSON files for each property
  results.forEach((result, index) => {
    if (result.spatialContext) {
      const geojsonPath = path.join(outputDir, `case_study_${index + 1}_spatial_context.geojson`);
      fs.writeFileSync(geojsonPath, JSON.stringify(result.spatialContext, null, 2));
      console.log(`✓ GeoJSON exported to: ${geojsonPath}`);
    }
  });
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results) {
  const outputDir = path.join(__dirname, '..', 'outputs');
  const reportPath = path.join(outputDir, 'case_study_report.md');

  let markdown = '# StoneBridge GIS Case Study Analysis\n\n';
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += '## Executive Summary\n\n';
  markdown += 'This report presents spatial risk analysis of three Baltimore properties using GIS-based diagnostic methods.\n\n';

  markdown += '## Case Studies\n\n';

  results.forEach((result, index) => {
    markdown += `### Case Study ${index + 1}: ${result.property.address}\n\n`;
    markdown += `**Description:** ${result.property.description}\n\n`;

    if (result.error) {
      markdown += `**Status:** Error - ${result.error}\n\n`;
      return;
    }

    markdown += '#### Diagnostic Results\n\n';
    markdown += `- **Risk Score:** ${result.diagnostic.riskScore}/100\n`;
    markdown += `- **Verdict:** ${result.diagnostic.verdict}\n`;
    markdown += `- **Flags:** ${result.diagnostic.flagCount}\n`;
    markdown += `- **Coordinates:** ${result.diagnostic.coordinates.latitude.toFixed(6)}, ${result.diagnostic.coordinates.longitude.toFixed(6)}\n\n`;

    if (result.spatialRisk && result.spatialRisk.spatialRiskScore !== null) {
      markdown += '#### Spatial Risk Analysis\n\n';
      markdown += `- **Spatial Risk Score:** ${result.spatialRisk.spatialRiskScore}/100\n`;
      markdown += `- **Spatial Verdict:** ${result.spatialRisk.spatialVerdict}\n`;
      markdown += `- **311 Complaints (500m radius):** ${result.spatialRisk.indicators.complaints.count}\n`;
      markdown += `- **Vacant Properties (500m radius):** ${result.spatialRisk.indicators.vacancy.count}\n`;
      markdown += `- **In Flood Zone:** ${result.spatialRisk.indicators.floodZone.inFloodZone ? 'Yes' : 'No'}\n`;

      if (result.spatialRisk.indicators.zoning.zoningCode) {
        markdown += `- **Zoning:** ${result.spatialRisk.indicators.zoning.zoningCode}\n`;
      }

      markdown += '\n';
    }

    markdown += '---\n\n';
  });

  markdown += '## Methodology\n\n';
  markdown += '1. **Geocoding:** Addresses converted to coordinates using OpenStreetMap Nominatim\n';
  markdown += '2. **Buffer Analysis:** 500-meter radius analysis around each property\n';
  markdown += '3. **Spatial Queries:** PostGIS used for distance and overlay calculations\n';
  markdown += '4. **Risk Scoring:** Composite score based on complaint density (40%), vacancy exposure (30%), flood zone (30%)\n\n';

  fs.writeFileSync(reportPath, markdown);
  console.log(`✓ Markdown report exported to: ${reportPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('STONEBRIDGE GIS CASE STUDY ANALYSIS');
  console.log('='.repeat(70));
  console.log(`\nAnalyzing ${CASE_STUDY_PROPERTIES.length} properties...\n`);

  const results = [];

  for (const property of CASE_STUDY_PROPERTIES) {
    const result = await analyzeCaseStudy(property);
    results.push(result);

    // Wait between properties to respect geocoding rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Generate summary
  generateSummaryTable(results);

  // Export results
  exportResults(results);
  generateMarkdownReport(results);

  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(70));
  console.log('\nNext steps for your semester project:');
  console.log('1. Review outputs/case_study_results.json for detailed data');
  console.log('2. Import outputs/*.geojson files into QGIS for map generation');
  console.log('3. Use outputs/case_study_report.md as basis for your report');
  console.log('4. Generate maps showing spatial context for each property');
  console.log('\n');
}

// Run case studies
if (require.main === module) {
  main()
    .then(() => {
      console.log('✓ Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = { analyzeCaseStudy, CASE_STUDY_PROPERTIES };
