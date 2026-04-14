/**
 * GIS Spatial Risk Signals
 * Uses PostGIS to analyze spatial risks: complaint density, vacancy exposure, flood zones
 */

const { computeSpatialRisk } = require("../../services/spatialRisk");

/**
 * Check spatial/GIS-based risk factors for a property
 * Requires coordinates (from geocoding)
 * @param {string} address - Full address
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @returns {Promise<Array>} Spatial risk signals
 */
async function checkSpatialRisk(address, latitude, longitude, options = {}) {
  const signals = [];

  console.log(`[signals:spatial] Running GIS analysis for ${address} at (${latitude}, ${longitude})`);

  // Skip spatial analysis if no coordinates
  if (!latitude || !longitude) {
    console.log("[signals:spatial] No coordinates - skipping analysis");
    return [{
      source: "StoneBridge GIS (no coordinates)",
      category: "INFRASTRUCTURE",
      label: "Spatial analysis unavailable",
      value: "Address could not be geocoded for spatial risk analysis",
      severity: "LOW",
      url: null
    }];
  }

  try {
    const result = await computeSpatialRisk(latitude, longitude, options);
    const complaints = result.indicators.complaints;
    const vacancy = result.indicators.vacancy;
    const floodZone = result.indicators.floodZone;
    const pattern = result.neighborhoodPattern;

    // Enhanced complaint signal with trend context
    if (complaints.count === 0) {
      signals.push({
        source: "StoneBridge GIS (PostGIS)",
        category: "GIS_SPATIAL",
        label: "Neighborhood appears cleaner than city median",
        value: `No complaint hits within ${complaints.radiusMeters}m. Estimated complaint pressure sits below Baltimore baseline. Investment implication: Neighborhood conditions support stabilized occupancy and market-rate positioning.`,
        severity: "LOW",
        url: null
      });
    } else {
      const complaintSeverity = complaints.percentile >= 85 ? "HIGH" : complaints.percentile >= 65 ? "MEDIUM" : "LOW";
      const trend = pattern.trend?.complaint;
      let trendInsight = '';

      if (trend?.direction === 'accelerating') {
        trendInsight = ` ⚠️ Trend Alert: ${trend.recent90} complaints in last 90 days—activity is accelerating. Price in deteriorating conditions.`;
      } else if (trend?.direction === 'improving') {
        trendInsight = ` ✓ Improving: Most complaints are historical. Neighborhood may be stabilizing.`;
      }

      signals.push({
        source: "StoneBridge GIS (PostGIS)",
        category: "GIS_SPATIAL",
        label: complaintSeverity === "HIGH" ? "Complaint pressure concentrated near subject" : "Neighborhood complaint activity visible",
        value: `${complaints.count} complaint hit${complaints.count === 1 ? "" : "s"} within ${complaints.radiusMeters}m (${complaints.density} weighted per km²), ${complaints.bandLabel}.${trendInsight} Impact: ${complaintSeverity === 'HIGH' ? 'Heavy service burden—budget for tenant complaints and municipal friction' : 'Manageable service context—monitor but not a primary blocker'}.`,
        severity: complaintSeverity,
        url: null
      });
    }

    // Enhanced vacancy signal with proximity and trend context
    if (vacancy.count > 0) {
      const vacancySeverity = vacancy.nearestDistanceMeters && vacancy.nearestDistanceMeters < 120
        ? "HIGH"
        : vacancy.percentile >= 65 ? "MEDIUM" : "LOW";
      const trend = pattern.trend?.vacancy;
      let trendInsight = '';
      let investmentInsight = '';

      if (trend?.direction === 'accelerating' && trend.recent90 >= 2) {
        trendInsight = ` 🚨 Cascading Vacancy: ${trend.recent90} new notices in 90 days. Watch for contagion effects.`;
        investmentInsight = 'Underwriting impact: Require higher contingency reserves and stress-test exit timing. Vacancy spillover risk is material.';
      } else if (trend?.direction === 'improving') {
        trendInsight = ` Stabilizing: Most vacancy notices are old.`;
        investmentInsight = 'Underwriting impact: Vacancy is legacy issue—verify if properties have been rehabbed or remain blighted.';
      } else {
        investmentInsight = vacancySeverity === 'HIGH'
          ? 'Underwriting impact: Vacancy clustering within 120m affects comp quality and tenant perception. Budget for curb appeal investment.'
          : 'Underwriting impact: Vacancy present but not immediately adjacent. Monitor but likely manageable.';
      }

      signals.push({
        source: "StoneBridge GIS (PostGIS)",
        category: "GIS_SPATIAL",
        label: vacancySeverity === "HIGH" ? "Vacancy pressure concentrated near subject" : "Vacancy exposure present in radius",
        value: `${vacancy.count} vacanc${vacancy.count === 1 ? "y" : "ies"} within ${vacancy.radiusMeters}m. Nearest: ${vacancy.nearestDistanceMeters ?? "N/A"}m. ${vacancy.bandLabel}.${trendInsight} ${investmentInsight}`,
        severity: vacancySeverity,
        url: null
      });
    }

    // Enhanced flood zone signal with insurance implications
    if (floodZone.inFloodZone) {
      signals.push({
        source: "StoneBridge GIS (PostGIS)",
        category: "GIS_SPATIAL",
        label: "Flood zone exposure present",
        value: `Flood zone type: ${floodZone.floodZoneType || "Unknown"}. Spatial score includes flood exposure. Underwriting impact: Verify flood insurance requirements, elevation certificates, and historical flooding events. May impact lender requirements and exit cap rates.`,
        severity: "MEDIUM",
        url: null
      });
    }

    // Enhanced divergence signal with actionable next steps
    const divergenceLabel = result.divergence.mode === "HIDDEN_NEIGHBORHOOD_RISK"
      ? "⚠️ Spatial context materially worse than document screen"
      : result.divergence.mode === "PROPERTY_SPECIFIC_RISK"
        ? "✓ Neighborhood context offsets parcel-level caution"
        : `Neighborhood context: ${result.spatialVerdict}`;

    signals.push({
      source: "StoneBridge GIS (PostGIS)",
      category: "GIS_SPATIAL",
      label: divergenceLabel,
      value: `${result.summarySentence} Confidence: ${result.confidence.level}. Neighborhood Pattern: ${pattern.label}. ${result.action}`,
      severity: result.spatialVerdict === 'ESCALATE' ? 'HIGH' : result.spatialVerdict === 'CAUTION' ? 'MEDIUM' : 'LOW',
      url: null
    });

    console.log(`[signals:spatial] Generated ${signals.length} spatial signals with enhanced context`);
    return signals;

  } catch (error) {
    console.error("[signals:spatial] GIS analysis failed:", error.message);
    return [{
      source: "StoneBridge GIS (error)",
      category: "INFRASTRUCTURE",
      label: "Spatial analysis failed",
      value: `GIS database error: ${error.message}`,
      severity: "LOW",
      url: null
    }];
  }
}

module.exports = { checkSpatialRisk };
