import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');

    let payments;
    if (user) {
      payments = await prisma.paymentMetadata.findMany({
        where: {
          OR: [
            { businessAddress: user },
            { recipientAddress: user }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      payments = await prisma.paymentMetadata.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, businessAddress, recipientAddress, title, description, milestoneDesc } = body;

    if (!id || !businessAddress || !recipientAddress || !title) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const metadata = await prisma.paymentMetadata.create({
      data: {
        id,
        businessAddress,
        recipientAddress,
        title,
        description,
        milestoneDesc
      }
    });

    return NextResponse.json({ success: true, data: metadata });
  } catch (error) {
    console.error('Error creating payment metadata:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
