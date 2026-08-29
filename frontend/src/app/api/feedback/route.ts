import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, rating, liked, confused, bugs, features } = body;

    const feedback = await prisma.userFeedback.create({
      data: { address, rating, liked, confused, bugs, features }
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Feedback API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const feedback = await prisma.userFeedback.findMany({ orderBy: { timestamp: 'desc' } });
    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
