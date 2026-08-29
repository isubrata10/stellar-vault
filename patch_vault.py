import re

with open("contracts/vault/src/lib.rs", "r") as f:
    content = f.read()

# Define the bump parameters (Soroban testnet typically allows around 100k-500k ledgers)
# We will bump persistent data to ~100_000 ledgers and instance data to ~100_000
BUMP_PERSISTENT = ".bump(&DataKey::Payment(payment_id), 100_000, 100_000);"
BUMP_INSTANCE = "env.storage().instance().bump(100_000, 100_000);"

# 1. Update initialize
init_target = "env.storage().instance().set(&DataKey::Treasury, &treasury);"
init_replace = f"{init_target}\n        {BUMP_INSTANCE}"
content = content.replace(init_target, init_replace)

# 2. Add bump_persistent helper logic right after env.storage().persistent().set(&DataKey::Payment(payment_id), &payment);
# It happens in multiple functions.
persistent_set = "env.storage()\n            .persistent()\n            .set(&DataKey::Payment(payment_id), &payment);"
persistent_replace = f"env.storage().persistent().set(&DataKey::Payment(payment_id), &payment);\n        env.storage().persistent().bump(&DataKey::Payment(payment_id), 100_000, 100_000);"
content = content.replace(persistent_set, persistent_replace)

# We also need to bump instance during get_payment to keep it alive? No, we bump instance whenever we use it, or just once during create. Let's bump instance on create_payment.
counter_set = "env.storage().instance().set(&DataKey::Counter, &payment_id);"
counter_replace = f"{counter_set}\n        {BUMP_INSTANCE}"
content = content.replace(counter_set, counter_replace)

with open("contracts/vault/src/lib.rs", "w") as f:
    f.write(content)
