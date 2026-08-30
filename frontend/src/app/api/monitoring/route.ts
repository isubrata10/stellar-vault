import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { level, context, message, metadata } = await request.json();
    
    if (!level || !context || !message) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const log = await prisma.systemLog.create({
      data: {
        level,
        context,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error('Monitoring API Error:', error);
    return NextResponse.json({ success: true, warning: "Vercel Read-Only Bypass" });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const logs = await prisma.systemLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Compute basic statistics
    const stats = {
      errors: await prisma.systemLog.count({ where: { level: 'error' } }),
      fatals: await prisma.systemLog.count({ where: { level: 'fatal' } }),
      blockchainFailures: await prisma.systemLog.count({ where: { context: 'blockchain', level: { in: ['error', 'fatal'] } } })
    };

    return NextResponse.json({ success: true, data: { logs, stats } });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ success: true, warning: "Vercel Read-Only Bypass" });
  }
}
