import { NextRequest, NextResponse } from 'next/server';

// Production-grade Pricing & Revenue API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientData, usageData } = body;

    switch (action) {
      case 'calculate_pricing':
        const pricing = calculatePricing(clientData);
        return NextResponse.json({ success: true, pricing });

      case 'generate_proposal':
        const proposal = await generateClientProposal(clientData);
        return NextResponse.json({ success: true, proposal });

      case 'track_usage':
        const usage = await trackUsage(clientData.clientId, usageData);
        return NextResponse.json({ success: true, usage });

      case 'calculate_roi':
        const roi = await calculateClientROI(clientData);
        return NextResponse.json({ success: true, roi });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Pricing calculation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const sites = parseInt(searchParams.get('sites') || '1');
    const assets = parseInt(searchParams.get('assets') || '10');

    const pricingTiers = getPricingTiers();
    const customPricing = calculateCustomPricing(sites, assets);

    return NextResponse.json({
      success: true,
      pricingTiers,
      customPricing: tier === 'custom' ? customPricing : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Pricing retrieval error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve pricing information'
    }, { status: 500 });
  }
}

// Core Pricing Functions
function getPricingTiers() {
  return {
    starter: {
      name: 'MIAR Starter',
      monthlyPrice: 15000,
      annualPrice: 150000, // 2 months free
      maxSites: 1,
      maxAssets: 25,
      features: [
        'Real-time asset monitoring',
        'Basic compliance tracking',
        'Standard reporting',
        'Email alerts',
        '8x5 support'
      ],
      limits: {
        apiCalls: 10000,
        dataRetention: '6 months',
        users: 5,
        integrations: 2
      },
      savings: {
        typical: 75000, // Monthly savings
        roi: '400%',
        payback: '2.4 months'
      }
    },
    
    professional: {
      name: 'MIAR Professional',
      monthlyPrice: 45000,
      annualPrice: 450000, // 2 months free
      maxSites: 5,
      maxAssets: 100,
      features: [
        'Advanced predictive analytics',
        'AI-powered optimization',
        'Comprehensive compliance suite',
        'Tailings reprocessing analysis',
        'Custom dashboards',
        'Advanced reporting & BI',
        'Mobile app access',
        'API integrations',
        '24x5 support'
      ],
      limits: {
        apiCalls: 50000,
        dataRetention: '2 years',
        users: 20,
        integrations: 10
      },
      savings: {
        typical: 225000, // Monthly savings
        roi: '400%',
        payback: '2.4 months'
      }
    },
    
    enterprise: {
      name: 'MIAR Enterprise',
      monthlyPrice: 125000,
      annualPrice: 1250000, // 2 months free
      maxSites: 'Unlimited',
      maxAssets: 'Unlimited',
      features: [
        'Everything in Professional',
        'Multi-site network optimization',
        'Advanced AI materials discovery',
        'Regulatory compliance automation',
        'White-label options',
        'Custom integrations',
        'Dedicated customer success manager',
        'Training and onboarding',
        '24x7 priority support',
        'SLA guarantees'
      ],
      limits: {
        apiCalls: 'Unlimited',
        dataRetention: '5 years',
        users: 'Unlimited',
        integrations: 'Unlimited'
      },
      savings: {
        typical: 750000, // Monthly savings
        roi: '500%',
        payback: '2.0 months'
      }
    }
  };
}

