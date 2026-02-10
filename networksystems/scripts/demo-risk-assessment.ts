#!/usr/bin/env tsx
/**
 * DEMO: Risk Assessment Engine
 * Shows the REAL value - actionable compliance intelligence
 */

import { getRiskScoringEngine } from '../src/services/risk-scoring-engine';
import { getInferenceEngine } from '../src/services/ownership-inference-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 RISK ASSESSMENT DEMO - The MOAT\n');
  console.log('━'.repeat(80));
  console.log('Showing what compliance teams actually PAY for');
  console.log('━'.repeat(80) + '\n');

  const riskEngine = getRiskScoringEngine();

  // Test entities with different risk profiles
  const testEntities = [
    'Huawei Technologies Co., Ltd.',
    'Tactical Missiles Corporation JSC',
    'Random Safe Company Inc.',
    'China Electronics Technology Group Corporation',
    'Gazprom PJSC'
  ];

  for (const entityName of testEntities) {
    console.log('\n' + '═'.repeat(80));
    console.log(`📋 ASSESSING: ${entityName}`);
    console.log('═'.repeat(80) + '\n');

    // Get ownership data if exists
    const ownershipData = await prisma.discoveredOwnership.findUnique({
      where: { entityName }
    });

    // Get inferred relationships
    const inferenceEngine = getInferenceEngine();
    await inferenceEngine.buildGraph();
    const enriched = inferenceEngine.getEnrichedOwnership(entityName);

    // Perform risk assessment
    const assessment = await riskEngine.assessRisk(
      entityName,
      ownershipData,
      enriched?.siblings.map(s => ({ relatedEntity: s }))
    );

    // Display results
    console.log(`🚨 OVERALL RISK: ${assessment.overallRisk.toUpperCase()}`);
    console.log(`📊 Risk Score: ${assessment.riskScore}/100\n`);

    console.log(`📝 SUMMARY:`);
    console.log(`   ${assessment.summary}\n`);

    if (assessment.riskFactors.length > 0) {
      console.log(`⚠️  RISK FACTORS (${assessment.riskFactors.length}):`);
      assessment.riskFactors.forEach((factor, i) => {
        console.log(`\n   ${i + 1}. [${factor.severity.toUpperCase()}] ${factor.category.toUpperCase()}`);
        console.log(`      ${factor.description}`);
        console.log(`      Impact: ${factor.impact}`);
        if (factor.evidence.length > 0) {
          console.log(`      Evidence: ${factor.evidence[0]}`);
        }
      });
      console.log('');
    }

    if (assessment.recommendations.length > 0) {
      console.log(`\n✅ RECOMMENDED ACTIONS (${assessment.recommendations.length}):`);
      assessment.recommendations.forEach((rec, i) => {
        console.log(`\n   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action.replace(/_/g, ' ').toUpperCase()}`);
        console.log(`      Rationale: ${rec.rationale}`);
        console.log(`      Timeline: ${rec.timeline}`);
        if (rec.legalBasis) {
          console.log(`      Legal Basis: ${rec.legalBasis}`);
        }
        console.log(`\n      STEPS TO TAKE:`);
        rec.steps.forEach((step, j) => {
          console.log(`         ${j + 1}. ${step}`);
        });
      });
    }

    console.log(`\n📄 COMPLIANCE EVIDENCE:`);
    assessment.complianceEvidence.forEach(evidence => {
      console.log(`   • Type: ${evidence.documentType}`);
      console.log(`   • Confidence: ${(evidence.confidence * 100).toFixed(0)}%`);
      console.log(`   • Verification: ${evidence.verificationMethod}`);
      console.log(`   • Sources: ${evidence.sources.join(', ')}`);
    });

    console.log(`\n⏰ Generated: ${new Date(assessment.generatedAt).toLocaleString()}`);
    console.log('\n');
  }

  console.log('━'.repeat(80));
  console.log('💰 THIS IS THE MOAT');
  console.log('━'.repeat(80));
  console.log(`
🎯 What We Built:
   ✅ Automated risk assessment (saves 2-4 hours per supplier)
   ✅ Actionable recommendations (not just data dumps)
   ✅ Legal basis citation (audit-ready)
   ✅ Compliance evidence package (documentation for regulators)
   ✅ Risk scoring (quantifiable metrics)
   ✅ Timeline guidance (operational clarity)

💵 Value Proposition for Baukunst:
   • Compliance teams: $200-500/assessment manual cost
   • Our automated system: $10-20/assessment at scale
   • Time saved: 2-4 hours → 2-4 minutes
   • Risk reduction: Catch hidden relationships others miss
   • Audit trail: Complete documentation for regulators

🚀 Competitive Moat:
   • Others provide data - We provide DECISIONS
   • Others show lists - We show ACTIONS
   • Others give scores - We give LEGAL BASIS
   • Others are databases - We are COMPLIANCE COPILOT
  `);

  process.exit(0);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
