import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const events = await prisma.paymentEvent.findMany({
      where: { actor: params.id },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
