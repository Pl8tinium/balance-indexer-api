export interface IDataAggregator {
    getAbsoluteBalanceDifferenceForDay(date: Date, address: string, coin: string): Promise<number>;
    getAbsoluteBalanceDifferenceAll(startDate: Date, endDate: Date, address: string, coin: string): Promise<number>;
}