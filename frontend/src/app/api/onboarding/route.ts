import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, step } = body; // step: 'connect' | 'create' | 'accept' | 'release'

    let user = await prisma.userOnboarding.findUnique({ where: { address } });
    if (!user) {
      user = await prisma.userOnboarding.create({ data: { address } });
    }

    const updates: any = {};
    if (step === 'connect') updates.hasConnected = true;
    if (step === 'create') updates.hasCreated = true;
    if (step === 'accept') updates.hasAccepted = true;
    if (step === 'release') updates.hasReleased = true;

    if (Object.keys(updates).length > 0) {
      user = await prisma.userOnboarding.update({
        where: { address },
        data: updates
      });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const users = await prisma.userOnboarding.findMany({ orderBy: { timestamp: 'desc' } });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
