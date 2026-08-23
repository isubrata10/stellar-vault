'use client';
import { useWallet } from '@/components/WalletProvider';
import { useStellarEvents } from '@/hooks/useStellarEvents';
import Link from 'next/link';

export default function Dashboard() {
  const { address } = useWallet();
  const { events, loading, error } = useStellarEvents();

  return (
    <div className="flex-col gap-4">
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Overview of your decentralized treasury and real-time network activity.</p>
      </div>
      
      {!address ? (
        <div className="liquid-glass-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
           <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Welcome to StellarVault</h2>
           <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
             Enterprise-grade decentralized treasury management built on the Stellar Soroban network. 
             Secure multi-signature vaults, institutional compliance, and real-time transparent execution.
           </p>
           <p style={{ fontWeight: 600, color: 'var(--accent-color)' }}>Connect your Freighter wallet to initialize your secure session.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2" style={{ gap: '24px' }}>
             <div className="liquid-glass-card">
               <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Your Secure Vaults</h3>
               <div style={{ padding: '40px 20px', border: '1px dashed var(--border-color)', borderRadius: '12px', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                 <p style={{ marginBottom: '8px', fontWeight: 500 }}>No active vaults detected.</p>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Deploy a new smart contract vault to begin managing assets securely.</p>
                 <Link href="/create">
                   <button className="btn-primary">Deploy New Vault</button>
                 </Link>
               </div>
             </div>

             <div className="liquid-glass-card">
               <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Global Network Activity</h3>
               {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
               {loading ? (
                  <div className="animate-pulse flex-col gap-4">
                    <div className="skeleton"></div>
                    <div className="skeleton"></div>
                    <div className="skeleton"></div>
                  </div>
               ) : events.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Listening for Soroban RPC events...</p>
               ) : (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {events.slice(0, 5).map(e => (
                      <li key={e.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                        <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>{e.message}</p>
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>{new Date(e.timestamp).toLocaleString()}</small>
                      </li>
                    ))}
                  </ul>
               )}
             </div>
          </div>
        </>
      )}
    </div>
  );
}
