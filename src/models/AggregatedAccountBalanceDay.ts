export interface AggregatedAccountBalanceDay {
    address: string;
    date: Date;
    netBalance: number;
    balanceDifference: number;
}