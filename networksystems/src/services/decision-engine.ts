/**
 * Decision Engine
 *
 * Automatically generates decision options when constraints change.
 * This is what separates SOBapp from BI tools - we don't show data, we show decisions.
 *
 * Key insight: Executives don't want dashboards. They want "Option 1, 2, or 3?"
 */

import { ConstraintChangeEvent } from './constraint-monitor';
import { ConstraintModel, MitigationAction } from './constraint-engine/types';
import { constraintModeler } from './constraint-engine/constraint-modeler';

export interface DecisionOption {
  id: string;
  rank: number;
  title: string;
  description: string;
  category: 'preventive' | 'corrective' | 'hedging' | 'do_nothing';

  // Financial impact
  upfrontCost: number;
  expectedBenefit: number;
  netValue: number;
  roi: number;
  npv: number;
  paybackPeriod: number; // months

  // Risk impact
  riskReduction: number; // 0-1
  residualRisk: number; // 0-1
  probability: number; // probability of success

  // Operational impact
  timeToImplement: number; // hours
  resourcesRequired: string[];
  prerequisites: string[];
  sideEffects: string[];

  // Decision metadata
  confidence: number; // AI confidence in this recommendation
  complexity: 'low' | 'medium' | 'high';
  reversibility: 'fully_reversible' | 'partially_reversible' | 'irreversible';

  // Integration
  nextSteps: string[];
  requiredApprovals: string[];
  systemsToUpdate: string[];
}

export interface DecisionFrame {
  id: string;
  triggeredBy: ConstraintChangeEvent;
  generatedAt: Date;
  expiresAt: Date; // Decision window closes
  urgency: 'immediate' | 'urgent' | 'important' | 'monitor';

  // Context
  situation: string;
  problem: string;
  stakes: string;

  // Options
  options: DecisionOption[];
  recommendedOption: string; // ID of recommended option

  // Supporting data
  scenarioComparisons: {
    baseline: any;
    withOption1: any;
    withOption2: any;
    withOption3: any;
  };

  // Approval
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedBy?: string;
  approvedAt?: Date;
  selectedOption?: string;
}

class DecisionEngineService {
  private pendingDecisions: Map<string, DecisionFrame> = new Map();
  private decisionHistory: DecisionFrame[] = [];

  /**
   * Generate decision options from a constraint change event
   */
  async generateDecisionFrame(event: ConstraintChangeEvent): Promise<DecisionFrame> {
    console.log(`Generating decision frame for event: ${event.id}`);

    // Determine urgency based on event severity and time constraints
    const urgency = this.determineUrgency(event);

    // Calculate decision window
    const expiresAt = new Date(Date.now() + this.getDecisionWindow(urgency));

    // Generate options based on event type
    const options = await this.generateOptions(event);

    // Rank options by NPV
    const rankedOptions = options.sort((a, b) => b.npv - a.npv);
    rankedOptions.forEach((option, index) => {
      option.rank = index + 1;
    });

    // Frame the situation in executive language
    const frame: DecisionFrame = {
      id: `decision_${Date.now()}`,
      triggeredBy: event,
      generatedAt: new Date(),
      expiresAt,
      urgency,

      situation: this.frameSituation(event),
      problem: this.frameProblem(event),
      stakes: this.frameStakes(event),

      options: rankedOptions,
      recommendedOption: rankedOptions[0]?.id || '',

      scenarioComparisons: await this.runScenarioComparisons(event, rankedOptions),

      status: 'pending'
    };

    // Store for tracking
    this.pendingDecisions.set(frame.id, frame);

    return frame;
  }

  /**
   * Determine urgency level based on event characteristics
   */
  private determineUrgency(event: ConstraintChangeEvent): 'immediate' | 'urgent' | 'important' | 'monitor' {
    // Immediate: Financial impact >$10M AND decision window <48 hours
    if (event.estimatedImpact.financial > 10000000 && event.severity === 'critical') {
      return 'immediate';
    }

    // Urgent: Financial impact >$5M OR critical severity
    if (event.estimatedImpact.financial > 5000000 || event.severity === 'critical') {
      return 'urgent';
    }

    // Important: Financial impact >$1M OR high severity
    if (event.estimatedImpact.financial > 1000000 || event.severity === 'high') {
      return 'important';
    }

    return 'monitor';
  }

