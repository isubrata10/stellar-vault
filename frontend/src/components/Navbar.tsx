'use client';
import { useWallet } from './WalletProvider';
import Link from 'next/link';

export function Navbar() {
  const { address, isInstalled, connect, disconnect } = useWallet();

  const shorten = (addr: string) => `${addr.slice(0,4)}...${addr.slice(-4)}`;

  return (
    <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
           <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>StellarVault</h2>
        </Link>
        <Link href="/create" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>Create Vault</Link>
      </div>
      
      <div>
        {!isInstalled ? (
           <span style={{ color: 'var(--error)' }}>Freighter Wallet Not Installed</span>
        ) : !address ? (
           <button className="btn-primary" onClick={connect}>Connect Wallet</button>
        ) : (
           <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
             <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{shorten(address)}</span>
             <button className="btn-secondary" onClick={disconnect}>Disconnect</button>
           </div>
        )}
      </div>
    </nav>
  );
}
