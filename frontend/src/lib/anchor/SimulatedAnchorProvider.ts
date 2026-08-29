import { AnchorProvider, AnchorInfo, AnchorAsset, QuoteRequest, QuoteResponse, TransactionStatus } from './types';

/**
 * SIMULATED ANCHOR PROVIDER (For MVP / Testing Only)
 * 
 * IMPORTANT: This implementation DOES NOT connect to a real Stellar Anchor (SEP).
 * It simulates responses to safely demonstrate the UI/UX of FlowPay's anchor integration boundary
 * without fabricating real transactions or risking actual funds.
 * 
 * The UI must clearly indicate when this Simulated adapter is being used.
 */
export class SimulatedAnchorProvider implements AnchorProvider {
  async getInfo(): Promise<AnchorInfo> {
    return {
      name: "[SIMULATED] FlowPay Test Anchor",
      contact_email: "test@flowpay.demo",
      currencies: await this.getAssets()
    };
  }

  async getAssets(): Promise<AnchorAsset[]> {
    return [
      {
        code: "USDC",
        issuer: "GBBD47IF6LWK7P7MDEVSCZA7CFYGLPMBOJDA2AAQ9TXROMR9F46TUSDC",
        status: "active",
        feeFixed: 1.0,
        feePercent: 0.5
      }
    ];
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    // Simulate a 1:1 conversion with a 1% mock fee
    const amount = parseFloat(request.sellAmount || "0");
    return {
      id: `quote_sim_${Date.now()}`,
      price: "1.00",
      totalPrice: (amount * 0.99).toFixed(2),
      expiresAt: new Date(Date.now() + 5 * 60000).toISOString()
    };
  }

  async initiateDeposit(assetCode: string, account: string): Promise<{ url: string; id: string }> {
    return {
      url: `https://demo-anchor.flowpay.local/deposit?account=${account}&asset=${assetCode}`,
      id: `txn_dep_${Date.now()}`
    };
  }

  async initiateWithdrawal(assetCode: string, account: string): Promise<{ url: string; id: string }> {
    return {
      url: `https://demo-anchor.flowpay.local/withdraw?account=${account}&asset=${assetCode}`,
      id: `txn_wd_${Date.now()}`
    };
  }

  async initiateCrossBorderPayment(params: { senderId: string; receiverId: string; assetCode: string; amount: string; }): Promise<{ id: string; stellarAccountId: string; stellarMemo: string; stellarMemoType: string; }> {
    return {
      id: `txn_cbp_${Date.now()}`,
      stellarAccountId: "GBBD47IF6LWK7P7MDEVSCZA7CFYGLPMBOJDA2AAQ9TXROMR9F46TUSDC", // Mock Anchor Escrow
      stellarMemo: Date.now().toString(),
      stellarMemoType: "id"
    };
  }

  async getTransactionStatus(id: string): Promise<TransactionStatus> {
    // In a real environment, this queries the SEP-24/SEP-31 transaction endpoints.
    return {
      id,
      status: "completed",
      amountIn: "100.00",
      amountOut: "99.00",
      message: "[SIMULATED] Transaction successfully completed."
    };
  }
}
