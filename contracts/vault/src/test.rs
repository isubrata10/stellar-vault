#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient as TokenAdminClient;
use soroban_sdk::{testutils::Address as _, Env};

fn create_token_contract<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let contract_address = e
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    (
        TokenClient::new(e, &contract_address),
        TokenAdminClient::new(e, &contract_address),
    )
}

fn setup_env<'a>() -> (
    Env,
    FlowPayContractClient<'a>,
    Address,
    Address,
    TokenClient<'a>,
    TokenAdminClient<'a>,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let contract_id = env.register(FlowPayContract, ());
    let client = FlowPayContractClient::new(&env, &contract_id);

    let treasury_id = env.register(treasury_contract::WASM, ());
    let treasury_client = treasury_contract::Client::new(&env, &treasury_id);
    treasury_client.initialize(&contract_id);

    client.initialize(&admin, &treasury_id);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);

    (env, client, admin, treasury_id, token, token_admin_client)
}

#[test]
fn test_1_create_payment() {
    let (env, client, _, _, token, _) = setup_env();
    let business = Address::generate(&env);
    let recipient = Address::generate(&env);

    let pid = client.create_payment(&business, &recipient, &token.address, &1000, &false);
    assert_eq!(pid, 1);

    let payment = client.get_payment(&pid);
    assert_eq!(payment.amount, 1000);
    assert_eq!(payment.state, PaymentState::Created);
}

#[test]
fn test_2_funding_and_release_no_milestone() {
    let (env, client, admin, _, token, token_admin) = setup_env();
    let business = Address::generate(&env);
    let recipient = Address::generate(&env);

    token_admin.mint(&business, &2000);

    let pid = client.create_payment(&business, &recipient, &token.address, &1000, &false);
    client.fund_payment(&pid, &business);

    assert_eq!(token.balance(&business), 1000); // 1000 held in treasury
    assert_eq!(client.get_payment_status(&pid), PaymentState::Funded);

    client.accept_payment(&pid, &recipient);
    assert_eq!(
        client.get_payment_status(&pid),
        PaymentState::SettlementPending
    ); // jumped milestone

    client.release_payment(&pid, &business);
    assert_eq!(client.get_payment_status(&pid), PaymentState::Completed);
    assert_eq!(token.balance(&recipient), 1000);
}

#[test]
fn test_3_milestone_flow() {
    let (env, client, _, _, token, token_admin) = setup_env();
    let business = Address::generate(&env);
    let recipient = Address::generate(&env);

    token_admin.mint(&business, &1000);

    let pid = client.create_payment(&business, &recipient, &token.address, &1000, &true);
    client.fund_payment(&pid, &business);

    client.accept_payment(&pid, &recipient);
    assert_eq!(client.get_payment_status(&pid), PaymentState::Accepted);

    client.submit_milestone(&pid, &recipient);
    assert_eq!(
        client.get_payment_status(&pid),
        PaymentState::MilestonePending
    );

    client.approve_milestone(&pid, &business);
    assert_eq!(
        client.get_payment_status(&pid),
        PaymentState::SettlementPending
    );
}

#[test]
fn test_4_cancellation() {
    let (env, client, _, _, token, token_admin) = setup_env();
    let business = Address::generate(&env);
    let recipient = Address::generate(&env);
    token_admin.mint(&business, &1000);

    // Cancel before funding
    let pid1 = client.create_payment(&business, &recipient, &token.address, &500, &false);
    client.cancel_payment(&pid1, &business);
    assert_eq!(client.get_payment_status(&pid1), PaymentState::Cancelled);

    // Cancel after funding (Refunds)
    let pid2 = client.create_payment(&business, &recipient, &token.address, &500, &false);
    client.fund_payment(&pid2, &business);
    assert_eq!(token.balance(&business), 500);

    client.cancel_payment(&pid2, &business);
    assert_eq!(client.get_payment_status(&pid2), PaymentState::Refunded);
    assert_eq!(token.balance(&business), 1000); // refunded
}

#[test]
fn test_5_dispute_and_admin_resolve() {
    let (env, client, admin, _, token, token_admin) = setup_env();
    let business = Address::generate(&env);
    let recipient = Address::generate(&env);
    token_admin.mint(&business, &1000);

    let pid = client.create_payment(&business, &recipient, &token.address, &1000, &true);
    client.fund_payment(&pid, &business);
    client.accept_payment(&pid, &recipient);

    client.raise_dispute(&pid, &recipient);
    assert_eq!(client.get_payment_status(&pid), PaymentState::Disputed);

    // Admin resolves in favor of recipient
    client.resolve_dispute(&pid, &admin, &false);
    assert_eq!(client.get_payment_status(&pid), PaymentState::Completed);
    assert_eq!(token.balance(&recipient), 1000);
}

#[test]
#[should_panic]
fn test_6_unauthorized_release() {
    let (env, client, _, _, token, token_admin) = setup_env();
    let business = Address::generate(&env);
    let recipient = Address::generate(&env);
    let stranger = Address::generate(&env);
    token_admin.mint(&business, &1000);

    let pid = client.create_payment(&business, &recipient, &token.address, &1000, &false);
    client.fund_payment(&pid, &business);
    client.accept_payment(&pid, &recipient);

    // Stranger tries to release
    client.release_payment(&pid, &stranger);
}

#[test]
#[should_panic]
fn test_7_invalid_state_transition() {
    let (env, client, _, _, token, token_admin) = setup_env();
    let business = Address::generate(&env);
    let recipient = Address::generate(&env);
    token_admin.mint(&business, &1000);

    let pid = client.create_payment(&business, &recipient, &token.address, &1000, &false);

    // Attempt to accept before funded
    client.accept_payment(&pid, &recipient);
}
