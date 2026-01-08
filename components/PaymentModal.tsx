import React, { useState, useEffect } from 'react';
import { PaymentStatus } from '../types';
import { CreditCard, CheckCircle, Loader2, X } from 'lucide-react';

interface PaymentModalProps {
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ amount, isOpen, onClose, onSuccess }) => {
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus(PaymentStatus.IDLE);
      setCardNumber('');
      setExpiry('');
      setCvc('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(PaymentStatus.PROCESSING);
    
    // Simulate network request
    setTimeout(() => {
      setStatus(PaymentStatus.SUCCESS);
      // Wait a bit to show success message before closing/proceeding
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Close Button */}
        {status !== PaymentStatus.PROCESSING && status !== PaymentStatus.SUCCESS && (
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        )}

        <div className="bg-slate-50 p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Secure Payment
          </h2>
          <p className="text-sm text-slate-500 mt-1">Complete your payment to finalize the invoice.</p>
        </div>

        <div className="p-6">
          {status === PaymentStatus.SUCCESS ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-slate-800">Payment Successful!</h3>
              <p className="text-slate-500 mt-2">Generating your invoice now...</p>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex justify-between items-center font-semibold">
                <span>Total Amount</span>
                <span className="text-xl">${amount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === PaymentStatus.PROCESSING}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-6 ${
                  status === PaymentStatus.PROCESSING 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-primary hover:bg-blue-700 active:scale-95'
                }`}
              >
                {status === PaymentStatus.PROCESSING ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
            Encrypted by 256-bit SSL security. This is a simulation.
        </div>
      </div>
    </div>
  );
};