import { IDataAggregator } from './interfaces/IDataAggregator';
import { Collection } from 'mongodb';
import { Transaction } from './models/Transaction';
import { IDataService } from './interfaces/IDataService';
import { DbAdapter } from './dbAdapter';
import Big from 'big.js';
import { IndexService } from './indexService';
import { IndexedAccount } from './models/IndexedAccount';
import { AggregatedAccountBalanceDay } from './models/AggregatedAccountBalanceDay';

export class DataAggregator implements IDataAggregator {
  dbAdapter: DbAdapter;
  indexService: IndexService;

  constructor(dbAdapter: DbAdapter, indexService: IndexService) {
    this.dbAdapter = dbAdapter;
    this.indexService = indexService;
  }

  public calculateAbsoluteBalanceForTxs(address: string, transactions: Array<Transaction>, currency: string, includeFees: boolean): number {
    let currentBalance = new Big(0);

    transactions.forEach(tx => {
      const fee = includeFees && tx.fees ? new Big(tx.fees) : new Big(0);
      let netValue = new Big(0);

      // Determine if the address is the sender and subtract the sent amount from the balance
      let isSender = false;
      tx.inputs.forEach(input => {
        if (input.address == address) {
          netValue = netValue.minus(new Big(input.value));
          isSender = true;
        }
      });

      // Add the received amount to the balance
      tx.outputs.forEach(output => {
        if (output.address == address) {
          netValue = netValue.plus(new Big(output.value));
        }
      });

      if (isSender) {
        // Subtract the fee from the sender's balance
        netValue = netValue.minus(fee);
      }

      // Update the balance for this transaction
      currentBalance = currentBalance.plus(netValue);
    });

    return currentBalance.toNumber();

    // return {
    //   address: address,
    //   date: day,
    //   netBalance: previousBalance + currentBalance.toNumber(),
    //   balanceDifference: currentBalance.toNumber(),
    // } as AggregatedAccountBalanceDay;

    // pla: note, maybe directly save Big objects in the db, currently doesnt have any benefit
  }

  public async getAggregatedHistory(startDate: Date, endDate: Date, address: string, coin: string): Promise<Array<AggregatedAccountBalanceDay>> {
    const aggregatedData = this.dbAdapter.getAggregatedCollection(coin);

    const query = {
      address: address,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    };
    const aggregatedDays = (await aggregatedData.find(query).toArray()) as Array<AggregatedAccountBalanceDay>;

    return aggregatedDays;
  }

  private getDay(date: Date): Date {
    const day = new Date(date);
    // Set the time to 00:00:00.000, so the date can be compared on daily basis
    day.setHours(0, 0, 0, 0);
    return day;
  }

  public async aggregateDataByDay(accountsToAggregate: Array<IndexedAccount>, coin: string, includeFees: boolean = true): Promise<void> {
    const aggregatedData = this.dbAdapter.getAggregatedCollection(coin);
    const rawData = this.dbAdapter.getRawCollection(coin);

    for (const account of accountsToAggregate) {
      let transactions = (await rawData.find({ id: { $in: account.txIds }, aggregatable: true }).toArray()) as Array<Transaction>;

      // throw out transactions that are on the current day, we only aggregate past data for simplicity
      transactions = transactions.filter(tx => new Date(tx.timestamp) < new Date());

      // get transactions that were not part of the aggregation yet from the previous run where we ignored the current day
      if (account.lastUpdated) {
        const query = {
          address: account.address,
          timestamp: {
            $gte: this.getDay(account.lastUpdated),
            $lt: this.getDay(new Date(account.lastUpdated.getTime() + 24 * 60 * 60 * 1000)), // adds one day to lastUpdated
          },
        };
        const additionalTx = (await rawData.find(query).toArray()) as Array<Transaction>;

        transactions = transactions.concat(additionalTx);
      }

      // group and sort by date
      const groupedByDateObject = transactions.reduce(
        (accumulator, tx) => {
          const dateKey = this.getDay(tx.timestamp).toISOString();
          accumulator[dateKey] = accumulator[dateKey] || [];
          accumulator[dateKey].push(tx);

          return accumulator;
        },
        {} as { [key: string]: Array<Transaction> }
      );
      const groupedByDateArray = Object.entries(groupedByDateObject);
      groupedByDateArray.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

      // get the last aggregated balance for this account and use it as the starting point for the consecutive aggregated days
      let lastAggregatedBalance = (await aggregatedData.findOne(
        { address: account.address },
        { sort: { date: -1 } }
      )) as AggregatedAccountBalanceDay | null;

      // aggregate by currency
      for (const [date, transactions] of groupedByDateArray) {
        const netBalances = [];
        const balanceDifferences = [];

        // get all unique currencies for this day
        const uniqueCurrencies = new Set<string>();
        for (let tx of transactions) {
          for (let input of tx.inputs) {
            uniqueCurrencies.add(input.currency);
          }
        }

        // add all currencies from the last aggregated balance to the unique currencies
        lastAggregatedBalance?.netBalances.forEach(balance => {
          uniqueCurrencies.add(balance.currency);
        });

        for (let currency of uniqueCurrencies) {
          // check if we can find a previous balance for this currency
          let previousBalance = 0;
          lastAggregatedBalance?.netBalances.forEach(balance => {
            if (balance.currency == currency) {
              previousBalance = balance.amount;
            }
          });

          const aggregatedAmountForDay = this.calculateAbsoluteBalanceForTxs(account.address, transactions, currency, includeFees);

          netBalances.push({
            currency: currency,
            amount: previousBalance + aggregatedAmountForDay,
          });

          balanceDifferences.push({
            currency: currency,
            amount: aggregatedAmountForDay,
          });
        }

        lastAggregatedBalance = {
          address: account.address,
          date: new Date(date),
          netBalances: netBalances,
          balanceDifferences: balanceDifferences,
        } as AggregatedAccountBalanceDay;

        await aggregatedData.insertOne(lastAggregatedBalance);
      }
    }
  }
}
