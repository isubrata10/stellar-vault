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
    PaymentNotFound = 3,
    Unauthorized = 4,
    InvalidAmount = 5,
    InvalidState = 6,
    InsufficientFunds = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaymentState {
    Created = 1,
    Funded = 2,
    Accepted = 3,
    MilestonePending = 4,
    MilestoneApproved = 5,
    SettlementPending = 6,
    Completed = 7,
    Cancelled = 8,
    Disputed = 9,
    Refunded = 10,
    Failed = 11,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payment {
    pub business: Address,
    pub recipient: Address,
    pub token: Address,
    pub amount: i128,
    pub state: PaymentState,
    pub has_milestone: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Treasury,
    PaymentCount,
    Payment(u64),
}

#[contract]
pub struct FlowPayContract;

#[contractimpl]
impl FlowPayContract {
    pub fn initialize(env: Env, admin: Address, treasury: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::PaymentCount, &0u64);
        Ok(())
    }

    pub fn create_payment(
        env: Env,
        business: Address,
        recipient: Address,
        token: Address,
        amount: i128,
        has_milestone: bool,
    ) -> Result<u64, Error> {
        business.require_auth();
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PaymentCount)
            .unwrap();
        count += 1;

        let payment = Payment {
            business: business.clone(),
            recipient: recipient.clone(),
            token,
            amount,
            state: PaymentState::Created,
            has_milestone,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Payment(count), &payment);
        env.storage().instance().set(&DataKey::PaymentCount, &count);

        env.events().publish(
            ("FlowPay", symbol_short!("created")),
            (count, business, recipient, amount),
        );
        Ok(count)
    }

    pub fn fund_payment(env: Env, payment_id: u64, business: Address) -> Result<(), Error> {
        business.require_auth();
        let mut payment = Self::get_payment(env.clone(), payment_id)?;
        if payment.business != business {
            return Err(Error::Unauthorized);
        }
        if payment.state != PaymentState::Created {
            return Err(Error::InvalidState);
        }

        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let treasury_client = treasury_contract::Client::new(&env, &treasury);
        treasury_client.deposit(&business, &payment.token, &payment.amount);

        payment.state = PaymentState::Funded;
        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);

        env.events()
            .publish(("FlowPay", symbol_short!("funded")), (payment_id, business));
        Ok(())
    }

    pub fn accept_payment(env: Env, payment_id: u64, recipient: Address) -> Result<(), Error> {
        recipient.require_auth();
        let mut payment = Self::get_payment(env.clone(), payment_id)?;
        if payment.recipient != recipient {
            return Err(Error::Unauthorized);
        }
        if payment.state != PaymentState::Funded {
            return Err(Error::InvalidState);
        }

        if payment.has_milestone {
            payment.state = PaymentState::Accepted;
        } else {
            payment.state = PaymentState::SettlementPending;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);
        env.events().publish(
            ("FlowPay", symbol_short!("accepted")),
            (payment_id, recipient),
        );
        Ok(())
    }

    pub fn submit_milestone(env: Env, payment_id: u64, recipient: Address) -> Result<(), Error> {
        recipient.require_auth();
        let mut payment = Self::get_payment(env.clone(), payment_id)?;
        if payment.recipient != recipient {
            return Err(Error::Unauthorized);
        }
        if payment.state != PaymentState::Accepted {
            return Err(Error::InvalidState);
        }

        payment.state = PaymentState::MilestonePending;
        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);
        env.events().publish(
            ("FlowPay", symbol_short!("ms_pend")),
            (payment_id, recipient),
        );
        Ok(())
    }

    pub fn approve_milestone(env: Env, payment_id: u64, business: Address) -> Result<(), Error> {
        business.require_auth();
        let mut payment = Self::get_payment(env.clone(), payment_id)?;
        if payment.business != business {
            return Err(Error::Unauthorized);
        }
        if payment.state != PaymentState::MilestonePending {
            return Err(Error::InvalidState);
        }

        payment.state = PaymentState::SettlementPending;
        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);
        env.events().publish(
            ("FlowPay", symbol_short!("ms_appr")),
            (payment_id, business),
        );
        Ok(())
    }

    pub fn release_payment(
        env: Env,
        payment_id: u64,
        admin_or_business: Address,
    ) -> Result<(), Error> {
        admin_or_business.require_auth();
        let mut payment = Self::get_payment(env.clone(), payment_id)?;

        let is_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap()
            == admin_or_business;
        if payment.business != admin_or_business && !is_admin {
            return Err(Error::Unauthorized);
        }
        if payment.state != PaymentState::SettlementPending {
            return Err(Error::InvalidState);
        }

        payment.state = PaymentState::Completed;
        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);

        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let treasury_client = treasury_contract::Client::new(&env, &treasury);
        treasury_client.release(&payment.token, &payment.recipient, &payment.amount);

        env.events().publish(
            ("FlowPay", symbol_short!("released")),
            (payment_id, payment.recipient.clone()),
        );
        Ok(())
    }

    pub fn cancel_payment(env: Env, payment_id: u64, business: Address) -> Result<(), Error> {
        business.require_auth();
        let mut payment = Self::get_payment(env.clone(), payment_id)?;
        if payment.business != business {
            return Err(Error::Unauthorized);
        }

        if payment.state == PaymentState::Created {
            payment.state = PaymentState::Cancelled;
        } else if payment.state == PaymentState::Funded {
            payment.state = PaymentState::Refunded;
            let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
            let treasury_client = treasury_contract::Client::new(&env, &treasury);
            treasury_client.release(&payment.token, &payment.business, &payment.amount);
        } else {
            return Err(Error::InvalidState);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);
        env.events().publish(
            ("FlowPay", symbol_short!("canceled")),
            (payment_id, business),
        );
        Ok(())
    }

    pub fn refund_payment(
        env: Env,
        payment_id: u64,
        admin_or_business: Address,
    ) -> Result<(), Error> {
        admin_or_business.require_auth();
        let mut payment = Self::get_payment(env.clone(), payment_id)?;
        let is_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap()
            == admin_or_business;
        if payment.business != admin_or_business && !is_admin {
            return Err(Error::Unauthorized);
        }

        if payment.state != PaymentState::Disputed && payment.state != PaymentState::Failed {
            return Err(Error::InvalidState);
        }

        payment.state = PaymentState::Refunded;
        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);

        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let treasury_client = treasury_contract::Client::new(&env, &treasury);
        treasury_client.release(&payment.token, &payment.business, &payment.amount);

        env.events().publish(
            ("FlowPay", symbol_short!("refunded")),
            (payment_id, payment.business.clone()),
        );
        Ok(())
    }

    pub fn raise_dispute(env: Env, payment_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let mut payment = Self::get_payment(env.clone(), payment_id)?;
        if payment.business != caller && payment.recipient != caller {
            return Err(Error::Unauthorized);
        }
        if payment.state == PaymentState::Completed
            || payment.state == PaymentState::Cancelled
            || payment.state == PaymentState::Refunded
            || payment.state == PaymentState::Created
        {
            return Err(Error::InvalidState);
        }

        payment.state = PaymentState::Disputed;
        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);
        env.events()
            .publish(("FlowPay", symbol_short!("disputed")), (payment_id, caller));
        Ok(())
    }

    pub fn resolve_dispute(
        env: Env,
        payment_id: u64,
        admin: Address,
        refund: bool,
    ) -> Result<(), Error> {
        admin.require_auth();
        let is_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap()
            == admin;
        if !is_admin {
            return Err(Error::Unauthorized);
        }

        let mut payment = Self::get_payment(env.clone(), payment_id)?;
        if payment.state != PaymentState::Disputed {
            return Err(Error::InvalidState);
        }

        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let treasury_client = treasury_contract::Client::new(&env, &treasury);

        if refund {
            payment.state = PaymentState::Refunded;
            treasury_client.release(&payment.token, &payment.business, &payment.amount);
        } else {
            payment.state = PaymentState::Completed;
            treasury_client.release(&payment.token, &payment.recipient, &payment.amount);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Payment(payment_id), &payment);
        env.events()
            .publish(("FlowPay", symbol_short!("resolved")), (payment_id, refund));
        Ok(())
    }

    pub fn get_payment(env: Env, payment_id: u64) -> Result<Payment, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Payment(payment_id))
            .ok_or(Error::PaymentNotFound)
    }

    pub fn get_payment_status(env: Env, payment_id: u64) -> Result<PaymentState, Error> {
        let payment = Self::get_payment(env, payment_id)?;
        Ok(payment.state)
    }
}

#[cfg(test)]
mod test;
