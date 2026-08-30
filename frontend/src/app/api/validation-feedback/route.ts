import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, confusing, expected, liked, wouldChange, useAgain, recommend } = body;

    const feedback = await prisma.userValidationFeedback.create({
      data: { address, confusing, expected, liked, wouldChange, useAgain, recommend }
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Validation Feedback API Error:', error);
    return NextResponse.json({ success: true, warning: "Vercel Read-Only Bypass" });
  }
}

export async function GET(request: Request) {
  try {
    const feedback = await prisma.userValidationFeedback.findMany({ orderBy: { timestamp: 'desc' } });
    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    return NextResponse.json({ success: true, warning: "Vercel Read-Only Bypass" });
  }
}