  /**
   * Get decision window in milliseconds based on urgency
   */
  private getDecisionWindow(urgency: string): number {
    switch (urgency) {
      case 'immediate': return 4 * 60 * 60 * 1000; // 4 hours
      case 'urgent': return 24 * 60 * 60 * 1000; // 24 hours
      case 'important': return 72 * 60 * 60 * 1000; // 3 days
      default: return 7 * 24 * 60 * 60 * 1000; // 7 days
    }
  }

  /**
   * Frame the situation in clear executive language
   */
  private frameSituation(event: ConstraintChangeEvent): string {
    const timeframe = this.getTimeDescription(event.timestamp);
    const change = `${event.details.metric} changed ${Math.abs(event.details.percentChange).toFixed(0)}%`;

    switch (event.changeType) {
      case 'threshold_breach':
        return `${timeframe}, ${change} (from ${event.details.oldValue.toLocaleString()} to ${event.details.newValue.toLocaleString()}), exceeding our ${event.details.threshold}% monitoring threshold.`;

      case 'new_constraint':
        return `${timeframe}, a new ${event.severity} constraint was detected: ${change}.`;

      case 'cascade_trigger':
        return `${timeframe}, ${change}, triggering a cascade effect across ${event.affectedAssets.length} downstream operations.`;

      default:
        return `${timeframe}, ${change}.`;
    }
  }

  /**
   * Frame the problem and its impact
   */
  private frameProblem(event: ConstraintChangeEvent): string {
    const financial = `$${(event.estimatedImpact.financial / 1000000).toFixed(1)}M`;
    const assets = event.affectedAssets.length;

    return `This affects ${assets} critical asset${assets > 1 ? 's' : ''} with an estimated financial impact of ${financial}. ${event.estimatedImpact.operational}`;
  }

  /**
   * Frame what's at stake
   */
  private frameStakes(event: ConstraintChangeEvent): string {
    const impact = event.estimatedImpact.financial;

    if (impact > 50000000) {
      return `This is a company-defining decision. The wrong choice could impact annual earnings by 5-10%.`;
    } else if (impact > 10000000) {
      return `This decision will significantly impact quarterly performance and stakeholder confidence.`;
    } else if (impact > 5000000) {
      return `This represents material impact to operations and should be escalated to senior leadership.`;
    } else {
      return `This requires operational leadership decision to minimize exposure.`;
    }
  }

  /**
   * Generate decision options based on event type and context
   */
  private async generateOptions(event: ConstraintChangeEvent): Promise<DecisionOption[]> {
    const options: DecisionOption[] = [];

    // Generate 3-4 options based on suggested actions + do nothing
    for (let i = 0; i < Math.min(event.suggestedActions.length, 3); i++) {
      const action = event.suggestedActions[i];
      options.push(this.createOptionFromAction(action, event, i));
    }

    // Always include "do nothing" option for comparison
    options.push(this.createDoNothingOption(event));

    return options;
  }

