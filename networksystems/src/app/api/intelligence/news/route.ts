import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * NEWS INTELLIGENCE API
 * Server-side only - API keys never exposed to client
 */

interface PerplexityConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const perplexityConfig: PerplexityConfig = {
  baseUrl: 'https://api.perplexity.ai',
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  model: 'llama-3.1-sonar-large-128k-online',
};

async function queryPerplexity(prompt: string, context?: string): Promise<any> {
  if (!perplexityConfig.apiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const response = await fetch(`${perplexityConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: perplexityConfig.model,
      messages: [
        {
          role: 'system',
          content: context || 'You are a mining industry analyst. Provide concise, data-driven insights about mining operations, commodity markets, and supply chains.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
      return_citations: true,
      search_recency_filter: 'week',
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    citations: data.citations || [],
    timestamp: new Date().toISOString(),
    source: 'perplexity_ai',
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'summary';
    const region = searchParams.get('region');
    const commodity = searchParams.get('commodity');
    const company = searchParams.get('company');

    let result;

    switch (type) {
      case 'summary':
        const regionFilter = region ? ` in ${region}` : '';
        const prompt = `What are the most important mining industry developments${regionFilter} in the past 7 days? Focus on: production disruptions, new discoveries, M&A activity, commodity price drivers, and policy changes. Provide 3-5 bullet points with specific details.`;
        result = await queryPerplexity(prompt);
        break;

      case 'commodity':
        if (!commodity) {
          return NextResponse.json({ error: 'Commodity parameter required' }, { status: 400 });
        }
        const commodityPrompt = `What are the latest developments affecting ${commodity} prices and supply? Include production updates, demand forecasts, and geopolitical factors from the past 7 days.`;
        result = await queryPerplexity(commodityPrompt);
        break;

      case 'company':
        if (!company) {
          return NextResponse.json({ error: 'Company parameter required' }, { status: 400 });
        }
        const companyPrompt = `What is the latest news about ${company} mining operations? Include production updates, financial results, expansion plans, and any operational challenges from the past 30 days.`;
        result = await queryPerplexity(companyPrompt);
        break;

      case 'supply_chain':
        const scPrompt = `What are the current supply chain disruptions affecting the global mining industry? Include port delays, logistics issues, geopolitical conflicts, and weather events from the past 7 days.`;
        result = await queryPerplexity(scPrompt);
        break;

      case 'alerts':
        const alertsPrompt = `What are the most urgent and impactful developments in the mining industry today that would affect mining operations, supply chains, or commodity prices? Focus on breaking news and critical events.`;
        result = await queryPerplexity(alertsPrompt);
        break;

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    // Log API usage for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'api_call',
        resource: 'intelligence_news',
        resourceId: type,
        details: JSON.stringify({ type, region, commodity, company }),
        timestamp: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('News intelligence API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
