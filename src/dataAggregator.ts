import { IDataAggregator } from "./interfaces/IDataAggregator";
import { Collection } from 'mongodb';
import { Transaction } from "./models/Transaction";
import { IDataService } from './interfaces/IDataService';

export class DataAggregator implements IDataAggregator {

    constructor() {
    }
    getAbsoluteBalanceDifferenceForTxs(transactions: Array<Transaction>): Promise<number> {
        // throw new Error("Method not implemented.");

        // use already existing script from tmp



        let currentBalance = new Big(initialBalanceSatoshi)//.div(satoshiPerBitcoin); // Convert initial balance to Bitcoin
        const balances = new Map<string, Big>();

        transactions.forEach(tx => {
            const date = tx.confirmed.split('T')[0]; // Extract the date part
            const fee = new Big(tx.fees)//.div(satoshiPerBitcoin); // Convert fee to Bitcoin
            let netValue = new Big(0);

            // Determine if the address is the sender
            const isSender = tx.inputs.some(input => input.addresses.includes(address));

            tx.outputs.forEach(output => {
                if (output.addresses.includes(address)) {
                    netValue = netValue.plus(new Big(output.value))
                }
            });

            if (isSender) {
                // Subtract the fee from the sender's balance
                netValue = netValue.minus(fee);
            }

            // Update the balance for this transaction
            currentBalance = currentBalance.plus(netValue);
            balances.set(date, new Big(currentBalance));
        });

        // Optional: Sort by date if needed
        return new Map([...balances.entries()].sort());

    }
    getAbsoluteBalanceDifference(dataService: IDataService, startDate: Date, endDate: Date, address: string, coin: string): Promise<number> {
        
        const transactions = dataService.getAccountHistory(address);
        // get all days between start and end date in a for loop


        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {

            
            // check if the balance for this day is already in db, if not calculate it and put into db

        }


        // iterate over all days and get the balance difference for each day

        // while doing so check if you got the aggregated balance for each of the days already in db, if not calc and put into db






        // notes, only aggregate if the day already passed


        throw new Error("Method not implemented.");
    }

}