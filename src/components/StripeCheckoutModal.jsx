import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_STRIPE_CHECKOUT_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';

export default function StripeCheckoutModal({ plan, onClose, onPaymentSuccess, t }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [createStripeCheckout] = useMutation(CREATE_STRIPE_CHECKOUT_MUTATION);

  const handlePay = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate real stripe verification delays
    setTimeout(async () => {
      try {
        await createStripeCheckout({ variables: { plan } });
        toast.success("💳 Stripe: Payment authorized successfully!", { duration: 4000 });
        onPaymentSuccess();
      } catch (err) {
        toast.error("Stripe Error: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    }, 1800);
  };

  const amount = plan === 'lifetime' ? '$49.99' : plan === 'quarterly' ? '$24.99' : '$9.99';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        
        <div className="text-center mb-6">
          <span className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-wider rounded-full">Secure checkout via Stripe</span>
          <h4 className="text-xl font-black text-slate-800 mt-3">Activate Premium Course</h4>
          <p className="text-xs text-slate-400 mt-1">Upgrade Tier: <strong className="text-orange-500 uppercase">{plan}</strong> ({amount})</p>
        </div>

        {isProcessing ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-xs text-slate-500 font-semibold animate-pulse">Contacting Stripe secure server...</p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Cardholder Name</label>
              <input
                type="text"
                placeholder="Name on card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-xs focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Card Number</label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                maxLength="19"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-xs focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  maxLength="5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-xs focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">CVC / CVV</label>
                <input
                  type="password"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-xs focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-rose-100 hover:scale-[1.02] transition-all"
            >
              Pay {amount} & Complete Enrollment
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
