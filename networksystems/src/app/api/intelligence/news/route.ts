import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

interface IntelligenceResult {
  content: string;
  citations: string[];
  timestamp: string;
  source: 'gemini' | 'openai';
}

const SYSTEM_CONTEXT = 'You are a mining industry analyst. Provide concise, data-driven insights about mining operations, commodity markets, and supply chains.';

async function queryGemini(prompt: string, context?: string): Promise<IntelligenceResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${context || SYSTEM_CONTEXT}\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Gemini response missing content');
  }

  return {
    content,
    citations: [],
    timestamp: new Date().toISOString(),
    source: 'gemini',
  };
}

async function queryOpenAI(prompt: string, context?: string): Promise<IntelligenceResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 500,
    messages: [
      {
        role: 'system',
        content: context || SYSTEM_CONTEXT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response missing content');
  }

  return {
    content,
    citations: [],
    timestamp: new Date().toISOString(),
    source: 'openai',
  };
}

async function queryIntelligence(prompt: string, context?: string): Promise<IntelligenceResult> {
  try {
    return await queryGemini(prompt, context);
  } catch {
    return queryOpenAI(prompt, context);
  }
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
        result = await queryIntelligence(prompt);
        break;

      case 'commodity':
        if (!commodity) {
          return NextResponse.json({ error: 'Commodity parameter required' }, { status: 400 });
        }
        const commodityPrompt = `What are the latest developments affecting ${commodity} prices and supply? Include production updates, demand forecasts, and geopolitical factors from the past 7 days.`;
        result = await queryIntelligence(commodityPrompt);
        break;

      case 'company':
        if (!company) {
          return NextResponse.json({ error: 'Company parameter required' }, { status: 400 });
        }
        const companyPrompt = `What is the latest news about ${company} mining operations? Include production updates, financial results, expansion plans, and any operational challenges from the past 30 days.`;
        result = await queryIntelligence(companyPrompt);
        break;

      case 'supply_chain':
        const scPrompt = `What are the current supply chain disruptions affecting the global mining industry? Include port delays, logistics issues, geopolitical conflicts, and weather events from the past 7 days.`;
        result = await queryIntelligence(scPrompt);
        break;

      case 'alerts':
        const alertsPrompt = `What are the most urgent and impactful developments in the mining industry today that would affect mining operations, supply chains, or commodity prices? Focus on breaking news and critical events.`;
        result = await queryIntelligence(alertsPrompt);
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
