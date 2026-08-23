#![cfg(test)]
use super::*;
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient as TokenAdminClient;
use soroban_sdk::{testutils::Address as _, Address, Env};

mod treasury_real {
    soroban_sdk::contractimport!(file = "../../target/wasm32v1-none/release/treasury.wasm");
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

fn setup_env() -> (
    Env,
    VaultContractClient<'static>,
    Address,
    Address,
    TokenClient<'static>,
    TokenAdminClient<'static>,
    treasury_real::Client<'static>,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let vault_id = env.register(VaultContract, ());
    let vault_client = VaultContractClient::new(&env, &vault_id);

    let treasury_id = env.register(treasury_real::WASM, ());
    let treasury_client = treasury_real::Client::new(&env, &treasury_id);

    treasury_client.initialize(&vault_id);
    vault_client.initialize(&admin, &treasury_id);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);

    (
        env,
        vault_client,
        admin,
        treasury_id,
        token,
        token_admin_client,
        treasury_client,
    )
}

#[test]
fn test_1_vault_creation() {
    let (env, vault, admin, _treasury, token, _, _) = setup_env();
    let creator = Address::generate(&env);

    let v_id = vault.create_vault(&creator, &token.address);
    assert_eq!(v_id, 1);

    let state = vault.get_vault(&v_id);
    assert_eq!(state.creator, creator);
    assert_eq!(state.balance, 0);
    assert_eq!(state.participant_count, 1);
    assert_eq!(vault.get_vault_status(&v_id), VaultStatus::Active);
}

#[test]
fn test_2_participant_authorization() {
    let (env, vault, admin, _treasury, token, _, _) = setup_env();
    let creator = Address::generate(&env);
    let v_id = vault.create_vault(&creator, &token.address);

    let participant = Address::generate(&env);
    let malicious = Address::generate(&env);

    // Add participant via admin (successful)
    vault.add_participant(&v_id, &admin, &participant);

    // Add participant via malicious (should fail auth, but mock_all_auths bypasses signature checks,
    // so the logic check inside add_participant `vault.creator != admin_or_creator && !is_admin` handles it)
    let res = vault.try_add_participant(&v_id, &malicious, &Address::generate(&env));
    assert_eq!(res.unwrap_err().unwrap(), Error::Unauthorized);
}

#[test]
fn test_3_deposit() {
    let (env, vault, _, treasury, token, admin_client, treasury_client) = setup_env();
    let creator = Address::generate(&env);
    let v_id = vault.create_vault(&creator, &token.address);

    admin_client.mint(&creator, &1000);
    vault.deposit(&v_id, &creator, &500);

    assert_eq!(vault.get_balance(&v_id), 500);
    assert_eq!(token.balance(&treasury), 500);
    assert_eq!(token.balance(&creator), 500);
}

#[test]
fn test_4_withdrawal_approval() {
    let (env, vault, _, treasury, token, admin_client, treasury_client) = setup_env();
    let creator = Address::generate(&env);
    let participant = Address::generate(&env);
    let recipient = Address::generate(&env);

    let v_id = vault.create_vault(&creator, &token.address);
    vault.add_participant(&v_id, &creator, &participant);

    admin_client.mint(&creator, &1000);
    vault.deposit(&v_id, &creator, &1000);

    let req_id = vault.request_withdrawal(&v_id, &participant, &recipient, &400);
    let mut req = vault.get_withdrawal(&v_id, &req_id);
    assert_eq!(req.approvals, 1);
    assert_eq!(req.executed, false);

    vault.approve_withdrawal(&v_id, &req_id, &creator);
    vault.execute_withdrawal(&v_id, &req_id, &participant);

    req = vault.get_withdrawal(&v_id, &req_id);
    assert_eq!(req.executed, true);
    assert_eq!(token.balance(&recipient), 400);
    assert_eq!(token.balance(&treasury), 600);
    assert_eq!(vault.get_balance(&v_id), 600);
}

#[test]
fn test_5_unauthorized_withdrawal_attempt() {
    let (env, vault, _, _, token, admin_client, _) = setup_env();
    let creator = Address::generate(&env);
    let stranger = Address::generate(&env);

    let v_id = vault.create_vault(&creator, &token.address);
    admin_client.mint(&creator, &1000);
    vault.deposit(&v_id, &creator, &1000);

    // Stranger tries to request withdrawal
    let res = vault.try_request_withdrawal(&v_id, &stranger, &stranger, &500);
    assert_eq!(res.unwrap_err().unwrap(), Error::NotParticipant);

    // Stranger tries to execute an unapproved withdrawal from creator
    let req_id = vault.request_withdrawal(&v_id, &creator, &stranger, &100);
    // Since participant_count = 1, creator request inherently approves it to 1, which equals participant_count.
    // However, stranger tries to execute it
    // Wait, the test checks unauthorized withdrawal request.
    // Let's test a malicious actor executing without enough approvals.

    let participant = Address::generate(&env);
    vault.add_participant(&v_id, &creator, &participant);

    let req_id_2 = vault.request_withdrawal(&v_id, &creator, &stranger, &100);
    // approvals = 1, count = 2.
    let res_exec = vault.try_execute_withdrawal(&v_id, &req_id_2, &participant);
    assert_eq!(res_exec.unwrap_err().unwrap(), Error::Unauthorized);
}
