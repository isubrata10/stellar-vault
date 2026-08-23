# Testing Strategy

StellarVault is tested across two primary domains: the smart contract backend and the React frontend.

## Smart Contract Testing (Rust)

We utilize Soroban's native test environment to simulate the ledger locally. 

**Run tests:**
```bash
cargo test --workspace
```

### Coverage
- **Treasury Tests (`contracts/treasury/src/test.rs`)**: 
  - Verifies initialization parameters.
  - Ensures unauthorized entities (including random addresses) cannot trigger the `release` function.
  - Ensures correct SAC token transfers occur when properly invoked.
- **Vault Tests (`contracts/vault/src/test.rs`)**:
  - Verifies the full lifecycle of a vault.
  - Simulates multiple actors (`creator`, `participant`, `stranger`) to enforce authorization bounds.
  - Tests the withdrawal multi-sig consensus logic (ensures rejection if approvals are missing).
  - Tests the inter-contract forward call to the Treasury.

## Frontend Testing (Vitest + JSDOM)

We utilize Vitest due to its superior compatibility with ES Modules, which is required by `@stellar/stellar-sdk`.

**Run tests:**
```bash
cd frontend
npx vitest run
```

### Coverage
- **Component Tests (`Navbar.test.tsx`)**:
  - Simulates React Context states (wallet connected, disconnected, not installed).
  - Verifies UI accurately reflects truncated wallet addresses.
- **Utility Tests (`eventParser.test.ts`)**:
  - Injects raw Base64 XDR events mimicking the Stellar RPC.
  - Verifies the parsing logic correctly unwraps Soroban `ScVal` structures into native JavaScript arrays and objects.
