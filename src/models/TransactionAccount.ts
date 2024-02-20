export interface TransactionAccount {
    txid: string;
    fees: number;
    confirmed: string; 
    from: string; 
    to: string;
    value: number;
    data?: string; 
}
