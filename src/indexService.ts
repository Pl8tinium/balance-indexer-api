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

    public async indexAccount(address: string, coin: string): Promise<void> {
        const query = { address: address };
        const update = {
            $setOnInsert: { address: address, txIds: [] } as IndexedAccount
        };
        const options = { upsert: true };
        switch (coin) {
            case "BTC":
                await this.btcIndexData.updateOne(query, update, options);
                break;
            case "HIVE":
                await this.hiveIndexData.updateOne(query, update, options);
                break;
            case "VSC":
                await this.vscindexData.updateOne(query, update, options);
                break
            default:
        }
    }
}