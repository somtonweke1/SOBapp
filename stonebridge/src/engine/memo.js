const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const { prisma } = require("../lib/prisma");

/** Maps signal categories to diligence actions referenced in the generated PDF memo. */
function nextStepsForSignals(signals) {
  const categories = [...new Set(signals.map(signal => signal.category))];
  const steps = [];
  if (categories.includes("LIEN") || categories.includes("TITLE")) steps.push("Order updated title and lien search before capital is committed.");
  if (categories.includes("UTILITY")) steps.push("Validate utility restoration status and open 311/service issues before closing.");
  if (categories.includes("PROCUREMENT")) steps.push("Cross-check contractor and vendor exposure against procurement integrity records.");
  if (categories.includes("OWNERSHIP")) steps.push("Resolve beneficial ownership and recent transfer history before signature.");
  if (categories.includes("INFRASTRUCTURE")) steps.push("Stress-test rehab scope against infrastructure and water risk near the parcel.");
  if (categories.includes("PROPERTY_DISTRESS")) steps.push("Re-underwrite capex, vacancy, and code compliance assumptions.");
  return steps.length ? steps : ["Proceed with standard diligence and lender package review."];
}

/** Writes a PDF memo for the deal, persists its hash and path on the deal row, and records a timeline event. */
async function generateMemo(deal, signals, spatialRisk = null) {
  try {
    const normalizedSignals = Array.isArray(signals) ? signals : [];
    const memoDir = path.join(process.cwd(), "memos");

    try {
      await fs.promises.mkdir(memoDir, { recursive: true });
    } catch (error) {
      console.error("[memo] Failed to create memo directory:", error);
      throw new Error(`Memo directory creation failed: ${error.message}`);
    }

    const filePath = path.join(memoDir, `${deal.id}.pdf`);
    const doc = new PDFDocument({ margin: 48 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

  const safeAddress = String(deal.address || "").replace(/\s+/g, " ").trim();
  const city = String(deal.city || "Baltimore").trim();
  const state = String(deal.state || "MD").trim();

  // ============================================================================
  // HEADER
  // ============================================================================
  doc.fontSize(22).text("StoneBridge AI — Risk Exposure Diagnosis");
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#666666').text(`Decision Memo — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  doc.fillColor('#000000');
  doc.moveDown(0.8);

  // ============================================================================
  // PROPERTY OVERVIEW
  // ============================================================================
  doc.fontSize(14).fillColor('#333333').text("Property Overview", { underline: true });
  doc.fillColor('#000000').moveDown(0.3);
  doc.fontSize(11);
  doc.text(`Address: ${safeAddress}, ${city}, ${state}`);
  if (deal.latitude && deal.longitude) {
    doc.text(`Coordinates: ${deal.latitude.toFixed(6)}, ${deal.longitude.toFixed(6)}`);
  }
  doc.text(`Analysis Date: ${deal.createdAt.toLocaleDateString('en-US')}`);
  doc.moveDown();

  // ============================================================================
  // EXECUTIVE SUMMARY
  // ============================================================================
  doc.fontSize(14).fillColor('#333333').text("Executive Summary", { underline: true });
  doc.fillColor('#000000').moveDown(0.3);
  doc.fontSize(11);

  const riskFactors = [];
  if (deal.riskScoreBefore >= 50) riskFactors.push("elevated property-level signals");
  if (spatialRisk?.spatialRiskScore >= 50) riskFactors.push("concentrated neighborhood distress");
  if (normalizedSignals.some(s => s.category === "LIEN")) riskFactors.push("active lien exposure");
  if (spatialRisk?.indicators?.floodZone?.inFloodZone) riskFactors.push("flood zone location");

  const summaryText = riskFactors.length > 0
    ? `This analysis identifies ${riskFactors.length} material risk factor${riskFactors.length > 1 ? 's' : ''}: ${riskFactors.join(', ')}. `
    : `Initial screening shows manageable exposure across property and spatial dimensions. `;

  doc.text(summaryText + `The verdict is ${deal.verdict || "PENDING"}. Key findings include ${deal.flagCountBefore || 0} documented signals across property distress, liens, ownership, procurement, utility, and infrastructure dimensions. ` +
    (spatialRisk ? `Spatial analysis indicates a ${spatialRisk.spatialVerdict} risk profile based on ${spatialRisk.indicators?.complaints?.count || 0} nearby 311 complaints and ${spatialRisk.indicators?.vacancy?.count || 0} vacancy notices within a ${spatialRisk.indicators?.complaints?.radiusMeters || 500}m radius.` : ''));
  doc.moveDown();

  // ============================================================================
  // METHODOLOGY
  // ============================================================================
  doc.fontSize(14).fillColor('#333333').text("Methodology", { underline: true });
  doc.fillColor('#000000').moveDown(0.3);
  doc.fontSize(11);
  doc.text("This risk diagnosis integrates multi-source public records analysis with geospatial intelligence to assess property-level and neighborhood-level exposure.");
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor('#444444').text("Property-Level Analysis:", { underline: true });
  doc.fillColor('#000000');
  doc.text("Baltimore City public records across real property tax, lien registry, 311 service requests, procurement debarment, and code violation databases were queried for signals tied to the subject parcel and associated entities.", { indent: 20 });
  doc.moveDown(0.5);

  if (spatialRisk) {
    doc.fontSize(10).fillColor('#444444').text("Spatial Risk Analysis:", { underline: true });
    doc.fillColor('#000000');
    const radius = spatialRisk.indicators?.complaints?.radiusMeters || 500;
    doc.text(`PostGIS-based spatial queries executed on Baltimore Open Data layers within a ${radius}m radius (dynamically adjusted for parcel density targeting 15-25 parcels). Percentile rankings derived from Baltimore City parcel analysis 2020-2024 covering ~40,000 residential parcels. Weighted scoring combines 311 complaint density (${Math.round((spatialRisk.weights?.complaints || 0.35) * 100)}%), vacancy exposure (${Math.round((spatialRisk.weights?.vacancy || 0.3) * 100)}%), proximity to distress (${Math.round((spatialRisk.weights?.proximity || 0.2) * 100)}%), and flood zone classification (${Math.round((spatialRisk.weights?.floodZone || 0.15) * 100)}%).`, { indent: 20 });
    doc.moveDown(0.5);
  }

  doc.fontSize(10).fillColor('#444444').text("Temporal Weighting:", { underline: true });
  doc.fillColor('#000000');
  doc.text("Recency weights applied: recent complaints (≤30 days: 1.3x, ≤90 days: 1.15x) and vacancy notices (active: 1.15x) receive elevated scores to surface emerging deterioration patterns.", { indent: 20 });
  doc.moveDown();

  // ============================================================================
  // MULTI-FACTOR SPATIAL CORRELATION ANALYSIS
  // ============================================================================
  if (spatialRisk && spatialRisk.indicators) {
    doc.fontSize(14).fillColor('#333333').text("Multi-Factor Spatial Analysis", { underline: true });
    doc.fillColor('#000000').moveDown(0.3);
    doc.fontSize(11);

    const complaints = spatialRisk.indicators.complaints || {};
    const vacancy = spatialRisk.indicators.vacancy || {};

    // Complaint Analysis
    if (complaints.count !== undefined) {
      const complaintPercentile = complaints.percentile || 0;
      const complaintBand = complaints.bandLabel || "within Baltimore baseline";
      doc.fontSize(10).fillColor('#444444').text("311 Complaint Density:", { underline: true });
      doc.fillColor('#000000');
      doc.text(`${complaints.count} complaints detected (weighted count: ${complaints.weightedCount?.toFixed(1) || 0}) at a density of ${complaints.density?.toFixed(1) || 0} per km². This places the neighborhood at the ${complaintPercentile}th percentile—${complaintBand}. ` +
        (complaintPercentile >= 65
          ? "Elevated complaint activity suggests operational friction including infrastructure stress, code compliance issues, or service delivery gaps that may increase holding costs."
          : complaintPercentile >= 40
          ? "Complaint density is typical for Baltimore residential areas, indicating moderate neighborhood maintenance demands."
          : "Below-average complaint activity indicates a relatively stable service environment."), { indent: 20 });
      doc.moveDown(0.5);
    }

    // Vacancy Analysis
    if (vacancy.count !== undefined) {
      const vacancyPercentile = vacancy.percentile || 0;
      const vacancyBand = vacancy.bandLabel || "within Baltimore baseline";
      const nearestDist = vacancy.nearestDistanceMeters;
      doc.fontSize(10).fillColor('#444444').text("Vacancy Exposure:", { underline: true });
      doc.fillColor('#000000');
      doc.text(`${vacancy.count} vacancy notice${vacancy.count === 1 ? '' : 's'} (weighted count: ${vacancy.weightedCount?.toFixed(1) || 0}) identified within ${vacancy.radiusMeters || 500}m. ` +
        (nearestDist !== null && nearestDist !== undefined
          ? `Nearest vacancy: ${Math.round(nearestDist)}m. `
          : "No immediate vacancy proximity. ") +
        `Vacancy density ranks at the ${vacancyPercentile}th percentile—${vacancyBand}. ` +
        (vacancyPercentile >= 65
          ? "Concentrated vacancy signals structural neighborhood distress and may correlate with reduced property values, longer marketing times, and elevated vandalism risk."
          : vacancyPercentile >= 40
          ? "Vacancy exposure is consistent with Baltimore City median, reflecting moderate neighborhood turnover."
          : "Below-average vacancy suggests stronger neighborhood cohesion and reduced abandonment pressure."), { indent: 20 });
      doc.moveDown(0.5);
    }

    // Environmental Context
    const flood = spatialRisk.indicators.floodZone || {};
    const zoning = spatialRisk.indicators.zoning || {};

    if (flood.inFloodZone || zoning.zoningCode) {
      doc.fontSize(10).fillColor('#444444').text("Environmental & Regulatory Context:", { underline: true });
      doc.fillColor('#000000');
      const envFactors = [];
      if (flood.inFloodZone) {
        envFactors.push(`Flood Zone: ${flood.zoneType || 'Unknown'} (${flood.zoneType === 'AE' ? 'high-risk special flood hazard area requiring insurance' : 'moderate-to-low risk'})`);
      }
      if (zoning.zoningCode) {
        envFactors.push(`Zoning: ${zoning.zoningCode} - ${zoning.zoningDescription || zoning.zoneClass || 'classification unavailable'}`);
      }
      doc.text(envFactors.join(". ") + ".", { indent: 20 });
      doc.moveDown();
    }
  }

  // ============================================================================
  // SIGNAL EVIDENCE TABLE
  // ============================================================================
  doc.fontSize(14).fillColor('#333333').text("Signal Evidence Table", { underline: true });
  doc.fillColor('#000000').moveDown(0.4);
  doc.fontSize(10);

  if (normalizedSignals.length === 0) {
    doc.text("No property-level signals detected in public records.", { indent: 20 });
  } else {
    normalizedSignals.forEach((signal, index) => {
      doc.text(`${index + 1}. ${signal.source} | ${signal.category} | ${signal.severity}`, { indent: 20 });
      doc.text(`   ${signal.label} — ${signal.value}`, { indent: 20 });
      if (signal.url) doc.fillColor('#0066CC').text(`   Evidence: ${signal.url}`, { link: signal.url, underline: true, indent: 20 }).fillColor('#000000');
      doc.moveDown(0.5);
    });
  }
  doc.moveDown();

  // ============================================================================
  // LIMITATIONS & ASSUMPTIONS
  // ============================================================================
  doc.fontSize(14).fillColor('#333333').text("Limitations & Assumptions", { underline: true });
  doc.fillColor('#000000').moveDown(0.3);
  doc.fontSize(10);
  doc.text("• This analysis relies on publicly available datasets and does not capture private code violations, unreported distress, or off-record ownership arrangements.");
  doc.text("• Spatial risk scores are correlation-based and do not establish causation between neighborhood conditions and property performance.");
  doc.text("• Percentile rankings assume stationary Baltimore housing stock conditions; recalibration required as market dynamics shift.");
  doc.text("• 311 complaint data may reflect reporting bias—high-income neighborhoods may report more aggressively, while underserved areas may underreport.");
  doc.text("• Flood zone classifications are based on FEMA data and do not account for localized drainage improvements or climate change projections.");
  doc.moveDown();

  // ============================================================================
  // NEXT DILIGENCE STEPS
  // ============================================================================
  doc.fontSize(14).fillColor('#333333').text("Next Diligence Steps", { underline: true });
  doc.fillColor('#000000').moveDown(0.3);
  doc.fontSize(11);
  nextStepsForSignals(normalizedSignals).forEach((step, index) => doc.text(`${index + 1}. ${step}`));
  doc.moveDown();

  // ============================================================================
  // DATA SOURCES
  // ============================================================================
  doc.fontSize(14).fillColor('#333333').text("Data Sources", { underline: true });
  doc.fillColor('#000000').moveDown(0.3);
  doc.fontSize(9);
  doc.text("• Baltimore City 311 Customer Service Requests (Open Baltimore)");
  doc.text("• Baltimore City Vacant Building Notices (Housing & Community Development)");
  doc.text("• Baltimore City Real Property Tax Database (SDAT)");
  doc.text("• Baltimore City Lien Registry (Department of Finance)");
  doc.text("• FEMA National Flood Hazard Layer");
  doc.text("• Baltimore City Zoning Map (Planning Department)");
  doc.text("• Maryland Procurement Debarment List");
  doc.moveDown();

  // ============================================================================
  // ATTRIBUTION
  // ============================================================================
  doc.fontSize(8).fillColor('#666666');
  doc.text(`StoneBridge AI — Risk Exposure Diagnosis delivered ${new Date().toISOString()}`, { align: 'center' });
  doc.text(`Analysis powered by PostGIS spatial intelligence and Baltimore Open Data integration`, { align: 'center' });
  doc.fillColor('#000000');

    try {
      await new Promise((resolve, reject) => {
        stream.once("finish", resolve);
        stream.once("error", reject);
        doc.once("error", reject);
        doc.end();
      });
    } catch (error) {
      console.error("[memo] PDF generation stream error:", error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }

    let memoContent;
    try {
      memoContent = await fs.promises.readFile(filePath);
    } catch (error) {
      console.error("[memo] Failed to read generated PDF:", error);
      throw new Error(`PDF read failed: ${error.message}`);
    }

    const hash = crypto.createHash("sha256").update(memoContent).digest("hex");

    try {
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          memoPath: filePath,
          memoHash: hash,
          memoDeliveredAt: new Date(),
          status: "MEMO_DELIVERED"
        }
      });
    } catch (error) {
      console.error("[memo] Failed to update deal with memo path:", error);
      throw new Error(`Database update failed: ${error.message}`);
    }

    try {
      await prisma.timelineEvent.create({
        data: {
          dealId: deal.id,
          event: "MEMO_DELIVERED",
          detail: "StoneBridge AI — Deal Risk Memo",
          hash
        }
      });
    } catch (error) {
      console.error("[memo] Failed to create timeline event:", error);
      // Non-fatal - memo already created, just log the error
    }

    return { filePath, hash };
  } catch (error) {
    console.error("[memo] Memo generation failed:", error);
    throw error;
  }
}

module.exports = { generateMemo };
