import { IndexedAccount } from "../models/IndexedAccount";

export interface IExplorerDataSupplicant {
    /**
     * go through supplied (indexed) accounts and check if the database state correctly indexes the latest txs
     * @returns {Array<string>} account addresses that are not up to date
     */
    verifyFullState(indexedAccounts: Array<IndexedAccount>): Promise<Array<string>>;

    /**
     * go through supplied accounts and update the database state to the latest txs
     * 
     * @param {Array<string>} addresses
     * @returns {Promise<void>}
     */
    updateState(addresses: Array<string>): Promise<void>;
    
    coin: string;

    // pla: optimization for the future. When an api call comes in and we do state updates in regular intervals
    // we might not have the latest up to date state in the database. The functions below should then do checks for
    // single accounts and update the state if necessary. Therefore we can guarantee that our api request always deliver
    // the latest state of the account without constantly verifying the full state.
    // verifyAccountState(): Promise<boolean>;
    // updateAccountState(): Promise<void>;  
}