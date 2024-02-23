import { AggregatedAccountBalanceDay } from "./AggregatedAccountBalanceDay";

export interface AggregatedAccountBalance {
    account: string;
    coin: string;
    startDate: Date;
    endDate: Date;
    aggregatedDays: Array<AggregatedAccountBalanceDay>;
}