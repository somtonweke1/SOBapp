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
async function generateMemo(deal, signals) {
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

  doc.fontSize(22).text("StoneBridge AI — Deal Risk Memo");
  doc.moveDown(0.4);
  doc.fontSize(12).text(`Address: ${safeAddress}, ${city}, ${state}`);
  doc.text(`Intake timestamp: ${deal.createdAt.toISOString()}`);
  doc.text(`Risk score before: ${deal.riskScoreBefore}`);
  doc.text(`Flag count before: ${deal.flagCountBefore}`);
  doc.text(`Verdict: ${deal.verdict || "PENDING"}`);
  doc.moveDown();
  doc.fontSize(14).text("Reasoning", { underline: true });
  doc.fontSize(11);
  doc.text(`StoneBridge reviewed public data signals across property distress, liens, ownership, procurement, utility, and infrastructure exposure. The resulting call is ${deal.verdict}.`);
  doc.moveDown();
  doc.fontSize(14).text("Signal Table", { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(10);
  normalizedSignals.forEach(signal => {
    doc.text(`${signal.source} | ${signal.category} | ${signal.severity}`);
    doc.text(`${signal.label} — ${signal.value}`);
    if (signal.url) doc.text(`Evidence: ${signal.url}`, { link: signal.url, underline: true });
    doc.moveDown(0.5);
  });
  doc.moveDown();
  doc.fontSize(14).text("Next Diligence Steps", { underline: true });
  doc.fontSize(11);
  nextStepsForSignals(normalizedSignals).forEach((step, index) => doc.text(`${index + 1}. ${step}`));
    doc.moveDown();
    doc.text(`StoneBridge attribution: StoneBridge AI delivered this memo at ${new Date().toISOString()}.`);

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
