import { IndexService } from "../indexService";
import { IExplorerDataSupplicant } from "../interfaces/IExplorerDataSupplicant";
import { Transaction } from "../models/Transaction";
import { MempoolSpaceAdapter } from "./mempoolSpaceAdapter";
import { Collection } from 'mongodb';

export class AdapterController {
    private checkInterval: NodeJS.Timeout = null!;
    private indexService: IndexService;
    private readonly cycleTime = 15 * 60 * 1000;
    private btcRawData: Collection<Transaction>;
    
    constructor(indexService: IndexService, btcRawData: Collection<Transaction>) {
        this.indexService = indexService;
        this.btcRawData = btcRawData;
    }

    public async start(): Promise<void> {
        const adapters = this.getAdapters();
        this.checkInterval = setInterval(async () => {
            for (const adapter of adapters) {
                const indexedAccounts = await this.indexService.getIndexedAccounts(adapter.coin);
                const accountsToUpdate = await adapter.verifyFullState(indexedAccounts);
                await adapter.updateState(accountsToUpdate);
            }
        }, this.cycleTime);
    }

    public stop(): void {
        clearInterval(this.checkInterval);
    }

    private getAdapters(): Array<IExplorerDataSupplicant> {
        return [new MempoolSpaceAdapter(this.btcRawData)];
    }
}