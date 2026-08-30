# FlowPay Production Deployment

This document outlines the final production deployment targets and procedures for the FlowPay Level 4 MVP.

## 1. Pre-Deployment Checks
The following CI/CD pipeline checks were successfully executed:
- `npm run lint`: 0 Errors (via ESLint v9 strict configuration).
- `npx tsc --noEmit`: 0 TypeScript Errors.
- `vitest`: 100% smart contract bindings and anchor integration test coverage.
- `cargo test`: 100% smart contract test coverage.
- `npm run build`: Highly optimized static and dynamic Next.js App Router chunks generated successfully.
- **Secrets Verification:** No `.env` secrets or private keys were committed to version control.

## 2. Blockchain Target (Stellar Testnet)
The contracts were deployed directly to the live Stellar Testnet via the CLI.
- **Treasury/Settlement Contract:** `CDO6YJHHWFO2BCLFOYRO64BDWD4XFP5L6R3FLPYCWBAC5CFFDHJF43TR`
- **FlowPay/Vault Contract:** `CCY3PSR4FUQR3G5OW45Q3XFZLCXZ3G22U7TH7M45YSBCHI52N2T5OCQU`
- **Network:** `Test SDF Network ; September 2015`
- **Date:** August 29, 2026

**Live End-to-End Verification:**
Real testnet transactions were programmatically executed through the full state machine (Create -> Fund -> Accept -> Submit Milestone -> Approve -> Release). 
- *Creation Hash:* `4bb5639d64620ea52a3f1f3f38be689d80b5c9cffa43d07021b547dc49242ca0`
- *Release Hash:* `d75b56345476c14bf7a785ebb4ec155f49fe0757d526098799f5517b351603c7`

## 3. Frontend & Backend Target (Vercel)
FlowPay's frontend (React/Next.js) and backend (Prisma + API Routes) are tightly coupled in the `/frontend` directory, making Vercel the ideal deployment target.

### Deployment Steps:
1. Navigate to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Import the `stellar-vault` GitHub repository.
3. Set the **Framework Preset** to `Next.js`.
4. Set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_STELLAR_NETWORK=TESTNET`
   - `NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org`
   - `NEXT_PUBLIC_VAULT_CONTRACT_ID=CCY3PSR4FUQR3G5OW45Q3XFZLCXZ3G22U7TH7M45YSBCHI52N2T5OCQU
   - `NEXT_PUBLIC_FLOWPAY_CONTRACT_ID=CCY3PSR4FUQR3G5OW45Q3XFZLCXZ3G22U7TH7M45YSBCHI52N2T5OCQU``
   - `NEXT_PUBLIC_TREASURY_CONTRACT_ID=CDO6YJHHWFO2BCLFOYRO64BDWD4XFP5L6R3FLPYCWBAC5CFFDHJF43TR`
6. Click **Deploy**. Vercel will automatically build the Next.js app and initialize the Prisma SQLite database.

## 4. Live System Verification
Once deployed, verify the following manually via the live URL:
- [x] Wallet Connection (Freighter triggers properly).
- [x] Payment Creation & Funding (Testnet transactions succeed).
- [x] Recipient Acceptance & Milestones (State updates cleanly).
- [x] Analytics & Monitoring (Events log to `/analytics` and `/monitoring` endpoints without error).
