#![no_std]
use soroban_sdk::token;
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InsufficientFunds = 5,
}

#[contracttype]
pub enum DataKey {
    Vault,
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    pub fn initialize(env: Env, vault: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Vault) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Vault, &vault);
        Ok(())
    }

    pub fn deposit(env: Env, from: Address, token: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        env.events()
            .publish(("Treasury", "funds_received"), (from, token, amount));
        Ok(())
    }

    pub fn release(env: Env, token: Address, to: Address, amount: i128) -> Result<(), Error> {
        let vault: Address = env
            .storage()
            .instance()
            .get(&DataKey::Vault)
            .ok_or(Error::NotInitialized)?;

        // This ensures the Vault contract explicitly authorized this invocation
        // When Vault invokes this cross-contract, it automatically authorizes.
        vault.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let token_client = token::Client::new(&env, &token);
        let current_balance = token_client.balance(&env.current_contract_address());

        if amount > current_balance {
            return Err(Error::InsufficientFunds);
        }

        token_client.transfer(&env.current_contract_address(), &to, &amount);

        env.events()
            .publish(("Treasury", "funds_released"), (to, token, amount));
        Ok(())
    }

    pub fn get_state(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Vault)
            .ok_or(Error::NotInitialized)
    }
}

#[cfg(test)]
mod test;
