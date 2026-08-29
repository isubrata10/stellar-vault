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
    await fetch('/api/validation-feedback', {
      method: 'POST',
      body: JSON.stringify({
        address,
        confusing: form.get('confusing'),
        expected: form.get('expected'),
        liked: form.get('liked'),
        wouldChange: form.get('wouldChange'),
        useAgain: form.get('useAgain') === 'yes',
        recommend: form.get('recommend') === 'yes',
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    setFeedbackStatus('done');
  };

  return (
    <div className="min-h-screen p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">FlowPay User Testing</h1>
      <p className="text-xl text-gray-300 mb-8">Welcome to the 5-Minute Validation Test.</p>

      <div className="grid grid-cols-1 gap-8 mb-12">
        <div className="p-6 rounded-xl border bg-blue-500/10 border-blue-500/30 backdrop-blur-md">
          <h2 className="text-2xl font-semibold mb-4">Your Testing Script</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-200">
            <li><strong>Connect wallet:</strong> Click the connect button top right.</li>
            <li><strong>Create a payment:</strong> Navigate to Dashboard, click Create Payment, fill out the details.</li>
            <li><strong>Fund the payment:</strong> Sign the transaction to escrow funds on the Testnet.</li>
            <li><strong>Open the payment as recipient:</strong> View the payment details.</li>
            <li><strong>Accept/complete the payment flow:</strong> Accept the terms, submit milestone, and release.</li>
            <li><strong>View transaction history:</strong> Look at the activity log.</li>
            <li><strong>Find the payment status:</strong> Ensure it says "Completed".</li>
          </ol>
          <Link href="/" className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
            Start Script &rarr;
          </Link>
        </div>
      </div>

      <div className="p-6 rounded-xl border bg-black/20 border-white/10 backdrop-blur-md mb-8">
        <h2 className="text-2xl font-semibold mb-6">Validation Feedback Form</h2>
        {feedbackStatus === 'done' ? (
          <div className="p-4 bg-green-500/20 text-green-400 rounded">Thank you for validating FlowPay!</div>
        ) : (
          <form onSubmit={submitFeedback} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">1. What was confusing?</label>
              <textarea name="confusing" rows={2} required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">2. What did you expect to happen?</label>
              <textarea name="expected" rows={2} required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">3. What did you like?</label>
              <textarea name="liked" rows={2} required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">4. What would you change?</label>
              <textarea name="wouldChange" rows={2} required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">5. Would you use FlowPay again?</label>
                <select name="useAgain" className="w-full bg-gray-900 border border-white/10 rounded p-2 text-white">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">6. Would you recommend it?</label>
                <select name="recommend" className="w-full bg-gray-900 border border-white/10 rounded p-2 text-white">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={feedbackStatus === 'submitting'} className="bg-white text-black px-6 py-2 rounded font-medium hover:bg-gray-200 transition mt-4">
              {feedbackStatus === 'submitting' ? 'Submitting...' : 'Complete Validation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
