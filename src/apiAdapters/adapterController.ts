import { IndexService } from "../indexService";
import { IExplorerDataSupplicant } from "../interfaces/IExplorerDataSupplicant";
import { Transaction } from "../models/Transaction";
import { MempoolSpaceAdapter } from "./mempoolSpaceAdapter";
import { Collection } from 'mongodb';
import { DbAdapter } from '../dbAdapter';
import { IDataAggregator } from "../interfaces/IDataAggregator";

export class AdapterController {
    private checkInterval: NodeJS.Timeout = null!;
    private indexService: IndexService;
    private readonly cycleTime = 15 * 60 * 1000;
    private dbAdapter: DbAdapter;
    private dataAggregator: IDataAggregator;

    constructor(indexService: IndexService, dbAdapter: DbAdapter, dataAggregator: IDataAggregator) {
        this.indexService = indexService;
        this.dbAdapter = dbAdapter;
        this.dataAggregator = dataAggregator;
    }

    public async start(): Promise<void> {
        const adapters = this.getAdapters();
        this.checkInterval = setInterval(async () => {
            for (const adapter of adapters) {
                const indexedAccounts = await this.indexService.getIndexedAccounts(adapter.coin);
                const accountsToUpdate = await adapter.verifyFullState(indexedAccounts);
                const updatedAccounts = await adapter.updateState(accountsToUpdate);
                await this.dataAggregator.aggregateDataByDay(updatedAccounts, adapter.coin);
                await this.indexService.updateIndexedAccounts(updatedAccounts, adapter.coin);
            }
        }, this.cycleTime);
    }

    public stop(): void {
        clearInterval(this.checkInterval);
    }

    private getAdapters(): Array<IExplorerDataSupplicant> {
        return [new MempoolSpaceAdapter(this.dbAdapter.getRawCollection('BTC'))];
    }
}