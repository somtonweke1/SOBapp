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

    if (complaints.count === 0) {
      signals.push({
        source: "StoneBridge GIS (PostGIS)",
        category: "GIS_SPATIAL",
        label: "Neighborhood appears cleaner than city median",
        value: `No complaint hits within ${complaints.radiusMeters}m. Estimated complaint pressure sits below Baltimore baseline.`,
        severity: "LOW",
        url: null
      });
    } else {
      const complaintSeverity = complaints.percentile >= 85 ? "HIGH" : complaints.percentile >= 65 ? "MEDIUM" : "LOW";
      signals.push({
        source: "StoneBridge GIS (PostGIS)",
        category: "GIS_SPATIAL",
        label: complaintSeverity === "HIGH" ? "Complaint pressure concentrated near subject" : "Neighborhood complaint activity visible",
        value: `${complaints.count} complaint hit${complaints.count === 1 ? "" : "s"} within ${complaints.radiusMeters}m (${complaints.density} weighted per km²), ${complaints.bandLabel}.`,
        severity: complaintSeverity,
        url: null
      });
    }

    if (vacancy.count > 0) {
      const vacancySeverity = vacancy.nearestDistanceMeters && vacancy.nearestDistanceMeters < 120
        ? "HIGH"
        : vacancy.percentile >= 65 ? "MEDIUM" : "LOW";
      signals.push({
        source: "StoneBridge GIS (PostGIS)",
        category: "GIS_SPATIAL",
        label: vacancySeverity === "HIGH" ? "Vacancy pressure concentrated near subject" : "Vacancy exposure present in radius",
        value: `${vacancy.count} vacanc${vacancy.count === 1 ? "y" : "ies"} within ${vacancy.radiusMeters}m. Nearest vacancy: ${vacancy.nearestDistanceMeters ?? "N/A"}m. ${vacancy.bandLabel}.`,
        severity: vacancySeverity,
        url: null
      });
    }

    if (floodZone.inFloodZone) {
      signals.push({
        source: "StoneBridge GIS (PostGIS)",
        category: "GIS_SPATIAL",
        label: "Flood zone exposure present",
        value: `Flood zone type: ${floodZone.floodZoneType || "Unknown"}. Spatial score includes flood exposure.`,
        severity: "MEDIUM",
        url: null
      });
    }

    signals.push({
      source: "StoneBridge GIS (PostGIS)",
      category: "GIS_SPATIAL",
      label: result.divergence.mode === "HIDDEN_NEIGHBORHOOD_RISK"
        ? "Spatial context materially worse than document screen"
        : result.divergence.mode === "PROPERTY_SPECIFIC_RISK"
          ? "Neighborhood context offsets parcel-level caution"
          : `Neighborhood context: ${result.spatialVerdict}`,
      value: `${result.summarySentence} Confidence: ${result.confidence.level}.`,
      severity: "LOW",
      url: null
    });

    console.log(`[signals:spatial] Generated ${signals.length} spatial signals`);
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
