# Testing Strategy

FlowPay is tested at three layers:
1. **Unit Tests (Rust):** High-coverage tests executing the contract logic (`cargo test`).
2. **Integration Tests (E2E):** Automated Stellar CLI shell scripts (`scripts/e2e.sh`) that deploy, fund, and transition a payment on the public Testnet.
3. **User Validation:** Real human testers executing the 5-minute script (`docs/user_testing_script.md`) via the Vercel deployment.
