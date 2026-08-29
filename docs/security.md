# FlowPay Smart Contract Security & Optimization Audit

A dedicated security and optimization review was conducted on the FlowPay and Treasury smart contracts.

## 1. Critical Issues
*   **None discovered.** The contract strictly enforces the `require_auth()` host function to validate signatures before executing any state transitions. 

## 2. High Issues
*   **Missing TTL Bumps [Storage/Expiration]:** Soroban implements state archiving. The FlowPay contract uses `persistent` storage for payments and `instance` storage for the admin/treasury addresses, but fails to call `bump()`. This means that if a payment is inactive for too long, the ledger entry will expire and become archived, rendering the contract unusable until manually restored. 
    *   **Fix:** Add `env.storage().instance().bump()` and `env.storage().persistent().bump()` calls upon initialization and state transitions.

## 3. Medium Issues
*   **Event Macros Not Used [Standardization]:** The contract manually emits events via `env.events().publish(...)`, which triggers a compiler warning for being deprecated. Soroban best practices dictate using the `#[contractevent]` macro.
    *   **Fix:** Refactor event emission to comply with standard Soroban v26 SDK macros, or acknowledge the warning if avoiding structural rewrites for the MVP.

## 4. Low Issues
*   **Cancellation State Lock:** A business can `cancel_payment` if the state is `Created` or `Funded`. However, if the recipient has `Accepted` the payment but goes unresponsive, the business cannot cancel directly. They must use the `raise_dispute` flow. While functionally complete, this introduces friction.
    *   **Fix:** Acknowledge as an intended dispute mechanism for MVP.

## 5. Optimization Opportunities
*   **Storage Access Optimization:** `DataKey::Treasury` is retrieved from instance storage on every `release_payment` call. While instance storage is cheap, ensuring the instance is bumped simultaneously minimizes redundant I/O.
*   **Contract Binary Size:** `lto = true` and `opt-level = "z"` are already configured in `Cargo.toml`. No further binary stripping is required.

## Post-Audit Actions
The High issue regarding Storage TTL (Time To Live) bumping will be actively patched in `contracts/vault/src/lib.rs` and the tests will be rerun.
