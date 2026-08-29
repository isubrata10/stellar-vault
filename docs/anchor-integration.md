# Anchor Integration Architecture

FlowPay implements an `AnchorProvider` TypeScript abstraction mapping the UI to standard Stellar Ecosystem Proposals (SEPs). 

For the MVP, a `SimulatedAnchorProvider` is used to prevent requiring users to KYC for fiat off-ramps during testing, while perfectly modeling the async behavior of:
- **SEP-24:** Hosted Deposit/Withdrawal
- **SEP-31:** Cross-Border Payments
- **SEP-38:** Quotes
