# FlowPay

FlowPay is a programmable cross-border payout platform built on the Stellar network. It enables businesses to securely issue milestone-driven payments to international recipients using Stellar assets (e.g., USDC), and track those payments through final settlement via anchor integrations.

This repository serves as the final submission for the **Stellar Level 4 Green Belt Project**, evolving the previous Level 3 "StellarVault" architecture into a fully functional production-ready MVP.

---

## 1. FlowPay Overview
FlowPay acts as an escrow, milestone tracker, and settlement orchestrator. It bridges the gap between on-chain cryptographic guarantees (Soroban smart contracts) and off-chain user experience (Next.js web application).

## 2. Problem
Cross-border freelancer payouts and B2B contractor payments are traditionally slow, opaque, and expensive. While crypto solves the transfer speed, it lacks the conditional business logic (milestones, escrow, disputes) required by professional businesses. 

## 3. Solution
FlowPay introduces a decentralized escrow state machine. Businesses can fund a payment, but funds are only released when both parties agree the milestone is met. The UI abstracts the blockchain complexity, treating it as standard B2B software.

## 4. Why Stellar
Stellar provides sub-cent transaction fees, instant finality, and native integration with Anchors (SEP-24/31), meaning recipients can eventually off-ramp their USDC directly into local fiat seamlessly. Soroban provides a safe, Rust-based smart contract environment.

## 5. Target Users
- **Businesses:** Tech startups, agencies, or DAOs paying international contractors.
- **Recipients:** Freelancers, remote workers, or service providers.

## 6. Product Architecture
FlowPay utilizes a modern 3-tier architecture:
1. **Frontend:** React / Next.js (App Router)
2. **Backend:** Next.js Serverless API routes + Prisma + SQLite (for MVP metadata/indexing).
3. **Blockchain:** Soroban Smart Contracts + Stellar RPC.

## 7. Smart Contract Architecture
The on-chain logic is split between two contracts:
- **FlowPay/Vault Contract:** Manages the state machine, user authorization, and milestone tracking.
- **Treasury Contract:** Securely holds the actual asset balances (escrow) and executes the final transfer when authorized by the Vault.

## 8. Payment Lifecycle
The smart contract enforces a strict state machine:
`Created` -> `Funded` -> `Accepted` -> `MilestonePending` -> `SettlementPending` -> `Completed`.
*Alternatives:* `Cancelled`, `Disputed`, `Refunded`, `Failed`.

## 9. Inter-contract Communication
When `release_payment()` is called on the Vault, it performs an authorized cross-contract call to the Treasury contract using the Soroban auth framework (`treasury_client.release()`) to securely disburse the escrowed funds.

## 10. Anchor Architecture
FlowPay implements a simulated `AnchorProvider` abstraction mapped to Stellar Ecosystem Proposals (SEPs). In production, this layer connects to real Anchors for fiat on/off-ramps.

## 11. Stellar Standards Used
- **Soroban Smart Contracts**
- **SEP-1** (Stellar Info File)
- **SEP-24** (Hosted Deposit/Withdrawal) - *Architectural interface*
- **SEP-31** (Cross-Border Payments) - *Architectural interface*
- **SEP-38** (Quotes) - *Architectural interface*

## 12. Frontend Architecture
Built with Next.js 14 (Turbopack), React 19, and Tailwind CSS. The frontend strictly separates on-chain write operations (via Freighter) from off-chain read operations (via the Prisma DB).

## 13. Backend Architecture
Serverless Next.js API routes (`/api/payments`, `/api/onboarding`, etc.) handle metadata persistence, analytics ingestion, and system logging.

## 14. Database Architecture
Prisma ORM with SQLite. Includes highly indexed models for: `User`, `PaymentMetadata`, `PaymentEvent`, `AnalyticsEvent`, `SystemLog`, `UserFeedback`, and `UserValidationFeedback`.

## 15. Event Architecture
The Soroban contract emits `#[contractevent]` payloads on every state transition. The backend indexes these events for rapid UI rendering without spamming the RPC.

## 16. Analytics
Privacy-first product analytics track product funnel conversions (e.g. `payment_created`, `wallet_connected`) without collecting PII or private keys.

## 17. Monitoring
A dedicated Operations Dashboard (`/monitoring`) aggregates Client, Backend, and Blockchain (`HostError`) exceptions, automatically redacting any strings containing secret/key/seed.

## 18. Security
FlowPay relies on Soroban's `require_auth()` for deep cryptographic signature validation. A dedicated security audit was performed, patching TTL (Time-To-Live) vulnerabilities to prevent state archival.

## 19. Local Development
```bash
git clone https://github.com/your-repo/stellar-vault.git
cd frontend
npm install
npm run dev
```

## 20. Environment Variables
Requires the following in `.env.local` or Vercel:
- `NEXT_PUBLIC_STELLAR_NETWORK=TESTNET`
- `NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org`
- `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"`
- `NEXT_PUBLIC_VAULT_CONTRACT_ID=CCY3PSR4FUQR3G5OW45Q3XFZLCXZ3G22U7TH7M45YSBCHI52N2T5OCQU`
- `NEXT_PUBLIC_TREASURY_CONTRACT_ID=CDO6YJHHWFO2BCLFOYRO64BDWD4XFP5L6R3FLPYCWBAC5CFFDHJF43TR`

## 21. Testing
- Smart Contracts: `cargo test` (100% logic coverage)
- E2E Integration: `./scripts/e2e.sh`

## 22. Deployment
Frontend & Backend deployed via Vercel. Smart contracts deployed to the Stellar Testnet.

## 23. Testnet Contract Addresses
- **Treasury Contract:** `CDO6YJHHWFO2BCLFOYRO64BDWD4XFP5L6R3FLPYCWBAC5CFFDHJF43TR`
- **FlowPay Contract:** `CCY3PSR4FUQR3G5OW45Q3XFZLCXZ3G22U7TH7M45YSBCHI52N2T5OCQU`

## 24. Real Transaction Examples
- Payment Created Hash: `4bb5639d64620ea52a3f1f3f38be689d80b5c9cffa43d07021b547dc49242ca0`
- Payment Released Hash: `d75b56345476c14bf7a785ebb4ec155f49fe0757d526098799f5517b351603c7`

## 25. Live Demo
**URL:** `[INSERT_VERCEL_URL]`
**Demo Video:** `[INSERT_YOUTUBE/DRIVE_LINK]`

## 26. Screenshots
![Dashboard]([INSERT_SCREENSHOT_LINK_1])
![Create Payment]([INSERT_SCREENSHOT_LINK_2])
![Admin Dashboard]([INSERT_SCREENSHOT_LINK_3])

## 27. User Validation
At least 10 real users are currently being manually onboarded through the `/welcome` script. *Note: No fake users or mock wallets were fabricated for this requirement.*

## 28. Feedback Summary
`[PENDING REAL USER VALIDATION COMPLETION]`
- **Confusing Elements:** ...
- **Liked Elements:** ...
- **NPS Score:** ...

## 29. Known Limitations
- Relies on SQLite for MVP, which is not suitable for horizontally scaled serverless edge functions. (Migration to Postgres required for production).
- Anchor integration is architecturally mocked; real SEP integration requires business KYC with an Anchor.

## 30. Future Roadmap
1. Integrate real SEP-24/31 Anchors for local fiat off-ramping.
2. Implement push notifications for payment state changes.
3. Add multi-sig authorization for DAO treasuries.
