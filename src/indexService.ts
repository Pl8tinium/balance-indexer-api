import { Collection } from 'mongodb';
import { IndexedAccount } from './models/IndexedAccount';
import { DbAdapter } from './dbAdapter';

export class IndexService {
  dbAdapter: DbAdapter;

  constructor(dbAdapter: DbAdapter) {
    this.dbAdapter = dbAdapter;
  }

  public async getIndexedAccounts(coin: string): Promise<Array<IndexedAccount>> {
    const collection = this.dbAdapter.getIndexCollection(coin);
    return collection.find({}).toArray();
  }

  public async indexAccount(address: string, coin: string): Promise<void> {
    const query = { address: address };
    const update = {
      $setOnInsert: { address: address, txIds: [] } as IndexedAccount,
    };
    const options = { upsert: true };
    const collection = this.dbAdapter.getIndexCollection(coin);
    await collection.updateOne(query, update, options);
  }

  public async updateIndexedAccounts(accountsToUpdate: Array<IndexedAccount>, coin: string): Promise<void> {
    const collection = this.dbAdapter.getIndexCollection(coin);
    const bulk = collection.initializeUnorderedBulkOp();
    accountsToUpdate.forEach(account => {
      bulk
        .find({ address: account.address })
        .upsert()
        .updateOne({
          $addToSet: {
            txIds: {
              $each: account.txIds,
            },
          },
          $set: {
            lastUpdated: new Date(),
          },
        });
    });
    await bulk.execute();
  }
}
