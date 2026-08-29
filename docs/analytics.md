# FlowPay Analytics & Privacy Policy

FlowPay incorporates a privacy-first analytics pipeline designed exclusively to measure product health, feature conversion, and user journey bottlenecks. 

### What We Collect
- **Anonymous Events**: Funnel progression events such as `landing_page_viewed`, `wallet_connected`, `payment_creation_started`, and `payment_completed`.
- **Session IDs**: Ephemeral, randomly generated UUIDs stored in `sessionStorage` strictly to calculate funnel conversion rates across a single visit.
- **Success/Failure Rates**: Transaction states (e.g. `insufficient_balance`, `user_rejected`) to monitor network and UX health.

### What We DO NOT Collect
- **Private Keys**: We never prompt for, intercept, or log private keys. All signing occurs securely within the user's local wallet extension (e.g., Freighter).
- **Financial Balances**: We do not index or track the user's total wallet balances.
- **Personally Identifiable Information (PII)**: We do not collect names, IPs, or device fingerprints.

### Why We Collect It
The data is collected strictly to demonstrate real usage and calculate product adoption metrics (e.g., Daily Active Users, Feature Drop-off) necessary for MVP validation and continuous UI improvement.
