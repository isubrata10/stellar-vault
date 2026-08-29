'use client';
import { useState } from 'react';
import { useWallet } from '@/components/WalletProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { invokeContract, FLOWPAY_CONTRACT } from '@/lib/stellar-client';
import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function CreatePayment() {
  const { address } = useWallet();
  const router = useRouter();
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // Default testnet token
    title: '',
    description: '',
    milestoneText: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setError('');
    setStatus('preparing');
    
    try {
        const hasMilestone = formData.milestoneText.trim().length > 0;
        const amountInt = parseInt(formData.amount, 10);
        if (isNaN(amountInt) || amountInt <= 0) {
            throw new Error("Invalid amount");
        }

        await invokeContract({
            contractId: FLOWPAY_CONTRACT,
            method: 'create_payment',
            args: [
                Address.fromString(address).toScVal(),
                Address.fromString(formData.recipient).toScVal(),
                Address.fromString(formData.asset).toScVal(),
                nativeToScVal(amountInt, { type: 'i128' }),
                nativeToScVal(hasMilestone, { type: 'bool' })
            ],
            publicKey: address,
            onStatus: (s) => setStatus(s)
        });

        const txHash = crypto.randomUUID();

        setStatus('saving');

        const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: txHash,
                businessAddress: address,
                recipientAddress: formData.recipient,
                title: formData.title,
                description: formData.description,
                milestoneDesc: formData.milestoneText
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to save payment metadata');
        }

        setStatus('success');
        
        setTimeout(() => {
            router.push('/');
        }, 2000);

    } catch (err: unknown) {
        console.error("Payment error:", err);
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Unknown error occurred');
        }
        setStatus('failed');
    }
  };

  if (!address) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="liquid-glass-card text-center p-12 rounded-2xl border border-white/10 max-w-md w-full bg-black/20">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Wallet Required</h2>
          <p className="text-gray-400 mb-6">Please connect your Freighter wallet to create a payment.</p>
          <Link href="/">
             <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-medium transition-colors w-full">
               Go Back
             </button>
          </Link>
        </div>
      </div>
    );
  }

  const renderStatusBox = () => {
    if (status === 'idle') return null;

    const steps = [
        { key: 'preparing', label: 'PREPARING', description: 'Building transaction' },
        { key: 'wallet interaction', label: 'WAITING FOR WALLET', description: 'Please sign in your wallet' },
        { key: 'submitted', label: 'SUBMITTING', description: 'Sending to network' },
        { key: 'confirmed', label: 'CONFIRMING', description: 'Waiting for ledger confirmation' },
        { key: 'saving', label: 'SAVING METADATA', description: 'Saving details to database' },
        { key: 'success', label: 'SUCCESS', description: 'Payment created successfully' }
    ];

    if (status === 'failed') {
        return (
            <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Transaction Failed</span>
                </div>
                <p className="text-sm">{error}</p>
                <button 
                    type="button"
                    onClick={() => { setStatus('idle'); setError(''); }}
                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-white/10">
            <h3 className="font-semibold mb-4 text-gray-300">Transaction Status</h3>
            <div className="flex flex-col gap-3">
                {steps.map((step, idx) => {
                    const isPast = steps.findIndex(s => s.key === status) > idx || status === 'success';
                    const isCurrent = step.key === status;
                    
                    return (
                        <div key={step.key} className={`flex items-center gap-3 ${isPast || isCurrent ? 'text-white' : 'text-gray-600'}`}>
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                {isPast ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                                )}
                            </div>
                            <div>
                                <div className={`font-medium text-sm ${isCurrent ? 'text-blue-400' : ''}`}>
                                    {step.label}
                                </div>
                                {isCurrent && (
                                    <div className="text-xs text-gray-400 mt-0.5">{step.description}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const isProcessing = status !== 'idle' && status !== 'failed';

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="liquid-glass-card rounded-2xl border border-white/10 p-6 md:p-8 bg-black/20">
        <h2 className="text-2xl font-bold mb-2">Create New Payment</h2>
        <p className="text-gray-400 mb-8">Setup a new secure payout or milestone-based payment.</p>
        
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1.5">Payment Title</label>
             <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors" 
                placeholder="e.g. Q3 Marketing Services" 
                required 
                disabled={isProcessing} 
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1.5">Recipient Address</label>
                 <input 
                    type="text" 
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm" 
                    placeholder="GABC..." 
                    required
                    disabled={isProcessing} 
                 />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount</label>
                 <input 
                    type="number" 
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors" 
                    placeholder="1000" 
                    required
                    min="1"
                    disabled={isProcessing} 
                 />
              </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1.5">Asset Contract ID</label>
             <input 
                type="text" 
                name="asset"
                value={formData.asset}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm" 
                placeholder="C..." 
                required
                disabled={isProcessing} 
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (Optional)</label>
             <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none" 
                placeholder="Details about this payment..." 
                rows={3}
                disabled={isProcessing} 
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1.5">Milestone Requirements (Optional)</label>
             <textarea 
                name="milestoneText"
                value={formData.milestoneText}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none" 
                placeholder="Describe deliverables needed to unlock payment..." 
                rows={2}
                disabled={isProcessing} 
             />
          </div>

          {status === 'idle' && (
            <button 
                type="submit" 
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2" 
            >
                Create Payment
            </button>
          )}

          {renderStatusBox()}
        </form>
      </div>
    </div>
  );
}
