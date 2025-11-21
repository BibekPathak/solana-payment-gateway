import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { retrieveKey } from './key-management';
import { prisma } from './db';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const COLD_WALLET_ADDRESS = process.env.COLD_WALLET_ADDRESS || '';

export function getConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed');
}

// Get balance of an address
export async function getBalance(address: string): Promise<number> {
  const connection = getConnection();
  const publicKey = new PublicKey(address);
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

// Sweep funds from a payment address to cold wallet
export async function sweepAddress(fromAddress: string): Promise<string | null> {
  try {
    if (!COLD_WALLET_ADDRESS) {
      console.warn('COLD_WALLET_ADDRESS not configured, skipping sweep');
      return null;
    }

    const connection = getConnection();
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(COLD_WALLET_ADDRESS);

    // Get balance
    const balance = await connection.getBalance(fromPubkey);
    if (balance < 10000) { // Need at least 0.00001 SOL for fees
      return null;
    }

    // Get the keypair for this address
    const { getAddressKeypair } = await import('./key-management');
    const keypair = await getAddressKeypair(fromAddress);

    if (!keypair) {
      throw new Error(`Keypair for address ${fromAddress} not found`);
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: balance - 5000, // Leave some for fees
      })
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Sign and send transaction
    transaction.sign(keypair);
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    // Record sweep transaction
    await prisma.sweepTransaction.create({
      data: {
        fromAddress,
        toAddress: COLD_WALLET_ADDRESS,
        amount: (balance - 5000) / LAMPORTS_PER_SOL,
        signature,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Update address record
    await prisma.paymentAddress.update({
      where: { address: fromAddress },
      data: {
        balance: 0,
        lastSweptAt: new Date(),
      },
    });

    return signature;
  } catch (error) {
    console.error('Error sweeping address:', error);
    
    // Record failed sweep
    try {
      await prisma.sweepTransaction.create({
        data: {
          fromAddress,
          toAddress: COLD_WALLET_ADDRESS,
          amount: 0,
          signature: '',
          status: 'failed',
        },
      });
    } catch (dbError) {
      console.error('Error recording failed sweep:', dbError);
    }
    
    throw error;
  }
}

// Verify a payment transaction
export async function verifyPayment(address: string, expectedAmount: number): Promise<boolean> {
  try {
    const balance = await getBalance(address);
    return balance >= expectedAmount;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

// Monitor address for incoming payments
export async function monitorAddress(address: string, paymentId: string) {
  const connection = getConnection();
  const publicKey = new PublicKey(address);

  // In production, use Helius webhooks instead of polling
  // This is a fallback polling mechanism
  const checkBalance = async () => {
    try {
      const balance = await getBalance(address);
      if (balance > 0) {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
        });

        if (payment && payment.status === 'pending') {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'completed',
              completedAt: new Date(),
            },
          });

          // Trigger sweep
          await sweepAddress(address);
        }
      }
    } catch (error) {
      console.error('Error monitoring address:', error);
    }
  };

  // Poll every 5 seconds (in production, use webhooks)
  const interval = setInterval(checkBalance, 5000);

  // Stop after 1 hour
  setTimeout(() => clearInterval(interval), 3600000);

  return interval;
}

