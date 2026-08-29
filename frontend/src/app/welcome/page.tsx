'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function WelcomeGuide() {
  const [address, setAddress] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'done'>('idle');

  const submitFeedback = async (e: any) => {
    e.preventDefault();
    setFeedbackStatus('submitting');
    const form = new FormData(e.target);
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        address,
        rating: parseInt(form.get('rating') as string),
        liked: form.get('liked'),
        confused: form.get('confused'),
        bugs: form.get('bugs'),
        features: form.get('features')
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    setFeedbackStatus('done');
  };

  return (
    <div className="min-h-screen p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Welcome to FlowPay</h1>
      <p className="text-xl text-gray-300 mb-8">The programmable cross-border payout platform built on Stellar.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md">
          <h2 className="text-2xl font-semibold mb-4">Stellar 101</h2>
          <ul className="space-y-4 text-sm text-gray-300">
            <li><strong>The Wallet:</strong> A browser extension (like Freighter) that securely holds your identity. We never see your private keys.</li>
            <li><strong>Signing:</strong> Approving a transaction via your wallet. It's like signing a digital check.</li>
            <li><strong>Testnet:</strong> A sandbox environment. The money isn't real, but the technology is exactly identical to production.</li>
            <li><strong>Fees:</strong> Stellar transactions cost fractions of a cent (paid in XLM).</li>
          </ul>
        </div>
        
        <div className="p-6 rounded-xl border bg-blue-500/10 border-blue-500/30 backdrop-blur-md">
          <h2 className="text-2xl font-semibold mb-4">Your Checklist</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-2"><input type="checkbox" disabled /> Connect Freighter Wallet</li>
            <li className="flex items-center gap-2"><input type="checkbox" disabled /> Fund your account (via Friendbot)</li>
            <li className="flex items-center gap-2"><input type="checkbox" disabled /> Create a Test Payment</li>
            <li className="flex items-center gap-2"><input type="checkbox" disabled /> Accept a Payment</li>
          </ul>
          <Link href="/" className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
            Go to Dashboard &rarr;
          </Link>
        </div>
      </div>

      <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md mb-8">
        <h2 className="text-2xl font-semibold mb-6">User Feedback</h2>
        {feedbackStatus === 'done' ? (
          <div className="p-4 bg-green-500/20 text-green-400 rounded">Thank you for your feedback! It helps us improve FlowPay.</div>
        ) : (
          <form onSubmit={submitFeedback} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Satisfaction Rating (1-5)</label>
              <input name="rating" type="number" min="1" max="5" required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">What did you like?</label>
              <textarea name="liked" rows={2} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">What was confusing?</label>
              <textarea name="confused" rows={2} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" />
            </div>
            <button type="submit" disabled={feedbackStatus === 'submitting'} className="bg-white text-black px-6 py-2 rounded font-medium hover:bg-gray-200 transition">
              {feedbackStatus === 'submitting' ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
