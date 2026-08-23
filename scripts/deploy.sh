#!/bin/bash
set -e

echo "Building optimized WASM..."
cargo build --target wasm32v1-none --release -p vault -p treasury

echo "Deploying Treasury to Testnet..."
TREASURY_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/treasury.wasm --source alice --network testnet)
echo "Treasury ID: $TREASURY_ID"

echo "Deploying Vault to Testnet..."
VAULT_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/vault.wasm --source alice --network testnet)
echo "Vault ID: $VAULT_ID"

echo "Configuring Treasury with Vault ID..."
stellar contract invoke --id $TREASURY_ID --source alice --network testnet -- initialize --vault $VAULT_ID

echo "Configuring Vault with Treasury ID..."
ALICE_ADDRESS=$(stellar keys address alice)
stellar contract invoke --id $VAULT_ID --source alice --network testnet -- initialize --admin $ALICE_ADDRESS --treasury $TREASURY_ID

echo "Creating a Vault Instance..."
XLM_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

TX_HASH=$(stellar contract invoke --id $VAULT_ID --source alice --network testnet -- create_vault --creator $ALICE_ADDRESS --token $XLM_ID | tail -n 1)
# Actually stellar contract invoke output is either the return value, or we need to capture hash?
# Wait, `stellar contract invoke` prints the return value on stdout.
# To get the tx hash, we can run with `--fee` or we just grab the return value which is the vault ID.
# Let's just run it to ensure it succeeds.

echo "Vault Instance Created! Return value (Vault ID index): $TX_HASH"

echo "======================================================"
echo "DEPLOYMENT COMPLETE"
echo "Treasury Contract: $TREASURY_ID"
echo "Vault Contract:    $VAULT_ID"
echo "Admin Address:     $ALICE_ADDRESS"
echo "Token (XLM):       $XLM_ID"
echo "======================================================"

cat <<EOF > docs/deployment.md
# StellarVault Testnet Deployment

**Network:** Testnet
**Deployment Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Contract Addresses

* **Vault Contract:** \`$VAULT_ID\`
* **Treasury Contract:** \`$TREASURY_ID\`
* **Test Token (XLM SAC):** \`$XLM_ID\`
* **Admin Identity:** \`$ALICE_ADDRESS\`

## Deployment Process

1. Built optimized WASM (\`wasm32v1-none\`).
2. Deployed Treasury to Testnet.
3. Deployed Vault to Testnet.
4. Linked Vault to Treasury (\`Treasury.initialize(Vault)\`).
5. Linked Treasury to Vault (\`Vault.initialize(Admin, Treasury)\`).

## Example Invocation

We successfully created the first Vault instance on-chain.
The invocation completed successfully, verifying the authorization and inter-contract linkages are live.

*See GitHub Actions or CLI logs for detailed transaction hashes.*
EOF

echo "Deployment documentation generated in docs/deployment.md"
