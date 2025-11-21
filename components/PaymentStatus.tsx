'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Copy, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface PaymentStatusProps {
  paymentId: string;
  paymentAddress: string;
  onReset: () => void;
}

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  address: string;
  status: string;
  currentBalance: number;
  isPaid: boolean;
  createdAt: string;
  completedAt: string | null;
  transactionSignature: string | null;
}

export default function PaymentStatus({
  paymentId,
  paymentAddress,
  onReset,
}: PaymentStatusProps) {
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(true);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/status/${paymentAddress}`);
      const data = await response.json();

      if (data.success) {
        setPayment(data.payment);
        if (data.payment.status === 'completed') {
          setPolling(false);
        }
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentStatus();

    if (polling) {
      const interval = setInterval(() => {
        fetchPaymentStatus();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentAddress, polling]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = () => {
    if (!payment) return <Clock className="w-5 h-5" />;
    
    switch (payment.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    if (!payment) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
    
    switch (payment.status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
    }
  };

  if (loading && !payment) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payment...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Payment Status
        </h2>
        <button
          onClick={onReset}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          New Payment
        </button>
      </div>

      {payment && (
        <>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="font-medium capitalize">{payment.status}</span>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {payment.amount} {payment.currency}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Address
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm break-all">
                  {payment.address}
                </code>
                <button
                  onClick={() => copyToClipboard(payment.address)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {payment.currentBalance !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Balance
                </label>
                <p className="text-lg text-gray-800 dark:text-white">
                  {payment.currentBalance.toFixed(9)} SOL
                </p>
                {payment.isPaid && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ✓ Payment received!
                  </p>
                )}
              </div>
            )}

            {payment.transactionSignature && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transaction Signature
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm break-all">
                    {payment.transactionSignature}
                  </code>
                  <button
                    onClick={() => copyToClipboard(payment.transactionSignature!)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Copy signature"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
              Scan QR Code to Pay
            </label>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCode
                value={payment.address}
                size={256}
                level="H"
                
              />
            </div>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              Send {payment.amount} SOL to the address above
            </p>
          </div>

          {payment.status === 'pending' && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking payment status...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

