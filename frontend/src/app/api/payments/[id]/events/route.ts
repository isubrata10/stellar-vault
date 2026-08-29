import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const events = await prisma.paymentEvent.findMany({
      where: { paymentId: params.id },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { txHash, state, actor } = body;

    if (!txHash || !state || !actor) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const event = await prisma.paymentEvent.create({
      data: {
        paymentId: params.id,
        txHash,
        state,
        actor
      }
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
