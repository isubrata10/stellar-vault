'use client';
import { useEffect, useState } from 'react';
import { useWallet } from '@/components/WalletProvider';
import Link from 'next/link';
import { Activity, CreditCard, Plus } from 'lucide-react';

interface Payment {
  id: string;
  title: string;
  description: string;
  recipientAddress: string;
  createdAt: string;
  milestoneDesc: string | null;
}

export default function Dashboard() {
  const { address } = useWallet();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (address) {
      const fetchPayments = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/payments?user=${address}`);
          const data = await res.json();
          if (data.success) {
            setPayments(data.data);
          } else {
            setError(data.error || 'Failed to fetch payments');
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Unknown error');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchPayments();
    }
  }, [address]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">FlowPay Dashboard</h1>
        <p className="text-gray-400">Overview of your decentralized treasury and active payouts.</p>
      </div>
      
      {!address ? (
        <div className="liquid-glass-card text-center py-20 px-8 rounded-2xl border border-white/10 bg-black/20">
           <h2 className="text-4xl font-bold mb-4">Welcome to FlowPay</h2>
           <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
             Enterprise-grade decentralized treasury management built on the Stellar Soroban network. 
             Secure multi-signature vaults, institutional compliance, and real-time transparent execution.
           </p>
           <p className="font-semibold text-blue-500">Connect your Freighter wallet to initialize your secure session.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="liquid-glass-card flex items-center gap-4 p-6 rounded-xl border border-white/10 bg-black/20">
               <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                 <CreditCard className="w-8 h-8" />
               </div>
               <div>
                 <p className="text-gray-400 text-sm">Total Payments</p>
                 <h3 className="text-2xl font-bold">{payments.length}</h3>
               </div>
             </div>
             
             <div className="liquid-glass-card flex items-center gap-4 p-6 rounded-xl border border-white/10 bg-black/20">
               <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
                 <Activity className="w-8 h-8" />
               </div>
               <div>
                 <p className="text-gray-400 text-sm">Active Payments</p>
                 <h3 className="text-2xl font-bold">{payments.length}</h3>
               </div>
             </div>

             <div className="liquid-glass-card flex items-center justify-center p-6 rounded-xl border border-dashed border-white/20 bg-black/20 hover:bg-white/5 transition-colors cursor-pointer">
               <Link href="/create" className="flex items-center gap-2 text-blue-400 font-semibold text-lg">
                 <Plus className="w-6 h-6" />
                 Create New Payout
               </Link>
             </div>
          </div>

          <div className="liquid-glass-card rounded-xl border border-white/10 p-6 bg-black/20 mt-4">
             <h3 className="text-xl font-semibold mb-6 border-b border-white/10 pb-4">Active Payouts</h3>
             {error && <p className="text-red-500 mb-4">{error}</p>}
             {loading ? (
                <div className="animate-pulse flex flex-col gap-4">
                  <div className="h-16 bg-white/5 rounded-lg w-full"></div>
                  <div className="h-16 bg-white/5 rounded-lg w-full"></div>
                  <div className="h-16 bg-white/5 rounded-lg w-full"></div>
                </div>
             ) : payments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 mb-4">No active payouts found.</p>
                  <Link href="/create">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Create your first payout
                    </button>
                  </Link>
                </div>
             ) : (
                <ul className="flex flex-col gap-3">
                  {payments.map(p => (
                    <li key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-lg border-l-4 border-blue-500 gap-4">
                      <div>
                        <h4 className="font-semibold text-lg">{p.title}</h4>
                        <p className="text-sm text-gray-400">{p.description || 'No description provided'}</p>
                        <div className="text-xs text-gray-500 mt-2 font-mono break-all">
                          To: {p.recipientAddress}
                        </div>
                      </div>
                      <div className="flex flex-col md:items-end gap-2">
                        <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                        {p.milestoneDesc && (
                          <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">Milestone: {p.milestoneDesc}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
