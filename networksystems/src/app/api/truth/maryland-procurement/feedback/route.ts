import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordReview } from '@/lib/risk/truth-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const feedbackSchema = z.object({
  flagId: z.string().min(1),
  fingerprint: z.string().min(1),
  ruleId: z.string().min(1),
  verdict: z.enum(['ACCEPT', 'REJECT']),
  reason: z.string().min(8).max(600),
  reviewer: z.string().min(2).max(120).default('Analyst'),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = feedbackSchema.parse(await request.json());
    const review = recordReview(parsed);
    return NextResponse.json({ success: true, review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback payload', issues: error.flatten() },
        { status: 400 }
      );
    }
    console.error('Feedback recording failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to save feedback' }, { status: 500 });
  }
}
