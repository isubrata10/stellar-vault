'use client';
import { useState } from 'react';
import { useWallet } from '@/components/WalletProvider';
import Link from 'next/link';

export default function CreateVault() {
  const { address } = useWallet();
  const [status, setStatus] = useState<'idle' | 'preparing' | 'signing' | 'submitting' | 'confirmed' | 'failed'>('idle');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('preparing');
    
    // Mocking transaction for Phase 5 UI demonstration
    // Since full Soroban integration requires complex XDR building, we mock the UI flow here.
    setTimeout(() => setStatus('signing'), 1000);
    setTimeout(() => setStatus('submitting'), 2500);
    setTimeout(() => setStatus('confirmed'), 4000);
  };

  if (!address) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <h2>Wallet Required</h2>
        <p>Please connect your Freighter wallet to create a vault.</p>
        <Link href="/">
           <button className="btn-secondary mt-4">Go Back</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Create New Vault</h2>
      <p style={{ marginBottom: '24px' }}>Setup a new secure escrow or savings vault.</p>
      
      <form onSubmit={handleCreate} className="flex-col gap-4">
        <div>
           <label style={{ display: 'block', marginBottom: '8px' }}>Vault Name</label>
           <input type="text" className="input-field" placeholder="e.g. Vacation Fund" required disabled={status !== 'idle' && status !== 'failed'} />
        </div>
        
        <div>
           <label style={{ display: 'block', marginBottom: '8px' }}>Initial Participants (Comma separated addresses)</label>
           <input type="text" className="input-field" placeholder="GABC..., GXYZ..." disabled={status !== 'idle' && status !== 'failed'} />
        </div>

        {error && <div style={{ color: 'var(--error)' }}>{error}</div>}
        
        <button 
          type="submit" 
          className="btn-primary mt-4" 
          disabled={status !== 'idle' && status !== 'failed'}
        >
          {status === 'idle' ? 'Create Vault on Blockchain' : 
           status === 'confirmed' ? 'Successfully Created!' : 
           `Transaction Status: ${status.toUpperCase()}...`}
        </button>

        {status === 'confirmed' && (
           <Link href="/" style={{ textAlign: 'center', display: 'block', marginTop: '16px', color: 'var(--accent-color)' }}>
             Return to Dashboard
           </Link>
        )}
      </form>
    </div>
  );
}
