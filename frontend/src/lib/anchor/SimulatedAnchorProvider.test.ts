import { describe, it, expect } from 'vitest';
import { SimulatedAnchorProvider } from './SimulatedAnchorProvider';

describe('SimulatedAnchorProvider', () => {
  const provider = new SimulatedAnchorProvider();

  it('should return simulated anchor info', async () => {
    const info = await provider.getInfo();
    expect(info.name).toContain('[SIMULATED]');
    expect(info.currencies.length).toBeGreaterThan(0);
  });

  it('should return simulated assets', async () => {
    const assets = await provider.getAssets();
    expect(assets[0].code).toBe('USDC');
    expect(assets[0].status).toBe('active');
  });

  it('should return a simulated quote', async () => {
    const quote = await provider.getQuote({
      sellAsset: 'USDC',
      buyAsset: 'USD',
      sellAmount: '100'
    });
    expect(quote.price).toBe('1.00');
    expect(quote.totalPrice).toBe('99.00'); // Simulated 1% fee
    expect(quote.id).toBeDefined();
  });

  it('should simulate a cross border payment initiation', async () => {
    const result = await provider.initiateCrossBorderPayment({
      senderId: 'user1',
      receiverId: 'user2',
      assetCode: 'USDC',
      amount: '100'
    });
    expect(result.id).toBeDefined();
    expect(result.stellarMemoType).toBe('id');
  });

  it('should return a simulated completed transaction status', async () => {
    const status = await provider.getTransactionStatus('txn_123');
    expect(status.id).toBe('txn_123');
    expect(status.status).toBe('completed');
    expect(status.message).toContain('[SIMULATED]');
  });
});
