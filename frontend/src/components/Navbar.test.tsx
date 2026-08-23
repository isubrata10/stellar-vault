/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from './Navbar';
import * as WalletProvider from './WalletProvider';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Navbar UI', () => {
  it('renders standard state when wallet is installed but disconnected', () => {
    vi.spyOn(WalletProvider, 'useWallet').mockReturnValue({
      address: null,
      isInstalled: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    render(<Navbar />);
    expect(screen.getByText('StellarVault')).toBeDefined();
    expect(screen.getByText('Connect Wallet')).toBeDefined();
  });

  it('renders connected state with shortened address', () => {
    vi.spyOn(WalletProvider, 'useWallet').mockReturnValue({
      address: 'GDX5QG6J54T2WZY7K2C',
      isInstalled: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    render(<Navbar />);
    expect(screen.getByText('GDX5...7K2C')).toBeDefined();
    expect(screen.getByText('Disconnect')).toBeDefined();
  });

  it('renders error state when wallet is not installed', () => {
    vi.spyOn(WalletProvider, 'useWallet').mockReturnValue({
      address: null,
      isInstalled: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    render(<Navbar />);
    expect(screen.getByText('Freighter Wallet Not Installed')).toBeDefined();
  });
});
