# StoneBridge GIS Case Study Analysis

**Generated:** 2026-04-11T03:37:06.741Z

## Executive Summary

This report presents spatial risk analysis of three Baltimore properties using GIS-based diagnostic methods.

## Case Studies

### Case Study 1: 100 N Holliday St

**Description:** Downtown Baltimore - Expected low-moderate risk

#### Diagnostic Results

- **Risk Score:** 38/100
- **Verdict:** CAUTION
- **Flags:** 2
- **Coordinates:** 39.290883, -76.610712

#### Spatial Risk Analysis

- **Spatial Risk Score:** 19/100
- **Spatial Verdict:** PROCEED
- **311 Complaints (500m radius):** 8
- **Vacant Properties (500m radius):** 2
- **In Flood Zone:** No

---

### Case Study 2: 1500 W North Ave

**Description:** West Baltimore - Expected moderate-high risk

#### Diagnostic Results

- **Risk Score:** 61/100
- **Verdict:** ESCALATE
- **Flags:** 4
- **Coordinates:** 39.310222, -76.641330

#### Spatial Risk Analysis

- **Spatial Risk Score:** 70/100
- **Spatial Verdict:** ESCALATE
- **311 Complaints (500m radius):** 28
- **Vacant Properties (500m radius):** 12
- **In Flood Zone:** No

---

### Case Study 3: 3001 E Baltimore St

**Description:** East Baltimore - Expected high risk

#### Diagnostic Results

- **Risk Score:** 10/100
- **Verdict:** PROCEED
- **Flags:** 1
- **Coordinates:** 39.292116, -76.574616

#### Spatial Risk Analysis

- **Spatial Risk Score:** 44/100
- **Spatial Verdict:** CAUTION
- **311 Complaints (500m radius):** 16
- **Vacant Properties (500m radius):** 6
- **In Flood Zone:** No

---

## Methodology

1. **Geocoding:** Addresses converted to coordinates using OpenStreetMap Nominatim
2. **Buffer Analysis:** 500-meter radius analysis around each property
3. **Spatial Queries:** PostGIS used for distance and overlay calculations
4. **Risk Scoring:** Composite score based on complaint density (40%), vacancy exposure (30%), flood zone (30%)

