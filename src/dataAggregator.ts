import { IDataAggregator } from "./interfaces/IDataAggregator";

export class DataAggregator implements IDataAggregator {
    getAbsoluteBalanceDifferenceForDay(date: Date, address: string, coin: string): Promise<number> {
        throw new Error("Method not implemented.");

        // use already existing script from tmp
    }
    getAbsoluteBalanceDifferenceAll(startDate: Date, endDate: Date, address: string, coin: string): Promise<number> {

        // get all days between start and end date

        // iterate over all days and get the balance difference for each day

        // while doing so check if you got the aggregated balance for each of the days already in db, if not calc and put into db






        // notes, only aggregate if the day already passed


        throw new Error("Method not implemented.");
    }
    
}