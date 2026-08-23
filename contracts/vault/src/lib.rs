#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String,
};

mod treasury_contract {
    soroban_sdk::contractimport!(file = "../../target/wasm32v1-none/release/treasury.wasm");
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    VaultNotFound = 3,
    Unauthorized = 4,
    InvalidAmount = 5,
    WithdrawalNotFound = 6,
    InvalidState = 7,
    AlreadyExecuted = 8,
    AlreadyParticipant = 9,
    NotParticipant = 10,
    InsufficientFunds = 11,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VaultStatus {
    Active = 0,
    Locked = 1,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Vault {
    pub creator: Address,
    pub token: Address,
    pub balance: i128,
    pub status: VaultStatus,
    pub participant_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WithdrawalRequest {
    pub requester: Address,
    pub to: Address,
    pub amount: i128,
    pub approvals: u32,
    pub executed: bool,
    pub rejected: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Treasury,
    VaultCount,
    Vault(u64),
    Participant(u64, Address),
    ReqCount(u64),
    Withdrawal(u64, u64),
    Approved(u64, u64, Address),
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    pub fn initialize(env: Env, admin: Address, treasury: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::VaultCount, &0u64);
        Ok(())
    }

    pub fn create_vault(env: Env, creator: Address, token: Address) -> Result<u64, Error> {
        creator.require_auth();
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        let mut count: u64 = env.storage().instance().get(&DataKey::VaultCount).unwrap();
        count += 1;

        let vault = Vault {
            creator: creator.clone(),
            token,
            balance: 0,
            status: VaultStatus::Active,
            participant_count: 1, // creator is a participant
        };

        env.storage()
            .persistent()
            .set(&DataKey::Vault(count), &vault);
        env.storage()
            .persistent()
            .set(&DataKey::Participant(count, creator.clone()), &true);
        env.storage()
            .persistent()
            .set(&DataKey::ReqCount(count), &0u64);
        env.storage().instance().set(&DataKey::VaultCount, &count);

        env.events()
            .publish(("Vault", "vault_created"), (count, creator));
        Ok(count)
    }

    pub fn get_vault(env: Env, vault_id: u64) -> Result<Vault, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Vault(vault_id))
            .ok_or(Error::VaultNotFound)
    }

    pub fn add_participant(
        env: Env,
        vault_id: u64,
        admin_or_creator: Address,
        participant: Address,
    ) -> Result<(), Error> {
        admin_or_creator.require_auth();
        let mut vault = Self::get_vault(env.clone(), vault_id)?;

        let is_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap()
            == admin_or_creator;
        if vault.creator != admin_or_creator && !is_admin {
            return Err(Error::Unauthorized);
        }

        if env
            .storage()
            .persistent()
            .has(&DataKey::Participant(vault_id, participant.clone()))
        {
            return Err(Error::AlreadyParticipant);
        }

        vault.participant_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Vault(vault_id), &vault);
        env.storage()
            .persistent()
            .set(&DataKey::Participant(vault_id, participant.clone()), &true);

