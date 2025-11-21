'use client';

import { useState } from 'react';
import PaymentForm from '@/components/PaymentForm';
import PaymentStatus from '@/components/PaymentStatus';

export default function Home() {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentAddress, setPaymentAddress] = useState<string | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Solana Payment Gateway
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure, decentralized payments on Solana
          </p>
        </div>

        {!paymentId ? (
          <PaymentForm
            onPaymentCreated={(id, address) => {
              setPaymentId(id);
              setPaymentAddress(address);
            }}
          />
        ) : (
          <PaymentStatus
            paymentId={paymentId}
            paymentAddress={paymentAddress!}
            onReset={() => {
              setPaymentId(null);
              setPaymentAddress(null);
            }}
          />
        )}
      </div>
    </main>
  );
}

