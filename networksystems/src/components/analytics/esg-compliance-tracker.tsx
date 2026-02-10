'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Leaf, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Download,
  Eye,
  Filter,
  Calendar,
  MapPin,
  Award,
  AlertCircle
} from 'lucide-react';
import { marketIntelligence, ESGCompliance } from '@/services/real-time-market-intelligence';

interface ESGMetrics {
  overallScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  lastAssessment: Date;
  trend: 'improving' | 'stable' | 'deteriorating';
  certificationStatus: 'certified' | 'pending' | 'non_compliant';
  criticalIssues: number;
  improvementAreas: string[];
}

interface ComplianceReport {
  id: string;
  region: string;
  material: string;
  metrics: ESGMetrics;
  assessments: Array<{
    date: Date;
    type: 'audit' | 'self_assessment' | 'third_party';
    score: number;
    findings: string[];
    status: 'passed' | 'failed' | 'conditional';
  }>;
  actionPlan: Array<{
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    dueDate: Date;
    responsible: string;
  }>;
}

const ESGComplianceTracker: React.FC = () => {
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | '1y' | 'all'>('90d');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'action_plan'>('overview');

  useEffect(() => {
    fetchESGData();
  }, [selectedTimeframe]);

  const fetchESGData = async () => {
    setIsLoading(true);
    
    try {
      const esgData = await marketIntelligence.getESGCompliance(selectedRegion === 'all' ? undefined : selectedRegion);
      
      // Transform into detailed compliance reports
      const reports: ComplianceReport[] = esgData.map((esg, idx) => ({
        id: `${esg.region}-${esg.material}`,
        region: esg.region,
        material: esg.material,
        metrics: {
          overallScore: calculateOverallScore(esg),
          environmentalScore: calculateEnvironmentalScore(esg),
          socialScore: calculateSocialScore(esg),
          governanceScore: calculateGovernanceScore(esg),
          lastAssessment: esg.lastAudit,
          trend: determineTrend(esg),
          certificationStatus: esg.certificationStatus,
          criticalIssues: countCriticalIssues(esg),
          improvementAreas: generateImprovementAreas(esg)
        },
        assessments: generateAssessments(esg),
        actionPlan: generateActionPlan(esg)
      }));
      
      setComplianceReports(reports);
      
    } catch (error) {
      console.error('Failed to fetch ESG data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverallScore = (esg: ESGCompliance): number => {
    const weights = {
      childLaborRisk: 0.3,
      environmentalImpact: 0.3,
      communityImpact: 0.2,
      certificationStatus: 0.2
    };
    
    const scores = {
      childLaborRisk: esg.childLaborRisk === 'low' ? 90 : esg.childLaborRisk === 'medium' ? 60 : 30,
      environmentalImpact: esg.environmentalImpact === 'low' ? 90 : esg.environmentalImpact === 'medium' ? 60 : 30,
      communityImpact: esg.communityImpact === 'positive' ? 90 : esg.communityImpact === 'neutral' ? 60 : 30,
      certificationStatus: esg.certificationStatus === 'certified' ? 90 : esg.certificationStatus === 'pending' ? 60 : 30
    };
    
    return Math.round(
      scores.childLaborRisk * weights.childLaborRisk +
      scores.environmentalImpact * weights.environmentalImpact +
      scores.communityImpact * weights.communityImpact +
      scores.certificationStatus * weights.certificationStatus
    );
  };

  const calculateEnvironmentalScore = (esg: ESGCompliance): number => {
    return esg.environmentalImpact === 'low' ? 90 : esg.environmentalImpact === 'medium' ? 60 : 30;
  };

  const calculateSocialScore = (esg: ESGCompliance): number => {
    const childLaborScore = esg.childLaborRisk === 'low' ? 90 : esg.childLaborRisk === 'medium' ? 60 : 30;
    const communityScore = esg.communityImpact === 'positive' ? 90 : esg.communityImpact === 'neutral' ? 60 : 30;
    return Math.round((childLaborScore + communityScore) / 2);
  };

  const calculateGovernanceScore = (esg: ESGCompliance): number => {
    return esg.certificationStatus === 'certified' ? 90 : esg.certificationStatus === 'pending' ? 60 : 30;
  };

  const determineTrend = (esg: ESGCompliance): 'improving' | 'stable' | 'deteriorating' => {
    // Simulate trend based on current status
    if (esg.certificationStatus === 'certified' && esg.childLaborRisk === 'low') return 'improving';
    if (esg.certificationStatus === 'non_compliant' || esg.childLaborRisk === 'high') return 'deteriorating';
    return 'stable';
  };

  const countCriticalIssues = (esg: ESGCompliance): number => {
    let issues = 0;
    if (esg.childLaborRisk === 'high') issues++;
    if (esg.environmentalImpact === 'high') issues++;
    if (esg.communityImpact === 'negative') issues++;
    if (esg.certificationStatus === 'non_compliant') issues++;
    return issues;
  };

  const generateImprovementAreas = (esg: ESGCompliance): string[] => {
    const areas: string[] = [];
    
    if (esg.childLaborRisk === 'high' || esg.childLaborRisk === 'medium') {
      areas.push('Child Labor Prevention');
    }
    
    if (esg.environmentalImpact === 'high' || esg.environmentalImpact === 'medium') {
      areas.push('Environmental Management');
    }
    
    if (esg.communityImpact === 'negative' || esg.communityImpact === 'neutral') {
      areas.push('Community Engagement');
    }
    
    if (esg.certificationStatus !== 'certified') {
      areas.push('Certification Compliance');
    }
    
    return areas.length > 0 ? areas : ['Maintain Current Standards'];
  };

  const generateAssessments = (esg: ESGCompliance): Array<{
    date: Date;
    type: 'audit' | 'self_assessment' | 'third_party';
    score: number;
    findings: string[];
    status: 'passed' | 'failed' | 'conditional';
  }> => {
    const assessments: Array<{
      date: Date;
      type: 'audit' | 'self_assessment' | 'third_party';
      score: number;
      findings: string[];
      status: 'passed' | 'failed' | 'conditional';
    }> = [
      {
        date: esg.lastAudit,
        type: 'audit',
        score: calculateOverallScore(esg),
        findings: generateFindings(esg),
        status: esg.certificationStatus === 'certified' ? 'passed' : 'conditional'
      }
    ];
    
    // Add historical assessments
    for (let i = 1; i <= 3; i++) {
      const historicalDate = new Date(esg.lastAudit);
      historicalDate.setMonth(historicalDate.getMonth() - (i * 6));
      
      const assessmentType = i === 1 ? 'third_party' : 'self_assessment';
      assessments.push({
        date: historicalDate,
        type: assessmentType,
        score: Math.max(30, calculateOverallScore(esg) - (i * 5) + Math.random() * 10),
        findings: generateFindings(esg),
        status: 'passed'
      });
    }
    
    return assessments.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const generateFindings = (esg: ESGCompliance): string[] => {
    const findings: string[] = [];
    
    if (esg.childLaborRisk === 'high') {
      findings.push('Critical child labor risks identified');
    }
    
    if (esg.environmentalImpact === 'high') {
      findings.push('Significant environmental impact concerns');
    }
    
    if (esg.communityImpact === 'negative') {
      findings.push('Negative community impact reported');
    }
    
    if (findings.length === 0) {
      findings.push('No critical findings');
    }
    
    return findings;
  };

  const generateActionPlan = (esg: ESGCompliance) => {
    const actions = [];
    
    if (esg.childLaborRisk === 'high') {
      actions.push({
        id: 'child_labor_prevention',
        title: 'Implement Child Labor Prevention Program',
        priority: 'critical' as const,
        status: 'pending' as const,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        responsible: 'Social Compliance Team'
      });
    }
    
    if (esg.environmentalImpact === 'high') {
      actions.push({
        id: 'environmental_management',
        title: 'Enhance Environmental Management System',
        priority: 'high' as const,
        status: 'in_progress' as const,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        responsible: 'Environmental Team'
      });
    }
    
    if (esg.communityImpact === 'negative') {
      actions.push({
        id: 'community_engagement',
        title: 'Strengthen Community Engagement Program',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        responsible: 'Community Relations Team'
      });
    }
    
    if (esg.certificationStatus !== 'certified') {
      actions.push({
        id: 'certification_compliance',
        title: 'Achieve Certification Compliance',
        priority: 'medium' as const,
        status: 'in_progress' as const,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        responsible: 'Compliance Team'
      });
    }
    
    return actions;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50 border-green-200';
      case 'conditional': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'failed': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'high': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  const filteredReports = complianceReports.filter(report => {
    if (selectedRegion !== 'all' && report.region !== selectedRegion) return false;
    if (selectedMaterial !== 'all' && report.material !== selectedMaterial) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight flex items-center">
                <Shield className="h-6 w-6 mr-3 text-green-600" />
                ESG Compliance Tracker
              </h2>
              <p className="text-sm text-zinc-500 mt-2 font-light">
                Monitor environmental, social, and governance compliance across African mining operations
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-zinc-200 rounded-lg bg-white/60 backdrop-blur-sm text-sm font-light"
              >
                <option value="all">All Regions</option>
                <option value="drc">Democratic Republic of Congo</option>
                <option value="south_africa">South Africa</option>
                <option value="zambia">Zambia</option>
                <option value="ghana">Ghana</option>
                <option value="nigeria">Nigeria</option>
                <option value="kenya">Kenya</option>
              </select>
              
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="px-4 py-2 border border-zinc-200 rounded-lg bg-white/60 backdrop-blur-sm text-sm font-light"
              >
                <option value="all">All Materials</option>
                <option value="cobalt">Cobalt</option>
                <option value="copper">Copper</option>
                <option value="platinum">Platinum</option>
                <option value="lithium">Lithium</option>
                <option value="nickel">Nickel</option>
                <option value="manganese">Manganese</option>
              </select>
              
              <Button
                onClick={fetchESGData}
                disabled={isLoading}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="px-8 py-4 border-b border-zinc-200/50">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('overview')}
              className={`h-8 px-3 text-xs ${viewMode === 'overview' ? 'bg-green-50 text-green-600' : ''}`}
            >
              Overview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('detailed')}
              className={`h-8 px-3 text-xs ${viewMode === 'detailed' ? 'bg-green-50 text-green-600' : ''}`}
            >
              Detailed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('action_plan')}
              className={`h-8 px-3 text-xs ${viewMode === 'action_plan' ? 'bg-green-50 text-green-600' : ''}`}
            >
              Action Plan
            </Button>
          </div>
        </div>

        {/* Compliance Reports */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="p-6 border border-zinc-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900 capitalize">
                      {report.region.replace('_', ' ')} - {report.material}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      Last assessment: {report.metrics.lastAssessment.toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(report.metrics.overallScore)}`}>
                      {report.metrics.overallScore}/100
                    </span>
                    {report.metrics.trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {report.metrics.trend === 'deteriorating' && <TrendingDown className="h-4 w-4 text-rose-500" />}
                    {report.metrics.trend === 'stable' && <Activity className="h-4 w-4 text-zinc-500" />}
                  </div>
                </div>

                {/* ESG Scores */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-zinc-50 rounded-lg">
                    <div className="text-xl font-bold text-zinc-900">{report.metrics.environmentalScore}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center justify-center">
                      <Leaf className="h-3 w-3 mr-1" />
                      Environmental
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-zinc-50 rounded-lg">
                    <div className="text-xl font-bold text-zinc-900">{report.metrics.socialScore}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center justify-center">
                      <Users className="h-3 w-3 mr-1" />
                      Social
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-zinc-50 rounded-lg">
                    <div className="text-xl font-bold text-zinc-900">{report.metrics.governanceScore}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center justify-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Governance
                    </div>
                  </div>
                </div>

                {/* Critical Issues */}
                {report.metrics.criticalIssues > 0 && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      <span className="text-sm font-medium text-rose-800">
                        {report.metrics.criticalIssues} critical issue(s) identified
                      </span>
                    </div>
                  </div>
                )}

                {/* Recent Assessment */}
                {viewMode === 'detailed' && report.assessments.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-zinc-700 mb-2">Latest Assessment</h4>
                    <div className={`p-3 rounded border ${getStatusColor(report.assessments[0].status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{report.assessments[0].type.replace('_', ' ')}</span>
                        <span className="text-sm font-medium">{report.assessments[0].score}/100</span>
                      </div>
                      <div className="text-xs text-zinc-600">
                        {report.assessments[0].findings.join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Plan */}
                {viewMode === 'action_plan' && report.actionPlan.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-700 mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {report.actionPlan.slice(0, 3).map((action) => (
                        <div key={action.id} className={`p-3 rounded border ${getPriorityColor(action.priority)}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{action.title}</span>
                            <span className="text-xs capitalize">{action.priority}</span>
                          </div>
                          <div className="text-xs text-zinc-600">
                            Due: {action.dueDate.toLocaleDateString()} • {action.responsible}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Areas */}
                {viewMode === 'overview' && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-700 mb-2">Improvement Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {report.metrics.improvementAreas.map((area, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    <span className="text-xs text-zinc-500">
                      {report.metrics.certificationStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESGComplianceTracker;
