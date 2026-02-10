import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network, predictionType, timeHorizon, features } = body;

    if (!network || !network.nodes || !Array.isArray(network.nodes)) {
      return NextResponse.json({
        success: false,
        error: 'Network data is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!openai) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Prepare network data for analysis
    const networkSummary = {
      nodeCount: network.nodes.length,
      edgeCount: network.edges?.length || 0,
      density: network.edges?.length > 0 ? network.edges.length / (network.nodes.length * (network.nodes.length - 1) / 2) : 0,
      avgDegree: network.edges?.length > 0 ? (network.edges.length * 2) / network.nodes.length : 0,
      directed: network.directed || false,
      features: features || ['degree', 'betweenness', 'closeness']
    };

    // Create prompt for OpenAI based on prediction type
    let prompt = '';
    let systemPrompt = '';

    switch (predictionType) {
      case 'network_growth':
        systemPrompt = 'You are a network analytics expert specializing in predictive modeling for network growth and evolution.';
        prompt = `Analyze this network and predict its growth patterns over ${timeHorizon || 12} months:

Network Summary:
- Nodes: ${networkSummary.nodeCount}
- Edges: ${networkSummary.edgeCount}
- Density: ${networkSummary.density.toFixed(3)}
- Average Degree: ${networkSummary.avgDegree.toFixed(2)}
- Directed: ${networkSummary.directed}

Features to analyze: ${networkSummary.features.join(', ')}

Provide predictions for:
1. Expected node growth rate
2. Expected edge growth rate
3. Network density evolution
4. Key nodes likely to gain importance
5. Potential community formation
6. Risk factors for network fragmentation

Format the response as JSON with numerical predictions and confidence intervals.`;

        break;

      case 'anomaly_detection':
        systemPrompt = 'You are an expert in network anomaly detection and pattern recognition.';
        prompt = `Analyze this network for potential anomalies and unusual patterns:

Network Summary:
- Nodes: ${networkSummary.nodeCount}
- Edges: ${networkSummary.edgeCount}
- Density: ${networkSummary.density.toFixed(3)}
- Average Degree: ${networkSummary.avgDegree.toFixed(2)}

Identify:
1. Nodes with unusual connection patterns
2. Edges that may indicate suspicious activity
3. Network structures that deviate from expected patterns
4. Potential security risks or fraud indicators
5. Temporal anomalies if time-series data is available

Provide anomaly scores (0-1) for each identified pattern and recommended actions.

Format the response as JSON with anomaly scores and descriptions.`;

        break;

      case 'influence_prediction':
        systemPrompt = 'You are a network influence and viral marketing expert.';
        prompt = `Predict influence propagation in this network:

Network Summary:
- Nodes: ${networkSummary.nodeCount}
- Edges: ${networkSummary.edgeCount}
- Density: ${networkSummary.density.toFixed(3)}
- Average Degree: ${networkSummary.avgDegree.toFixed(2)}

Predict:
1. Which nodes are most likely to become influential
2. Information spread patterns and reach
3. Optimal seeding strategies for campaigns
4. Viral potential of different node types
5. Network resistance to influence campaigns

Provide influence scores and propagation predictions.

Format the response as JSON with influence metrics and predictions.`;

        break;

      case 'community_evolution':
        systemPrompt = 'You are a community detection and evolution expert.';
        prompt = `Predict community evolution in this network:

Network Summary:
- Nodes: ${networkSummary.nodeCount}
- Edges: ${networkSummary.edgeCount}
- Density: ${networkSummary.density.toFixed(3)}

Predict:
1. How communities will form and evolve
2. Community stability and fragmentation risks
3. Bridge nodes between communities
4. Potential community mergers or splits
5. Optimal community intervention strategies

Format the response as JSON with community predictions and evolution patterns.`;

        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid prediction type',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0]?.message?.content || '{}';
    let predictions;

    try {
      predictions = JSON.parse(aiResponse);
    } catch (error) {
      // If JSON parsing fails, create a structured response
      predictions = {
        prediction_type: predictionType,
        time_horizon: timeHorizon || 12,
        network_summary: networkSummary,
        predictions: aiResponse,
        confidence: 0.8,
        model: "gpt-4"
      };
    }

    // Add metadata
    const result = {
      success: true,
      prediction_type: predictionType,
      time_horizon: timeHorizon || 12,
      network_summary: networkSummary,
      predictions: predictions,
      metadata: {
        model: "gpt-4",
        confidence: 0.85,
        computation_time: Date.now() - Date.now(),
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('ML Predictive API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate predictions',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const predictionTypes = [
      {
        id: 'network_growth',
        name: 'Network Growth Prediction',
        description: 'Predict how networks will grow and evolve over time',
        features: ['node_growth', 'edge_growth', 'density_evolution', 'community_formation'],
        use_cases: ['Business expansion', 'Social network growth', 'Infrastructure planning']
      },
      {
        id: 'anomaly_detection',
        name: 'Anomaly Detection',
        description: 'Identify unusual patterns and potential security risks',
        features: ['unusual_connections', 'suspicious_patterns', 'fraud_detection', 'security_risks'],
        use_cases: ['Fraud detection', 'Security monitoring', 'Quality control']
      },
      {
        id: 'influence_prediction',
        name: 'Influence Prediction',
        description: 'Predict information spread and influence propagation',
        features: ['influence_scores', 'viral_potential', 'seeding_strategies', 'reach_prediction'],
        use_cases: ['Marketing campaigns', 'Information dissemination', 'Social influence']
      },
      {
        id: 'community_evolution',
        name: 'Community Evolution',
        description: 'Predict how communities will form and evolve',
        features: ['community_formation', 'evolution_patterns', 'stability_analysis', 'intervention_strategies'],
        use_cases: ['Community management', 'Social dynamics', 'Organizational design']
      }
    ];

    return NextResponse.json({
      success: true,
      prediction_types: predictionTypes,
      total: predictionTypes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML Predictive types API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prediction types',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}