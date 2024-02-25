import { Collection, MongoClient } from "mongodb"
import { IndexedAccount } from "./models/IndexedAccount"
import { AggregatedAccountBalanceDay } from "./models/AggregatedAccountBalanceDay"
import { AddressLink } from "./models/AddressLink";
import { Transaction } from "./models/Transaction";

export class DbAdapter {
    btcRawData: Collection<Transaction> = null!;
    btcIndexData: Collection<IndexedAccount> = null!;
    btcAggregatedData: Collection<AggregatedAccountBalanceDay> = null!;
    hiveRawData: Collection<Transaction> = null!;
    hiveIndexData: Collection<IndexedAccount> = null!;
    hiveAggregatedData: Collection<AggregatedAccountBalanceDay> = null!;
    vscRawData: Collection<Transaction> = null!;
    vscIndexData: Collection<IndexedAccount> = null!;
    vscAggregatedData: Collection<AggregatedAccountBalanceDay> = null!;
    linkData: Collection<AddressLink> = null!;

    public async start() {
        const client = new MongoClient('mongodb://localhost:27017')
        await client.connect();
        const db = client.db('vsc-indexer')
        this.btcRawData = db.collection('btcRawData');
        this.btcIndexData = db.collection('btcIndexData');
        this.btcAggregatedData = db.collection('btcAggregatedData');
        this.hiveRawData = db.collection('hiveRawData');
        this.hiveIndexData = db.collection('hiveIndexData');
        this.hiveAggregatedData = db.collection('hiveAggregatedData');
        this.vscRawData = db.collection('vscRawData');
        this.vscIndexData = db.collection('vscIndexData');
        this.vscAggregatedData = db.collection('vscAggregatedData');
        this.linkData = db.collection('linkData');
    }

    public getIndexCollection(coin: string): Collection<IndexedAccount> {
        switch (coin) {
            case "BTC":
                return this.btcIndexData;
            case "HIVE":
                return this.hiveIndexData;
            case "VSC":
                return this.vscIndexData;
            default:
                throw new Error("Invalid coin");
        }
    }

    public getRawCollection(coin: string): Collection<Transaction> {
        switch (coin) {
            case "BTC":
                return this.btcRawData;
            case "HIVE":
                return this.hiveRawData;
            case "VSC":
                return this.vscRawData;
            default:
                throw new Error("Invalid coin");
        }
    }

    public getAggregatedCollection(coin: string): Collection<AggregatedAccountBalanceDay> {
        switch (coin) {
            case "BTC":
                return this.btcAggregatedData;
            case "HIVE":
                return this.hiveAggregatedData;
            case "VSC":
                return this.vscAggregatedData;
            default:
                throw new Error("Invalid coin");
        }
    }

    public getLinkCollection(): Collection<AddressLink> {
        return this.linkData;
    }
}