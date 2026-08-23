#![cfg(test)]
use super::*;
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient as TokenAdminClient;
use soroban_sdk::{contract, testutils::Address as _, Address, Env};

#[contract]
pub struct DummyVault;

#[contractimpl]
impl DummyVault {
    pub fn do_release(env: Env, treasury: Address, token: Address, to: Address, amount: i128) {
        let client = TreasuryContractClient::new(&env, &treasury);
        client.release(&token, &to, &amount);
    }
}

fn create_token_contract<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let contract_address = e
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    (
        TokenClient::new(e, &contract_address),
        TokenAdminClient::new(e, &contract_address),
    )
}

#[test]
fn test_1_treasury_initializes_correctly() {
    let env = Env::default();
    env.mock_all_auths();
    let treasury_id = env.register(TreasuryContract, ());
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);
    let vault = Address::generate(&env);

    treasury_client.initialize(&vault);
    assert_eq!(treasury_client.get_state(), vault);

    let res = treasury_client.try_initialize(&vault);
    assert_eq!(res.unwrap_err().unwrap(), Error::AlreadyInitialized);
}

#[test]
fn test_2_vault_can_call_treasury() {
    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register(TreasuryContract, ());
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);

    let vault_id = env.register(DummyVault, ());
    let vault_client = DummyVaultClient::new(&env, &vault_id);

    treasury_client.initialize(&vault_id);

    let admin = Address::generate(&env);
    let (token, admin_client) = create_token_contract(&env, &admin);

    let user = Address::generate(&env);
    admin_client.mint(&user, &1000);
    treasury_client.deposit(&user, &token.address, &1000);

    let recipient = Address::generate(&env);

    // Vault makes the cross-contract call
    vault_client.do_release(&treasury_id, &token.address, &recipient, &500);

    assert_eq!(token.balance(&recipient), 500);
    assert_eq!(token.balance(&treasury_id), 500);
}

#[test]
#[should_panic(expected = "HostError: Error(Auth, InvalidAction)")]
fn test_3_unauthorized_cannot_call() {
    let env = Env::default();
    // Intentionally omit mock_all_auths() to strictly enforce require_auth checks

    let treasury_id = env.register(TreasuryContract, ());
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);

    let real_vault = Address::generate(&env);
    treasury_client.initialize(&real_vault);

    let token = Address::generate(&env);
    let to = Address::generate(&env);

    // This will panic because real_vault did not authorize this call
    treasury_client.release(&token, &to, &100);
}

#[test]
fn test_4_successful_release_changes_state() {
    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register(TreasuryContract, ());
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);

    // In mock_all_auths, calling directly with client acts as if the required auth is satisfied
    let vault = Address::generate(&env);
    treasury_client.initialize(&vault);

    let admin = Address::generate(&env);
    let (token, admin_client) = create_token_contract(&env, &admin);
    let user = Address::generate(&env);
    let recipient = Address::generate(&env);

    admin_client.mint(&user, &1000);
    treasury_client.deposit(&user, &token.address, &1000);

    treasury_client.release(&token.address, &recipient, &1000);

    assert_eq!(token.balance(&treasury_id), 0);
    assert_eq!(token.balance(&recipient), 1000);
}

#[test]
fn test_5_invalid_release_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let treasury_id = env.register(TreasuryContract, ());
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);
    let vault = Address::generate(&env);
    treasury_client.initialize(&vault);

    let admin = Address::generate(&env);
    let (token, admin_client) = create_token_contract(&env, &admin);
    let user = Address::generate(&env);
    let recipient = Address::generate(&env);

    admin_client.mint(&user, &1000);
    treasury_client.deposit(&user, &token.address, &500);

    // Invalid amount
    let res1 = treasury_client.try_release(&token.address, &recipient, &0);
    assert_eq!(res1.unwrap_err().unwrap(), Error::InvalidAmount);

    // Insufficient funds
    let res2 = treasury_client.try_release(&token.address, &recipient, &600);
    assert_eq!(res2.unwrap_err().unwrap(), Error::InsufficientFunds);
}
