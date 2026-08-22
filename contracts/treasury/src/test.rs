#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient as TokenAdminClient;

fn create_token_contract<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let contract_address = e.register_stellar_asset_contract(admin.clone());
    (
        TokenClient::new(e, &contract_address),
        TokenAdminClient::new(e, &contract_address),
    )
}

#[test]
fn test_treasury_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let vault = Address::generate(&env);
    let user = Address::generate(&env);
    let recipient = Address::generate(&env);

    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);

    // Init treasury
    treasury_client.initialize(&vault);

    // Create a mock token
    let token_admin = Address::generate(&env);
    let (token, admin_client) = create_token_contract(&env, &token_admin);

    // Mint tokens to user
    admin_client.mint(&user, &1000);
    assert_eq!(token.balance(&user), 1000);

    // Deposit to treasury
    treasury_client.deposit(&user, &token.address, &500);
    assert_eq!(token.balance(&user), 500);
    assert_eq!(token.balance(&treasury_id), 500);

    // Release from treasury
    treasury_client.release(&token.address, &recipient, &200);
    assert_eq!(token.balance(&treasury_id), 300);
    assert_eq!(token.balance(&recipient), 200);
}

#[test]
#[should_panic(expected = "Treasury not initialized")]
fn test_release_uninitialized() {
    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);

    let token = Address::generate(&env);
    let recipient = Address::generate(&env);

    treasury_client.release(&token, &recipient, &200);
}
