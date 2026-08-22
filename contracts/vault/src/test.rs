#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, BytesN};
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient as TokenAdminClient;

mod treasury_real {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32v1-none/release/treasury.wasm"
    );
}

fn create_token_contract<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let contract_address = e.register_stellar_asset_contract_v2(admin.clone()).address();
    (
        TokenClient::new(e, &contract_address),
        TokenAdminClient::new(e, &contract_address),
    )
}

#[test]
fn test_vault_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let participant = Address::generate(&env);
    
    // Register Vault
    let vault_id = env.register(VaultContract, ());
    let vault_client = VaultContractClient::new(&env, &vault_id);

    // Register Treasury from the Wasm
    let treasury_id = env.register(treasury_real::WASM, ());
    let treasury_client = treasury_real::Client::new(&env, &treasury_id);

    // Init Treasury with the Vault address
    treasury_client.initialize(&vault_id);

    // Create a mock token
    let token_admin = Address::generate(&env);
    let (token, admin_client) = create_token_contract(&env, &token_admin);

    // Init Vault
    vault_client.initialize(&admin, &participant, &treasury_id, &token.address);

    // Mint tokens to admin and deposit
    admin_client.mint(&admin, &1000);
    treasury_client.deposit(&admin, &token.address, &1000);
    
    assert_eq!(token.balance(&treasury_id), 1000);

    // Request withdrawal
    let recipient = Address::generate(&env);
    vault_client.request_withdrawal(&participant, &recipient, &500);

    // Approve withdrawal by admin (completes it)
    vault_client.approve_withdrawal(&admin);

    // Check balances
    assert_eq!(token.balance(&recipient), 500);
    assert_eq!(token.balance(&treasury_id), 500);
}
