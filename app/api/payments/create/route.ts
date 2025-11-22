import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { generatePaymentAddress } from '@/lib/key-management';
import { trackPaymentAddress } from '@/lib/redis';
import { z } from 'zod';

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('SOL'),
  merchantId: z.string().optional(),
  orderId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Generate a new payment address
    const { address } = await generatePaymentAddress();

    const metadata = validatedData.metadata as Prisma.InputJsonValue | undefined;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: validatedData.amount,
        currency: validatedData.currency,
        paymentAddress: address,
        merchantId: validatedData.merchantId,
        orderId: validatedData.orderId,
        metadata,
        status: 'pending',
      },
    });

    // Track address in Redis
    await trackPaymentAddress(address, payment.id);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        address: payment.paymentAddress,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      //{ success: false, error: 'Failed to create payment' },
      {
        success: false,
        error: 'Failed to create payment',
        ...(isDevelopment ? { details: errorMessage, stack: error instanceof Error ? error.stack : undefined } : {}),
      },
      { status: 500 }
    );
  }
}