  /**
   * Create a decision option from a suggested action
   */
  private createOptionFromAction(
    action: string,
    event: ConstraintChangeEvent,
    index: number
  ): DecisionOption {
    // Extract costs and benefits from action description
    // In production, this would use NLP or structured data
    const costMatch = action.match(/\+?\$?(\d+(?:\.\d+)?)\s*M?\s*(cost|investment)/i);
    const benefitMatch = action.match(/\+?\$?(\d+(?:\.\d+)?)\s*M?\s*(revenue|benefit|savings)/i);

    const upfrontCost = costMatch ? parseFloat(costMatch[1]) * 1000000 : event.estimatedImpact.financial * 0.15;
    const expectedBenefit = benefitMatch ? parseFloat(benefitMatch[1]) * 1000000 : event.estimatedImpact.financial * 0.85;

    const netValue = expectedBenefit - upfrontCost;
    const roi = upfrontCost > 0 ? expectedBenefit / upfrontCost : 0;
    const npv = netValue * 0.9; // Simplified NPV calculation

    return {
      id: `option_${index + 1}`,
      rank: index + 1,
      title: this.extractActionTitle(action),
      description: action,
      category: this.categorizeAction(action),

      upfrontCost,
      expectedBenefit,
      netValue,
      roi,
      npv,
      paybackPeriod: upfrontCost > 0 ? Math.round((upfrontCost / (expectedBenefit / 12))) : 0,

      riskReduction: 0.7 + (index * 0.1), // More aggressive options have higher risk reduction
      residualRisk: 0.3 - (index * 0.1),
      probability: 0.85 - (index * 0.05),

      timeToImplement: 24 + (index * 24), // Hours
      resourcesRequired: this.extractResources(action),
      prerequisites: [],
      sideEffects: [],

      confidence: 0.85,
      complexity: index === 0 ? 'low' : index === 1 ? 'medium' : 'high',
      reversibility: index === 0 ? 'fully_reversible' : 'partially_reversible',

      nextSteps: this.generateNextSteps(action),
      requiredApprovals: this.determineRequiredApprovals(upfrontCost, event.severity),
      systemsToUpdate: ['ERP', 'Supply Chain Management', 'Financial Planning']
    };
  }

  /**
   * Create the "do nothing" baseline option
   */
  private createDoNothingOption(event: ConstraintChangeEvent): DecisionOption {
    return {
      id: 'option_do_nothing',
      rank: 99,
      title: 'Do Nothing (Absorb Impact)',
      description: 'Accept the constraint and absorb the financial impact without mitigation',
      category: 'do_nothing',

      upfrontCost: 0,
      expectedBenefit: 0,
      netValue: -event.estimatedImpact.financial,
      roi: 0,
      npv: -event.estimatedImpact.financial,
      paybackPeriod: Infinity,

      riskReduction: 0,
      residualRisk: 1.0,
      probability: 1.0,

      timeToImplement: 0,
      resourcesRequired: [],
      prerequisites: [],
      sideEffects: ['Full exposure to constraint impact', 'Potential cascade effects'],

      confidence: 1.0,
      complexity: 'low',
      reversibility: 'fully_reversible',

      nextSteps: ['Monitor situation', 'Prepare contingency plans'],
      requiredApprovals: [],
      systemsToUpdate: []
    };
  }

  /**
   * Extract action title from description
   */
  private extractActionTitle(action: string): string {
    // Take first clause or up to 60 characters
    const firstSentence = action.split(/[,;]|(?:\s+and\s+)/i)[0];
    return firstSentence.length > 60 ? firstSentence.substring(0, 57) + '...' : firstSentence;
  }

  /**
   * Categorize action type
   */
  private categorizeAction(action: string): 'preventive' | 'corrective' | 'hedging' | 'do_nothing' {
    const lower = action.toLowerCase();
    if (lower.includes('hedge') || lower.includes('futures') || lower.includes('insurance')) {
      return 'hedging';
    } else if (lower.includes('prevent') || lower.includes('build reserve') || lower.includes('diversify')) {
      return 'preventive';
    } else {
      return 'corrective';
    }
  }

  /**
   * Extract required resources from action description
   */
  private extractResources(action: string): string[] {
    const resources: string[] = [];

    if (action.toLowerCase().includes('crew') || action.toLowerCase().includes('team')) {
      resources.push('Operations Team');
    }
    if (action.toLowerCase().includes('contract') || action.toLowerCase().includes('negotiate')) {
      resources.push('Procurement Team', 'Legal Team');
    }
    if (action.toLowerCase().includes('futures') || action.toLowerCase().includes('financial')) {
      resources.push('Trading Desk', 'Risk Management');
    }

    return resources.length > 0 ? resources : ['Operations Team'];
  }

