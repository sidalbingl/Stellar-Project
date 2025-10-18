#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

const KEY_TOTAL: Symbol = symbol_short!("total");
const KEY_LAST: Symbol = symbol_short!("last");

#[contract]
pub struct CharityChainContract;

#[contractimpl]
impl CharityChainContract {
    pub fn contribute(env: Env, contributor: Address, amount: u32) {
        contributor.require_auth();
        let mut total: u32 = env.storage().persistent().get(&KEY_TOTAL).unwrap_or(0u32);
        total = total.saturating_add(amount);
        env.storage().persistent().set(&KEY_TOTAL, &total);
        env.storage().persistent().set(&KEY_LAST, &contributor);
    }

    pub fn get_total_funds(env: Env) -> u32 {
        env.storage().persistent().get(&KEY_TOTAL).unwrap_or(0u32)
    }

    pub fn get_last_contributor(env: Env) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&KEY_LAST)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn basic_flow() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, CharityChainContract);
        let client = CharityChainContractClient::new(&env, &contract_id);

        let user = Address::generate(&env); 
        assert_eq!(client.get_total_funds(), 0);
        client.contribute(&user, &10);
        assert_eq!(client.get_total_funds(), 10);
        assert_eq!(client.get_last_contributor(), Some(user));
    }
}