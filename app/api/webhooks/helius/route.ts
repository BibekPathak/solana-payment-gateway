import { NextRequest, NextResponse } from 'next/server';
import { handleHeliusWebhook } from '@/lib/helius';
import type { HeliusWebhookPayload } from '@/lib/helius';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = request.headers.get('x-webhook-secret');
      if (!providedSecret || providedSecret !== webhookSecret) {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook secret' },
          { status: 401 }
        );
      }
    }

    const payload: HeliusWebhookPayload = await request.json();
    await handleHeliusWebhook(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

