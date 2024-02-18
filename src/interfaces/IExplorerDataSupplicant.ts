export interface IExplorerDataSupplicant {
    verifyFullState(): Promise<boolean>;
    updateState(): Promise<void>;
    // pla: optimization for the future. When an api call comes in and we do state updates in regular intervals
    // we might not have the latest up to date state in the database. The functions below should then do checks for
    // single accounts and update the state if necessary. Therefore we can guarantee that our api request always deliver
    // the latest state of the account without constantly verifying the full state.
    // verifyAccountState(): Promise<boolean>;
    // updateAccountState(): Promise<void>;  
    aggregateData(): Promise<void>;
    coin: string;
}