function calculateCustomPricing(sites: number, assets: number) {
  const basePricePerSite = 25000; // Monthly
  const basePricePerAsset = 150; // Monthly per asset
  const volumeDiscount = sites > 10 ? 0.2 : sites > 5 ? 0.1 : 0;
  
  const sitesCost = sites * basePricePerSite;
  const assetsCost = assets * basePricePerAsset;
  const subtotal = sitesCost + assetsCost;
  const discount = subtotal * volumeDiscount;
  const monthlyPrice = subtotal - discount;
  
  // Calculate expected ROI based on industry averages
  const expectedSavingsPerSite = 150000; // Monthly
  const expectedSavingsPerAsset = 750; // Monthly
  const totalExpectedSavings = (sites * expectedSavingsPerSite) + (assets * expectedSavingsPerAsset);
  
  return {
    breakdown: {
      sitesCount: sites,
      assetsCount: assets,
      sitesCost,
      assetsCost,
      subtotal,
      volumeDiscount: discount,
      monthlyPrice,
      annualPrice: monthlyPrice * 10 // 2 months free
    },
    roi: {
      monthlySavings: totalExpectedSavings,
      annualSavings: totalExpectedSavings * 12,
      monthlyROI: ((totalExpectedSavings - monthlyPrice) / monthlyPrice) * 100,
      paybackPeriod: monthlyPrice / totalExpectedSavings
    },
    features: [
      'Enterprise-grade platform',
      'Unlimited API access',
      'Custom integrations',
      'Dedicated support team',
      'Advanced AI capabilities',
      'Multi-site optimization',
      'Regulatory compliance suite',
      'Custom training program'
    ]
  };
}

function calculatePricing(clientData: any) {
  const { sites, assets, requirements, currentSystems } = clientData;
  
  // Determine recommended tier based on requirements
  const recommendedTier = sites <= 1 && assets <= 25 ? 'starter' :
                         sites <= 5 && assets <= 100 ? 'professional' : 
                         'enterprise';
  
  const tiers = getPricingTiers();
  const customPricing = sites > 5 || assets > 100 ? calculateCustomPricing(sites, assets) : null;
  
  // Calculate implementation costs
  const implementationCosts = {
    setup: 25000,
    training: sites * 5000,
    integration: currentSystems?.length * 10000 || 0,
    customization: requirements?.customizations * 15000 || 0
  };
  
  const totalImplementation = Object.values(implementationCosts).reduce((sum, cost) => sum + cost, 0);
  
  return {
    recommendedTier,
    pricingTiers: tiers,
    customPricing,
    implementationCosts,
    totalImplementation,
    firstYearTotal: {
      starter: totalImplementation + tiers.starter.annualPrice,
      professional: totalImplementation + tiers.professional.annualPrice,
      enterprise: totalImplementation + tiers.enterprise.annualPrice,
      custom: customPricing ? totalImplementation + customPricing.breakdown.annualPrice : null
    }
  };
}

