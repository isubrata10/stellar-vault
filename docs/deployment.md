# StellarVault Testnet Deployment

**Network:** Testnet
**Deployment Date:** 2026-08-23T08:36:07Z

## Contract Addresses

* **Vault Contract:** `CDPTEKB44IWV2Z5CIXZYKJYV7YP76MOTYTD5W5NSQQIRXSMSDPEH765X`
* **Treasury Contract:** `CAS346MW4MUEOKQ6LHB2C5RFAOUDNY3B3NZS5XAYYI2BTFGIVP5UXXST`
* **Test Token (XLM SAC):** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
* **Admin Identity:** `GDK5YHHLMYPBQXGDLLSACHMI46USATF2G2X4X2E2SWK4JOEKFDMF2IK6`

## Deployment Process

1. Built optimized WASM (`wasm32v1-none`).
2. Deployed Treasury to Testnet.
3. Deployed Vault to Testnet.
4. Linked Vault to Treasury (`Treasury.initialize(Vault)`).
5. Linked Treasury to Vault (`Vault.initialize(Admin, Treasury)`).

## Example Invocation

We successfully created the first Vault instance on-chain.
The invocation completed successfully, verifying the authorization and inter-contract linkages are live.

*See GitHub Actions or CLI logs for detailed transaction hashes.*
