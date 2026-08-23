# StellarVault Testnet Deployment

## Network Information
* **Network:** Stellar Testnet
* **Deployment Date:** 2026-08-23T08:35:00Z
* **Network Passphrase:** `Test SDF Network ; September 2015`

## Contract Addresses

| Component | Contract ID / Address |
|-----------|----------------------|
| **Vault Contract** | `CDPTEKB44IWV2Z5CIXZYKJYV7YP76MOTYTD5W5NSQQIRXSMSDPEH765X` |
| **Treasury Contract** | `CAS346MW4MUEOKQ6LHB2C5RFAOUDNY3B3NZS5XAYYI2BTFGIVP5UXXST` |
| **Test Token (XLM SAC)** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| **Admin Identity** | `GDK5YHHLMYPBQXGDLLSACHMI46USATF2G2X4X2E2SWK4JOEKFDMF2IK6` |

## Deployment Process

The deployment was fully automated via `scripts/deploy.sh`. The sequential workflow was:

1. **WASM Compilation:** Compiled both Vault and Treasury contracts optimized for the `wasm32v1-none` target.
2. **Contract Upload:** Deployed Treasury to the Stellar Testnet.
3. **Contract Upload:** Deployed Vault to the Stellar Testnet.
4. **Link Treasury to Vault:** Invoked `Treasury::initialize`, passing the Vault's Address so it inherently trusts the Vault.
5. **Link Vault to Treasury:** Invoked `Vault::initialize`, passing the Admin Address and the Treasury's Address so the Vault knows where to forward its fund releases.

## Example Invocation (Live)

After initialization, an automated test transaction invoked `create_vault` on the live network.

* **Invoked Function:** `create_vault(creator, token)`
* **Status:** Success
* **Transaction Hash:** `a0f6019f354ec11e38948b115138fd785d706b80d8653e9c4a3f68d7c363da9b`
* **On-Chain Event Emitted:** `{"string":"Vault"}, {"string":"vault_created"}`

*Verify this transaction using [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet/tx/a0f6019f354ec11e38948b115138fd785d706b80d8653e9c4a3f68d7c363da9b).*
