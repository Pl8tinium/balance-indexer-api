import { Collection } from "mongodb";
import { IndexedAccount } from "./models/IndexedAccount";

export class IndexService {
    btcIndexData: Collection<IndexedAccount>
    hiveIndexData: Collection<IndexedAccount>
    vscindexData: Collection<IndexedAccount>

    constructor(
        btcIndexData: Collection<IndexedAccount>,
        hiveIndexData: Collection<IndexedAccount>,
        vscIndexData: Collection<IndexedAccount>,
    ) {
        this.btcIndexData = btcIndexData;
        this.hiveIndexData = hiveIndexData;
        this.vscindexData = vscIndexData;
    }


    private getCollection(coin: string): Collection<IndexedAccount> {
        switch (coin) {
            case "BTC":
                return this.btcIndexData;
            case "HIVE":
                return this.hiveIndexData;
            case "VSC":
                return this.vscindexData;
            default:
                throw new Error("Invalid coin");
        }
    }

    public async getIndexedAccounts(coin: string): Promise<Array<IndexedAccount>> {
        const collection = this.getCollection(coin);
        return collection.find({}).toArray();
    }

    public async indexAccount(address: string, coin: string): Promise<void> {
        const query = { address: address };
        const update = {
            $setOnInsert: { address: address, txIds: [] } as IndexedAccount
        };
        const options = { upsert: true };
        const collection = this.getCollection(coin);
        await collection.updateOne(query, update, options);
    }
}