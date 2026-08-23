'use client';
import { useState } from 'react';
import { useWallet } from '@/components/WalletProvider';
import Link from 'next/link';

import { invokeContract, VAULT_CONTRACT } from '@/lib/stellar-client';
import { Address } from '@stellar/stellar-sdk';

export default function CreateVault() {
  const { address } = useWallet();
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setError('');
    setStatus('preparing');
    
    try {
        await invokeContract({
            contractId: VAULT_CONTRACT,
            method: 'create_vault',
            args: [
                Address.fromString(address).toScVal(),
                Address.fromString("CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC").toScVal() // XLM Token
            ],
            publicKey: address,
            onStatus: (s) => setStatus(s)
        });
    } catch (e: any) {
        setError(e.message || 'Unknown error');
        setStatus('failed');
    }
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
