/**
 * AnchorProvider Interface
 * Defines the contract for integrating with Stellar Ecosystem Proposals (SEPs).
 * Supports SEP-24 (Deposit/Withdrawal), SEP-31 (Cross-Border Payments), and SEP-38 (Quotes).
 */
export interface AnchorInfo {
  name: string;
  contact_email?: string;
  currencies: AnchorAsset[];
}

export interface AnchorAsset {
  code: string;
  issuer: string;
  status: 'active' | 'inactive';
  feeFixed?: number;
  feePercent?: number;
}

export interface QuoteRequest {
  sellAsset: string;
  buyAsset: string;
  sellAmount?: string;
  buyAmount?: string;
}

export interface QuoteResponse {
  id: string;
  price: string;
  totalPrice: string;
  expiresAt: string;
}

export interface TransactionStatus {
  id: string;
  status: 'pending_sender' | 'pending_stellar' | 'pending_customer_info_update' | 'pending_receiver' | 'pending_external' | 'completed' | 'error';
  amountIn: string;
  amountOut: string;
  message?: string;
}

export interface AnchorProvider {
  /** SEP-1: Get stellar.toml info */
  getInfo(): Promise<AnchorInfo>;
  
  /** SEP-24 / SEP-31: Get supported assets */
  getAssets(): Promise<AnchorAsset[]>;
  
  /** SEP-38: Get FX quote */
  getQuote(request: QuoteRequest): Promise<QuoteResponse>;
  
  /** SEP-24: Initiate deposit (Fiat -> Stellar) */
  initiateDeposit(assetCode: string, account: string): Promise<{ url: string; id: string }>;
  
  /** SEP-24: Initiate withdrawal (Stellar -> Fiat) */
  initiateWithdrawal(assetCode: string, account: string): Promise<{ url: string; id: string }>;
  
  /** SEP-31: Initiate B2B cross border payment */
  initiateCrossBorderPayment(params: {
    senderId: string;
    receiverId: string;
    assetCode: string;
    amount: string;
  }): Promise<{ id: string; stellarAccountId: string; stellarMemo: string; stellarMemoType: string }>;
  
  /** Query transaction status across SEPs */
  getTransactionStatus(id: string): Promise<TransactionStatus>;
}
