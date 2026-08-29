#!/bin/bash
set -e

echo "Starting E2E FlowPay Testnet Setup..."

echo "Funding Accounts..."
stellar keys fund admin --network testnet || true
stellar keys fund business --network testnet || true
stellar keys fund recipient --network testnet || true

ADMIN_ADDR=$(stellar keys address admin)
BUSINESS_ADDR=$(stellar keys address business)
RECIPIENT_ADDR=$(stellar keys address recipient)

echo "Admin: $ADMIN_ADDR"
echo "Business: $BUSINESS_ADDR"
echo "Recipient: $RECIPIENT_ADDR"

echo "Deploying Treasury..."
TREASURY_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/treasury.wasm --source admin --network testnet)
echo "Treasury ID: $TREASURY_ID"

echo "Deploying FlowPay..."
FLOWPAY_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/vault.wasm --source admin --network testnet)
echo "FlowPay ID: $FLOWPAY_ID"

echo "Initializing Treasury..."
stellar contract invoke --id $TREASURY_ID --source admin --network testnet -- initialize --vault $FLOWPAY_ID

echo "Initializing FlowPay..."
stellar contract invoke --id $FLOWPAY_ID --source admin --network testnet -- initialize --admin $ADMIN_ADDR --treasury $TREASURY_ID

NATIVE_ASSET="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

echo "Creating Payment..."
PAYMENT_ID=$(stellar contract invoke --id $FLOWPAY_ID --source business --network testnet -- create_payment --business $BUSINESS_ADDR --recipient $RECIPIENT_ADDR --token $NATIVE_ASSET --amount 10000000 --has_milestone true)
PAYMENT_ID=$(echo $PAYMENT_ID | tr -d '"')
echo "Payment ID: $PAYMENT_ID created."

echo "Funding Payment..."
stellar contract invoke --id $FLOWPAY_ID --source business --network testnet -- fund_payment --payment_id $PAYMENT_ID --business $BUSINESS_ADDR

echo "Accepting Payment..."
stellar contract invoke --id $FLOWPAY_ID --source recipient --network testnet -- accept_payment --payment_id $PAYMENT_ID --recipient $RECIPIENT_ADDR

echo "Submitting Milestone..."
stellar contract invoke --id $FLOWPAY_ID --source recipient --network testnet -- submit_milestone --payment_id $PAYMENT_ID --recipient $RECIPIENT_ADDR

echo "Approving Milestone..."
stellar contract invoke --id $FLOWPAY_ID --source business --network testnet -- approve_milestone --payment_id $PAYMENT_ID --business $BUSINESS_ADDR

echo "Releasing Payment..."
stellar contract invoke --id $FLOWPAY_ID --source admin --network testnet -- release_payment --payment_id $PAYMENT_ID --admin_or_business $ADMIN_ADDR

echo "Fetching final payment status..."
FINAL_STATUS=$(stellar contract invoke --id $FLOWPAY_ID --source admin --network testnet -- get_payment_status --payment_id $PAYMENT_ID)
echo "Final Status: $FINAL_STATUS (Expected: Completed)"

echo "Success! E2E Flow complete."
