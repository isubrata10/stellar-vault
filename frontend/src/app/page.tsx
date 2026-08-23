'use client';
import { useWallet } from '@/components/WalletProvider';
import { useStellarEvents } from '@/hooks/useStellarEvents';
import Link from 'next/link';

export default function Dashboard() {
  const { address } = useWallet();
  const { events, loading, error } = useStellarEvents();

  return (
    <div className="flex-col gap-4">
      <h1>Dashboard</h1>
      
      {!address ? (
        <div className="liquid-glass-card" style={{ textAlign: 'center', padding: '60px' }}>
           <h2>Welcome to StellarVault</h2>
           <p>Please connect your wallet to view your vaults and activities.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2">
           <div className="liquid-glass-card">
             <h3>Your Vaults</h3>
             <div style={{ padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', marginTop: '16px' }}>
               <p style={{ marginBottom: '16px' }}>You haven't created any vaults yet.</p>
               <Link href="/create">
                 <button className="btn-primary">Create Your First Vault</button>
               </Link>
             </div>
           </div>

           <div className="liquid-glass-card">
             <h3>Global Activity Feed</h3>
             {error && <p style={{ color: 'var(--error)', marginTop: '16px' }}>{error}</p>}
             {loading ? (
                <div className="animate-pulse flex-col gap-4 mt-4">
                  <div className="skeleton"></div>
                  <div className="skeleton"></div>
                  <div className="skeleton"></div>
                </div>
             ) : events.length === 0 ? (
                <p style={{ marginTop: '16px' }}>No recent activity detected on the network.</p>
             ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {events.slice(0, 5).map(e => (
                    <li key={e.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <p style={{ margin: 0, color: 'white' }}>{e.message}</p>
                      <small style={{ color: 'var(--accent-color)' }}>{new Date(e.timestamp).toLocaleString()}</small>
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
