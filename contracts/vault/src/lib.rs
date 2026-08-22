#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

mod treasury_contract {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32v1-none/release/treasury.wasm"
    );
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Participant,
    Treasury,
    Token,
    WithdrawalReq,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WithdrawalRequest {
    pub to: Address,
    pub amount: i128,
    pub admin_approved: bool,
    pub participant_approved: bool,
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Initialize the vault
    pub fn initialize(
        env: Env,
        admin: Address,
        participant: Address,
        treasury: Address,
        token: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Vault already initialized");
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Participant, &participant);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::Token, &token);
    }

    /// Deposit is handled by calling treasury directly, but we can have a helper here
    /// that just emits an event for the frontend to track easily.
    pub fn log_deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        env.events().publish(("Vault", "deposit"), (from, token, amount));
    }

    /// Request a withdrawal
    pub fn request_withdrawal(env: Env, requester: Address, to: Address, amount: i128) {
        requester.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let participant: Address = env.storage().instance().get(&DataKey::Participant).unwrap();

        if requester != admin && requester != participant {
            panic!("Only admin or participant can request withdrawal");
        }

        let admin_approved = requester == admin;
        let participant_approved = requester == participant;

        let req = WithdrawalRequest {
            to: to.clone(),
            amount,
            admin_approved,
            participant_approved,
        };

        env.storage().instance().set(&DataKey::WithdrawalReq, &req);
        env.events().publish(("Vault", "withdrawal_requested"), (requester, to, amount));
    }

    /// Approve a withdrawal request
    pub fn approve_withdrawal(env: Env, approver: Address) {
        approver.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let participant: Address = env.storage().instance().get(&DataKey::Participant).unwrap();

        if approver != admin && approver != participant {
            panic!("Only admin or participant can approve");
        }

        let mut req: WithdrawalRequest = env
            .storage()
            .instance()
            .get(&DataKey::WithdrawalReq)
            .expect("No pending withdrawal request");

        if approver == admin {
            req.admin_approved = true;
        } else if approver == participant {
            req.participant_approved = true;
        }

        env.storage().instance().set(&DataKey::WithdrawalReq, &req);
        env.events().publish(("Vault", "withdrawal_approved"), (approver,));

        // If both approved, execute the withdrawal via cross-contract call to Treasury
        if req.admin_approved && req.participant_approved {
            let treasury_id: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
            let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
            
            // We use the generated client to call Treasury safely
            let treasury_client = treasury_contract::Client::new(&env, &treasury_id);
            treasury_client.release(&token, &req.to, &req.amount);

            // Clear the request after successful release
            env.storage().instance().remove(&DataKey::WithdrawalReq);
            env.events().publish(("Vault", "funds_released"), (req.to, req.amount));
        }
    }
}

#[cfg(test)]
mod test;
