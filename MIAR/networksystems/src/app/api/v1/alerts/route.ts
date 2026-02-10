/**
 * Real-Time Constraint Alerts API
 * GET /api/v1/alerts - Get active alerts and pending decisions
 * POST /api/v1/alerts/check - Manually trigger constraint check
 */

import { NextResponse } from 'next/server';
import { constraintMonitor } from '@/services/constraint-monitor';
import { decisionEngine } from '@/services/decision-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    if (type === 'monitoring_status') {
      // Get monitoring source status
      const status = constraintMonitor.getMonitoringStatus();
      return NextResponse.json({
        success: true,
        data: status
      });
    }

    if (type === 'decisions') {
      // Get pending decisions only
      const pendingDecisions = decisionEngine.getPendingDecisions();
      return NextResponse.json({
        success: true,
        data: {
          pending: pendingDecisions,
          count: pendingDecisions.length
        }
      });
    }

    if (type === 'history') {
      // Get decision history
      const days = parseInt(searchParams.get('days') || '30');
      const history = decisionEngine.getDecisionHistory(days);
      return NextResponse.json({
        success: true,
        data: {
          history,
          count: history.length,
          days
        }
      });
    }

    // Default: Get active alerts and pending decisions
    const activeAlerts = constraintMonitor.getActiveAlerts();
    const pendingDecisions = decisionEngine.getPendingDecisions();
    const changeHistory = constraintMonitor.getChangeHistory(24);

    return NextResponse.json({
      success: true,
      data: {
        activeAlerts: {
          items: activeAlerts,
          count: activeAlerts.length,
          breakdown: {
            critical: activeAlerts.filter(a => a.severity === 'critical').length,
            high: activeAlerts.filter(a => a.severity === 'high').length,
            medium: activeAlerts.filter(a => a.severity === 'medium').length,
            low: activeAlerts.filter(a => a.severity === 'low').length
          }
        },
        pendingDecisions: {
          items: pendingDecisions,
          count: pendingDecisions.length,
          urgentCount: pendingDecisions.filter(d => d.urgency === 'immediate' || d.urgency === 'urgent').length
        },
        recentChanges: {
          items: changeHistory.slice(0, 10),
          count: changeHistory.length
        },
        summary: {
          totalAlerts: activeAlerts.length,
          totalExposure: activeAlerts.reduce((sum, a) => sum + a.estimatedImpact.financial, 0),
          decisionsRequired: pendingDecisions.length,
          immediateActions: pendingDecisions.filter(d => d.urgency === 'immediate').length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'check';

    if (action === 'check') {
      // Manually trigger constraint check
      const events = await constraintMonitor.checkForChanges();

      // Generate decision frames for critical events
      const decisionFrames = await Promise.all(
        events
          .filter(e => e.requiresAction)
          .map(e => decisionEngine.generateDecisionFrame(e))
      );

      return NextResponse.json({
        success: true,
        data: {
          events,
          decisionsGenerated: decisionFrames.length,
          decisions: decisionFrames
        },
        message: `Found ${events.length} constraint changes, generated ${decisionFrames.length} decision frames`
      });
    }

    if (action === 'approve') {
      // Approve a decision
      const { decisionId, optionId, approvedBy } = body;

      if (!decisionId || !optionId || !approvedBy) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields: decisionId, optionId, approvedBy'
          },
          { status: 400 }
        );
      }

      const approved = await decisionEngine.approveDecision(decisionId, optionId, approvedBy);

      return NextResponse.json({
        success: approved,
        message: approved
          ? `Decision ${decisionId} approved successfully`
          : `Decision ${decisionId} could not be approved (may be expired or already processed)`
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Unknown action: ${action}`
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Alerts API POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request'
      },
      { status: 500 }
    );
  }
}
