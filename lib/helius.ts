import { prisma } from './db';
import { sweepAddress, verifyPayment } from './solana';
import { getPaymentByAddress } from './redis';

export interface HeliusWebhookPayload {
  accountData: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<unknown>;
  }>;
  description: string;
  nativeTransfers: Array<{
    amount: number;
    fromUserAccount: string;
    toUserAccount: string;
  }>;
  signature: string;
  source: string;
  timestamp: number;
  tokenTransfers: Array<unknown>;
  type: string;
}

// Handle Helius webhook for address monitoring
export async function handleHeliusWebhook(payload: HeliusWebhookPayload) {
  try {
    // Process native SOL transfers
    if (payload.nativeTransfers && payload.nativeTransfers.length > 0) {
      for (const transfer of payload.nativeTransfers) {
        const toAddress = transfer.toUserAccount;
        
        // Check if this is a payment address we're tracking
        const paymentId = await getPaymentByAddress(toAddress);
        
        if (paymentId) {
          // Update payment status
          const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
          });

          if (payment && payment.status === 'pending') {
            const amount = transfer.amount / 1e9; // Convert lamports to SOL

            // Verify the payment amount
            if (amount >= payment.amount) {
              await prisma.payment.update({
                where: { id: paymentId },
                data: {
                  status: 'completed',
                  completedAt: new Date(),
                  transactionSignature: payload.signature,
                },
              });

              // Update address balance
              await prisma.paymentAddress.updateMany({
                where: { address: toAddress },
                data: {
                  balance: amount,
                },
              });

              // Trigger automatic sweep to cold wallet
              await sweepAddress(toAddress);
            }
          }
        } else {
          // Check if this is a tracked payment address (for sweeping)
          const addressRecord = await prisma.paymentAddress.findUnique({
            where: { address: toAddress },
          });

          if (addressRecord && addressRecord.isActive) {
            const amount = transfer.amount / 1e9;
            
            // Update balance
            await prisma.paymentAddress.update({
              where: { address: toAddress },
              data: {
                balance: { increment: amount },
              },
            });

            // Auto-sweep if balance is above threshold
            const threshold = parseFloat(process.env.SWEEP_THRESHOLD || '0.1');
            if (amount >= threshold) {
              await sweepAddress(toAddress);
            }
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling Helius webhook:', error);
    throw error;
  }
}

// Register webhook with Helius (call this during setup)
export async function registerHeliusWebhook(webhookUrl: string, addresses: string[]) {
  const heliusApiKey = process.env.HELIUS_API_KEY;
  if (!heliusApiKey) {
    throw new Error('HELIUS_API_KEY environment variable is required');
  }

  const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
  const finalWebhookUrl = webhookSecret ? `${webhookUrl}?secret=${encodeURIComponent(webhookSecret)}` : webhookUrl;

  const response = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${heliusApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      webhookURL: finalWebhookUrl,
      transactionTypes: ['Any'],
      accountAddresses: addresses,
      webhookType: 'enhanced',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register webhook: ${error}`);
  }

  return await response.json();
}