async function generateClientProposal(clientData: any) {
  const pricing = calculatePricing(clientData);
  const { companyName, industry, currentChallenges, goals } = clientData;
  
  // Calculate industry-specific value propositions
  const industryMultipliers = {
    'gold': 1.2,
    'copper': 1.1,
    'iron_ore': 0.9,
    'coal': 0.8,
    'diamonds': 1.5,
    'platinum': 1.3
  };
  
  const multiplier = industryMultipliers[industry as keyof typeof industryMultipliers] || 1.0;
  const recommendedTier = pricing.pricingTiers[pricing.recommendedTier as keyof typeof pricing.pricingTiers];
  const adjustedSavings = recommendedTier.savings.typical * multiplier;
  
  const proposal = {
    proposalId: `PROP-${Date.now()}`,
    clientInfo: {
      companyName,
      industry,
      currentChallenges,
      goals
    },
    executiveSummary: {
      recommendedSolution: recommendedTier.name,
      monthlyInvestment: recommendedTier.monthlyPrice,
      expectedMonthlySavings: adjustedSavings,
      netMonthlyBenefit: adjustedSavings - recommendedTier.monthlyPrice,
      roi: `${((adjustedSavings - recommendedTier.monthlyPrice) / recommendedTier.monthlyPrice * 100).toFixed(0)}%`,
      paybackPeriod: `${(recommendedTier.monthlyPrice / adjustedSavings).toFixed(1)} months`
    },
    valueProposition: {
      primaryBenefits: [
        `Reduce operational costs by $${adjustedSavings.toLocaleString()}/month`,
        'Prevent costly compliance violations',
        'Optimize asset utilization and extend equipment life',
        'Unlock value from tailings and waste materials',
        'Improve safety and environmental performance'
      ],
      industrySpecific: getIndustrySpecificBenefits(industry),
      riskMitigation: [
        'Reduce regulatory fines by up to 90%',
        'Prevent equipment failures saving $500K+ per incident',
        'Minimize environmental incidents',
        'Improve operational continuity'
      ]
    },
    implementationPlan: {
      phase1: {
        duration: '4-6 weeks',
        activities: [
          'System setup and configuration',
          'Data integration and migration',
          'User training and onboarding',
          'Initial asset monitoring deployment'
        ],
        cost: pricing.totalImplementation * 0.4
      },
      phase2: {
        duration: '6-8 weeks',
        activities: [
          'Advanced analytics configuration',
          'Compliance monitoring setup',
          'Tailings analysis integration',
          'Custom reporting development'
        ],
        cost: pricing.totalImplementation * 0.6
      },
      totalImplementation: pricing.totalImplementation
    },
    financialProjection: {
      year1: {
        investment: recommendedTier.annualPrice + pricing.totalImplementation,
        savings: adjustedSavings * 12,
        netBenefit: (adjustedSavings * 12) - (recommendedTier.annualPrice + pricing.totalImplementation),
        roi: (((adjustedSavings * 12) - (recommendedTier.annualPrice + pricing.totalImplementation)) / (recommendedTier.annualPrice + pricing.totalImplementation)) * 100
      },
      year2: {
        investment: recommendedTier.annualPrice,
        savings: adjustedSavings * 12 * 1.1, // 10% improvement
        netBenefit: (adjustedSavings * 12 * 1.1) - recommendedTier.annualPrice,
        roi: (((adjustedSavings * 12 * 1.1) - recommendedTier.annualPrice) / recommendedTier.annualPrice) * 100
      },
      year3: {
        investment: recommendedTier.annualPrice,
        savings: adjustedSavings * 12 * 1.2, // 20% improvement
        netBenefit: (adjustedSavings * 12 * 1.2) - recommendedTier.annualPrice,
        roi: (((adjustedSavings * 12 * 1.2) - recommendedTier.annualPrice) / recommendedTier.annualPrice) * 100
      }
    },
    competitiveAdvantage: [
      'AI-powered optimization unique to mining industry',
      'Integrated compliance monitoring',
      'Tailings reprocessing feasibility analysis',
      'Real-time predictive maintenance',
      'Proven ROI in African mining operations'
    ],
    nextSteps: [
      'Schedule executive presentation',
      'Conduct technical assessment',
      'Pilot program at 1 site (90 days)',
      'Full deployment planning',
      'Contract execution'
    ],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    createdAt: new Date().toISOString()
  };
  
  return proposal;
}

function getIndustrySpecificBenefits(industry: string) {
  const benefits: Record<string, string[]> = {
    'gold': [
      'Optimize cyanide usage and recovery',
      'Maximize gold recovery from tailings',
      'Reduce water treatment costs',
      'Improve heap leach efficiency'
    ],
    'copper': [
      'Optimize flotation circuits',
      'Reduce acid mine drainage',
      'Improve smelter feed quality',
      'Maximize copper recovery rates'
    ],
    'iron_ore': [
      'Optimize pelletizing processes',
      'Reduce energy consumption in beneficiation',
      'Improve ore grade consistency',
      'Minimize transportation costs'
    ],
    'coal': [
      'Optimize washing plant efficiency',
      'Reduce methane emissions',
      'Improve coal quality consistency',
      'Minimize water usage'
    ],
    'diamonds': [
      'Optimize sorting and recovery',
      'Reduce processing costs per carat',
      'Improve security and tracking',
      'Maximize diamond recovery rates'
    ],
    'platinum': [
      'Optimize flotation and concentration',
      'Reduce smelting costs',
      'Improve PGM recovery rates',
      'Minimize environmental impact'
    ]
  };
  
  return benefits[industry] || [
    'Optimize mineral processing efficiency',
    'Reduce operational costs',
    'Improve recovery rates',
    'Minimize environmental impact'
  ];
}

