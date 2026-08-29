/**
 * FlowPay Domain Model
 * Defines the core entities and state transitions for the programmable cross-border payout platform.
 */

export enum PaymentState {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  ACCEPTED = 'ACCEPTED',
  MILESTONE_PENDING = 'MILESTONE_PENDING',
  MILESTONE_APPROVED = 'MILESTONE_APPROVED',
  SETTLEMENT_PENDING = 'SETTLEMENT_PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

/**
 * Maps a given state to the states it can legally transition into.
 * Prevents invalid state jumps.
 */
export const ValidStateTransitions: Record<PaymentState, PaymentState[]> = {
  [PaymentState.CREATED]: [PaymentState.FUNDED, PaymentState.CANCELLED],
  [PaymentState.FUNDED]: [PaymentState.ACCEPTED, PaymentState.CANCELLED],
  [PaymentState.ACCEPTED]: [PaymentState.MILESTONE_PENDING, PaymentState.SETTLEMENT_PENDING, PaymentState.DISPUTED],
  [PaymentState.MILESTONE_PENDING]: [PaymentState.MILESTONE_APPROVED, PaymentState.DISPUTED],
  [PaymentState.MILESTONE_APPROVED]: [PaymentState.SETTLEMENT_PENDING, PaymentState.DISPUTED],
  [PaymentState.SETTLEMENT_PENDING]: [PaymentState.COMPLETED, PaymentState.FAILED, PaymentState.DISPUTED],
  [PaymentState.COMPLETED]: [],
  [PaymentState.CANCELLED]: [],
  [PaymentState.DISPUTED]: [PaymentState.REFUNDED, PaymentState.COMPLETED],
  [PaymentState.REFUNDED]: [],
  [PaymentState.FAILED]: [PaymentState.REFUNDED, PaymentState.DISPUTED],
};

export interface User {
  id: string; // Internal DB ID
  walletAddress: string; // Stellar G-address
  role: 'BUSINESS' | 'RECIPIENT' | 'ADMIN';
  createdAt: number;
}

export interface Business extends User {
  role: 'BUSINESS';
  companyName?: string;
}

export interface Recipient extends User {
  role: 'RECIPIENT';
  displayName?: string;
  preferredCurrency?: string;
}

export interface Milestone {
  id: string;
  description: string;
  isApproved: boolean;
  approvedAt?: number;
  approvedBy?: string; // Wallet address of the approver (usually Business)
}

export interface PaymentParticipant {
  walletAddress: string;
  role: 'PAYER' | 'PAYEE' | 'ARBITRATOR';
  hasAccepted: boolean;
}

export interface Payment {
  id: string; // Smart contract generated ID or DB ID
  onChainId?: string; // Contract mapped ID
  state: PaymentState;
  amount: string; // String to avoid precision loss (e.g. '100.50')
  assetCode: string; // e.g., 'USDC' or 'XLM'
  assetIssuer?: string; // Required if not native XLM
  
  participants: PaymentParticipant[];
  milestones: Milestone[];
  
  createdAt: number;
  updatedAt: number;
}

export interface Settlement {
  id: string;
  paymentId: string;
  settledAmount: string;
  settledCurrency: string; // Fiat or asset delivered by anchor
  transactionHash: string; // On-chain proof of settlement execution
  settledAt: number;
}

export interface Transaction {
  hash: string;
  paymentId: string;
  type: 'FUND' | 'ACCEPT' | 'APPROVE_MILESTONE' | 'SETTLE' | 'REFUND';
  submittedBy: string; // Wallet address
  timestamp: number;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  previousState?: PaymentState;
  newState: PaymentState;
  triggeredBy: string; // Wallet address or system oracle
  timestamp: number;
  metadata?: Record<string, unknown>;
}
