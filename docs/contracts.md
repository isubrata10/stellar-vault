# Smart Contracts

FlowPay uses two distinct Soroban contracts:
1. **FlowPay (`CCY3PSR...`):** Manages the payment state machine (`Created` -> `Funded` -> `Accepted` -> `MilestonePending` -> `SettlementPending` -> `Completed`) and handles all `require_auth()` signature checks.
2. **Treasury (`CDO6YJH...`):** Holds the escrowed XLM/USDC and only releases funds when invoked by the FlowPay contract.