async function trackUsage(clientId: string, usageData: any) {
  // Track various usage metrics for billing and optimization
  const usage = {
    clientId,
    period: usageData.period || 'current_month',
    metrics: {
      apiCalls: usageData.apiCalls || 0,
      assetsMonitored: usageData.assetsMonitored || 0,
      complianceChecks: usageData.complianceChecks || 0,
      reportsGenerated: usageData.reportsGenerated || 0,
      aiAnalyses: usageData.aiAnalyses || 0,
      dataProcessed: usageData.dataProcessed || 0, // GB
      activeUsers: usageData.activeUsers || 0
    },
    costs: {
      computeTime: usageData.apiCalls * 0.01 || 0,
      dataStorage: usageData.dataProcessed * 0.1 || 0,
      aiProcessing: usageData.aiAnalyses * 5 || 0
    },
    overages: {},
    timestamp: new Date().toISOString()
  };
  
  // Calculate overage charges if applicable
  const client = await getClientTier(clientId);
  usage.overages = calculateOverages(usage.metrics, client.limits);
  
  return usage;
}

async function calculateClientROI(clientData: any) {
  const { clientId, actualSavings, implementation, currentSpend } = clientData;
  
  const roi = {
    clientId,
    period: '12_months',
    investment: {
      platformCosts: currentSpend.monthly * 12,
      implementationCosts: implementation.total,
      totalInvestment: (currentSpend.monthly * 12) + implementation.total
    },
    returns: {
      documentedSavings: actualSavings.total,
      riskAvoidance: actualSavings.complianceSavings,
      efficiencyGains: actualSavings.operationalSavings,
      totalReturns: actualSavings.total + actualSavings.complianceSavings + actualSavings.operationalSavings
    },
    calculations: {
      netBenefit: 0,
      roi: 0,
      paybackPeriod: 0
    },
    benchmarks: {
      industryAverage: '350%',
      topPerformer: '500%',
      clientRanking: 'Top 25%'
    },
    recommendations: [
      'Expand to additional sites for greater scale benefits',
      'Implement advanced AI modules for higher optimization',
      'Consider tailings reprocessing analysis for new revenue streams'
    ]
  };
  
  roi.calculations.netBenefit = roi.returns.totalReturns - roi.investment.totalInvestment;
  roi.calculations.roi = (roi.calculations.netBenefit / roi.investment.totalInvestment) * 100;
  roi.calculations.paybackPeriod = roi.investment.totalInvestment / (roi.returns.totalReturns / 12);
  
  return roi;
}

function calculateOverages(usage: any, limits: any) {
  const overages: Record<string, any> = {};
  
  if (limits.apiCalls !== 'Unlimited' && usage.apiCalls > limits.apiCalls) {
    overages.apiCalls = {
      excess: usage.apiCalls - limits.apiCalls,
      rate: 0.05, // per call
      charge: (usage.apiCalls - limits.apiCalls) * 0.05
    };
  }
  
  if (limits.users !== 'Unlimited' && usage.activeUsers > limits.users) {
    overages.users = {
      excess: usage.activeUsers - limits.users,
      rate: 500, // per user per month
      charge: (usage.activeUsers - limits.users) * 500
    };
  }
  
  const totalOverage = Object.values(overages).reduce((sum: number, overage: any) => sum + overage.charge, 0);
  
  return {
    items: overages,
    totalCharge: totalOverage,
    hasOverages: totalOverage > 0
  };
}

async function getClientTier(clientId: string) {
  // Mock client tier lookup - would be from database in production
  return {
    tier: 'professional',
    limits: {
      apiCalls: 50000,
      users: 20,
      dataRetention: '2 years'
    }
  };
}
