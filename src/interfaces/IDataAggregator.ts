export interface IDataAggregator {
    getAbsoluteBalanceDifferenceForTxs(date: Date, address: string, coin: string): Promise<number>;
    getAbsoluteBalanceDifferenceAll(startDate: Date, endDate: Date, address: string, coin: string): Promise<number>;
}