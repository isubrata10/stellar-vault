#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, token};

#[contracttype]
pub enum DataKey {
    Vault,
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    /// Initialize the treasury with the authorized vault address.
    pub fn initialize(env: Env, vault: Address) {
        if env.storage().instance().has(&DataKey::Vault) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Vault, &vault);
    }

    /// Deposit tokens into the treasury.
    pub fn deposit(env: Env, from: Address, token: Address, amount: i128) {
        from.require_auth();
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&from, &env.current_contract_address(), &amount);
        env.events().publish(("Treasury", "deposit"), (from, token, amount));
    }

    /// Release tokens from the treasury to a specified destination.
    /// Only the initialized vault contract can authorize this call.
    pub fn release(env: Env, token: Address, to: Address, amount: i128) {
        let vault: Address = env.storage().instance().get(&DataKey::Vault).expect("Treasury not initialized");
        vault.require_auth();
        
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &to, &amount);
        env.events().publish(("Treasury", "release"), (to, token, amount));
    }
}

#[cfg(test)]
mod test;
