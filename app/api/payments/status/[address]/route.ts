import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getBalance } from '@/lib/solana';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const payment = await prisma.payment.findUnique({
      where: { paymentAddress: address },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Get current balance
    const balance = await getBalance(address);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        address: payment.paymentAddress,
        status: payment.status,
        currentBalance: balance,
        isPaid: balance >= payment.amount,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        transactionSignature: payment.transactionSignature,
      },
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