        env.events()
            .publish(("Vault", "participant_added"), (vault_id, participant));
        Ok(())
    }

    pub fn deposit(env: Env, vault_id: u64, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut vault = Self::get_vault(env.clone(), vault_id)?;
        if vault.status != VaultStatus::Active {
            return Err(Error::InvalidState);
        }

        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();

        let treasury_client = treasury_contract::Client::new(&env, &treasury);
        treasury_client.deposit(&from, &vault.token, &amount);

        vault.balance += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Vault(vault_id), &vault);

        env.events()
            .publish(("Vault", "deposit"), (vault_id, from, amount));
        Ok(())
    }

    pub fn get_balance(env: Env, vault_id: u64) -> Result<i128, Error> {
        let vault = Self::get_vault(env, vault_id)?;
        Ok(vault.balance)
    }

    pub fn request_withdrawal(
        env: Env,
        vault_id: u64,
        requester: Address,
        to: Address,
        amount: i128,
    ) -> Result<u64, Error> {
        requester.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let vault = Self::get_vault(env.clone(), vault_id)?;
        if vault.status != VaultStatus::Active {
            return Err(Error::InvalidState);
        }
        if amount > vault.balance {
            return Err(Error::InsufficientFunds);
        }
        if !env
            .storage()
            .persistent()
            .has(&DataKey::Participant(vault_id, requester.clone()))
        {
            return Err(Error::NotParticipant);
        }

        let mut req_count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::ReqCount(vault_id))
            .unwrap();
        req_count += 1;

        let req = WithdrawalRequest {
            requester: requester.clone(),
            to: to.clone(),
            amount,
            approvals: 1, // Requester automatically approves
            executed: false,
            rejected: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Withdrawal(vault_id, req_count), &req);
        env.storage()
            .persistent()
            .set(&DataKey::ReqCount(vault_id), &req_count);
        env.storage().persistent().set(
            &DataKey::Approved(vault_id, req_count, requester.clone()),
            &true,
        );

        env.events().publish(
            ("Vault", "withdrawal_requested"),
            (vault_id, req_count, requester, to, amount),
        );
        Ok(req_count)
    }

    pub fn approve_withdrawal(
        env: Env,
        vault_id: u64,
        request_id: u64,
        approver: Address,
    ) -> Result<(), Error> {
        approver.require_auth();
        let vault = Self::get_vault(env.clone(), vault_id)?;
        if !env
            .storage()
            .persistent()
            .has(&DataKey::Participant(vault_id, approver.clone()))
        {
            return Err(Error::NotParticipant);
        }

        let mut req: WithdrawalRequest = env
            .storage()
            .persistent()
            .get(&DataKey::Withdrawal(vault_id, request_id))
            .ok_or(Error::WithdrawalNotFound)?;
        if req.executed || req.rejected {
            return Err(Error::InvalidState);
        }
        if env.storage().persistent().has(&DataKey::Approved(
            vault_id,
            request_id,
            approver.clone(),
        )) {
            return Err(Error::InvalidState); // already approved
        }

        req.approvals += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Withdrawal(vault_id, request_id), &req);
        env.storage().persistent().set(
            &DataKey::Approved(vault_id, request_id, approver.clone()),
            &true,
        );

        env.events().publish(
            ("Vault", "withdrawal_approved"),
            (vault_id, request_id, approver),
        );
        Ok(())
    }

    pub fn reject_withdrawal(
        env: Env,
        vault_id: u64,
        request_id: u64,
        rejecter: Address,
    ) -> Result<(), Error> {
        rejecter.require_auth();
        let vault = Self::get_vault(env.clone(), vault_id)?;
        if !env
            .storage()
            .persistent()
            .has(&DataKey::Participant(vault_id, rejecter.clone()))
        {
            return Err(Error::NotParticipant);
        }

        let mut req: WithdrawalRequest = env
            .storage()
            .persistent()
            .get(&DataKey::Withdrawal(vault_id, request_id))
            .ok_or(Error::WithdrawalNotFound)?;
        if req.executed || req.rejected {
            return Err(Error::InvalidState);
        }

        req.rejected = true;
        env.storage()
            .persistent()
            .set(&DataKey::Withdrawal(vault_id, request_id), &req);
        env.events().publish(
            ("Vault", "withdrawal_rejected"),
            (vault_id, request_id, rejecter),
        );
        Ok(())
    }

    pub fn execute_withdrawal(
        env: Env,
        vault_id: u64,
        request_id: u64,
        executor: Address,
    ) -> Result<(), Error> {
        executor.require_auth();
        let mut vault = Self::get_vault(env.clone(), vault_id)?;
        let mut req: WithdrawalRequest = env
            .storage()
            .persistent()
            .get(&DataKey::Withdrawal(vault_id, request_id))
            .ok_or(Error::WithdrawalNotFound)?;

        if req.executed {
            return Err(Error::AlreadyExecuted);
        }
        if req.rejected {
            return Err(Error::InvalidState);
        }
        if req.amount > vault.balance {
            return Err(Error::InsufficientFunds);
        }
        // Require all participants to approve, or any specific business logic rule. Let's say all participants.
        if req.approvals < vault.participant_count {
            return Err(Error::Unauthorized);
        }

        req.executed = true;
        vault.balance -= req.amount;

        env.storage()
            .persistent()
            .set(&DataKey::Withdrawal(vault_id, request_id), &req);
        env.storage()
            .persistent()
            .set(&DataKey::Vault(vault_id), &vault);

        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let treasury_client = treasury_contract::Client::new(&env, &treasury);
        treasury_client.release(&vault.token, &req.to, &req.amount);

        env.events().publish(
            ("Vault", "withdrawal_executed"),
            (vault_id, request_id, executor, req.to, req.amount),
        );
        Ok(())
    }

    pub fn get_withdrawal(
        env: Env,
        vault_id: u64,
        request_id: u64,
    ) -> Result<WithdrawalRequest, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Withdrawal(vault_id, request_id))
            .ok_or(Error::WithdrawalNotFound)
    }

    pub fn get_vault_status(env: Env, vault_id: u64) -> Result<VaultStatus, Error> {
        let vault = Self::get_vault(env, vault_id)?;
        Ok(vault.status)
    }
}

#[cfg(test)]
mod test;