  /**
   * Generate implementation next steps
   */
  private generateNextSteps(action: string): string[] {
    return [
      'Obtain executive approval',
      'Assemble implementation team',
      'Initiate action within 24 hours',
      'Monitor results and adjust as needed',
      'Document outcomes for learning'
    ];
  }

  /**
   * Determine required approvals based on cost and severity
   */
  private determineRequiredApprovals(cost: number, severity: string): string[] {
    const approvals: string[] = [];

    if (severity === 'critical') {
      approvals.push('CEO');
    }

    if (cost > 5000000) {
      approvals.push('CFO', 'Board');
    } else if (cost > 1000000) {
      approvals.push('CFO');
    } else if (cost > 100000) {
      approvals.push('VP Operations');
    }

    return approvals.length > 0 ? approvals : ['Operations Manager'];
  }

  /**
   * Run scenario comparisons for each option
   */
  private async runScenarioComparisons(
    event: ConstraintChangeEvent,
    options: DecisionOption[]
  ): Promise<any> {
    // In production, this would call the actual SC-GEP solver
    // For now, return structured comparison data
    return {
      baseline: {
        financialImpact: event.estimatedImpact.financial,
        operationalImpact: event.estimatedImpact.operational,
        riskScore: 8.5
      },
      withOption1: options[0] ? {
        financialImpact: event.estimatedImpact.financial - options[0].expectedBenefit + options[0].upfrontCost,
        operationalImpact: 'Minimal disruption, 24-hour implementation',
        riskScore: 2.8
      } : null,
      withOption2: options[1] ? {
        financialImpact: event.estimatedImpact.financial - options[1].expectedBenefit + options[1].upfrontCost,
        operationalImpact: 'Moderate complexity, 48-hour implementation',
        riskScore: 3.5
      } : null,
      withOption3: options[2] ? {
        financialImpact: event.estimatedImpact.financial - options[2].expectedBenefit + options[2].upfrontCost,
        operationalImpact: 'High complexity, 72-hour implementation',
        riskScore: 4.2
      } : null
    };
  }

  /**
   * Get time description for executive communication
   */
  private getTimeDescription(timestamp: Date): string {
    const hoursSince = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursSince < 1) {
      return `Just now (${Math.round(hoursSince * 60)} minutes ago)`;
    } else if (hoursSince < 24) {
      return `${Math.round(hoursSince)} hour${Math.round(hoursSince) > 1 ? 's' : ''} ago`;
    } else {
      return `${Math.round(hoursSince / 24)} day${Math.round(hoursSince / 24) > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Approve a decision option
   */
  async approveDecision(decisionId: string, optionId: string, approvedBy: string): Promise<boolean> {
    const decision = this.pendingDecisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    if (decision.status !== 'pending') {
      throw new Error(`Decision ${decisionId} already ${decision.status}`);
    }

    // Check if expired
    if (new Date() > decision.expiresAt) {
      decision.status = 'expired';
      return false;
    }

    // Approve
    decision.status = 'approved';
    decision.approvedBy = approvedBy;
    decision.approvedAt = new Date();
    decision.selectedOption = optionId;

    // Move to history
    this.decisionHistory.push(decision);
    this.pendingDecisions.delete(decisionId);

    console.log(`Decision ${decisionId} approved: ${optionId} by ${approvedBy}`);

    return true;
  }

  /**
   * Get all pending decisions
   */
  getPendingDecisions(): DecisionFrame[] {
    return Array.from(this.pendingDecisions.values())
      .filter(d => d.status === 'pending' && new Date() < d.expiresAt)
      .sort((a, b) => {
        // Sort by urgency, then by financial impact
        const urgencyOrder = { immediate: 0, urgent: 1, important: 2, monitor: 3 };
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return b.triggeredBy.estimatedImpact.financial - a.triggeredBy.estimatedImpact.financial;
      });
  }

  /**
   * Get decision history
   */
  getDecisionHistory(days: number = 30): DecisionFrame[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.decisionHistory
      .filter(d => d.generatedAt >= cutoff)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }
}

// Singleton instance
export const decisionEngine = new DecisionEngineService();

export default decisionEngine;
