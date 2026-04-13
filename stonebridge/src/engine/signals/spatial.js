/**
 * GIS Spatial Risk Signals
 * Uses PostGIS to analyze spatial risks: complaint density, vacancy exposure, flood zones
 */

const { calculateComplaintDensity, calculateVacancyExposure, checkFloodZone } = require("../../services/spatialRisk");

/**
 * Check spatial/GIS-based risk factors for a property
 * Requires coordinates (from geocoding)
 * @param {string} address - Full address
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @returns {Promise<Array>} Spatial risk signals
 */
async function checkSpatialRisk(address, latitude, longitude) {
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
    // Run all spatial queries in parallel
    const [complaintDensity, vacancyExposure, floodZone] = await Promise.allSettled([
      calculateComplaintDensity(latitude, longitude, 500),
      calculateVacancyExposure(latitude, longitude, 500),
      checkFloodZone(latitude, longitude)
    ]);

    // Process complaint density (311 service requests within 500m)
    if (complaintDensity.status === "fulfilled" && complaintDensity.value) {
      const { count, density, radiusMeters } = complaintDensity.value;

      if (count > 0) {
        let severity = "LOW";
        let label = "Low complaint density in area";

        if (count >= 50) {
          severity = "HIGH";
          label = "High concentration of 311 complaints nearby";
        } else if (count >= 20) {
          severity = "MEDIUM";
          label = "Moderate 311 complaint activity nearby";
        }

        signals.push({
          source: "StoneBridge GIS (PostGIS)",
          category: "INFRASTRUCTURE",
          label,
          value: `${count} service requests within ${radiusMeters}m (${density} per km²)`,
          severity,
          url: null
        });
      } else {
        signals.push({
          source: "StoneBridge GIS (PostGIS)",
          category: "INFRASTRUCTURE",
          label: "Clean area - no recent complaints",
          value: `0 service requests within ${radiusMeters}m radius`,
          severity: "LOW",
          url: null
        });
      }
    }

    // Process vacancy exposure (vacant buildings within 500m)
    if (vacancyExposure.status === "fulfilled" && vacancyExposure.value) {
      const { count, nearestDistanceMeters, radiusMeters } = vacancyExposure.value;

      if (count > 0) {
        let severity = "LOW";
        let label = "Some vacant properties in area";

        if (nearestDistanceMeters < 100) {
          severity = "HIGH";
          label = "Vacant property adjacent to address";
        } else if (count >= 5 || nearestDistanceMeters < 200) {
          severity = "MEDIUM";
          label = "Multiple vacant properties nearby";
        }

        const distanceText = nearestDistanceMeters
          ? `Nearest: ${nearestDistanceMeters}m away`
          : "";

        signals.push({
          source: "StoneBridge GIS (PostGIS)",
          category: "PROPERTY_DISTRESS",
          label,
          value: `${count} vacant properties within ${radiusMeters}m. ${distanceText}`,
          severity,
          url: null
        });
      }
    }

    // Process flood zone check
    if (floodZone.status === "fulfilled" && floodZone.value) {
      const { inFloodZone, floodZoneType } = floodZone.value;

      if (inFloodZone) {
        signals.push({
          source: "StoneBridge GIS (PostGIS)",
          category: "INFRASTRUCTURE",
          label: "Property located in flood zone",
          value: `Flood zone type: ${floodZoneType || "Unknown"}. May require flood insurance.`,
          severity: "MEDIUM",
          url: null
        });
      }
    }

    // Add GIS location confirmation signal
    signals.push({
      source: "StoneBridge GIS (PostGIS)",
      category: "INFRASTRUCTURE",
      label: "GIS coordinates verified",
      value: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
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
