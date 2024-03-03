import { IndexService } from '../indexService';
import { IExplorerDataSupplicant } from '../interfaces/IExplorerDataSupplicant';
import { DbAdapter } from '../dbAdapter';
import { IndexedAccount } from '../models/IndexedAccount';
import EventEmitter from 'events';

export abstract class ExplorerDataSupplicant implements IExplorerDataSupplicant {
  abstract coin: string;
  public transactionOutput: EventEmitter;
  protected cycleTime = 15 * 60 * 1000;
  private checkInterval: NodeJS.Timeout = null!;
  private indexService: IndexService;

  constructor(indexService: IndexService) {
    this.indexService = indexService;
    this.transactionOutput = new EventEmitter();
  }

  abstract verifyFullState(indexedAccounts: Array<IndexedAccount>): Promise<Array<IndexedAccount>>;

  abstract updateState(indexedAccounts: Array<IndexedAccount>): Promise<Array<IndexedAccount>>;

  public async start(): Promise<void> {
    // this.checkInterval = setInterval(async () => {
    //   const indexedAccounts = await this.indexService.getIndexedAccounts(this.coin);
    //   const accountsToUpdate = await this.verifyFullState(indexedAccounts);
    //   const updatedAccounts = await this.updateState(accountsToUpdate);
    //   this.transactionOutput.emit('newTransactions', updatedAccounts);
    // }, this.cycleTime);

    // DEBUG
    const indexedAccounts = await this.indexService.getIndexedAccounts(this.coin);
    const accountsToUpdate = await this.verifyFullState(indexedAccounts);
    const updatedAccounts = await this.updateState(accountsToUpdate);
    this.transactionOutput.emit('newTransactions', updatedAccounts);
  }

  public stop(): void {
    clearInterval(this.checkInterval);
  }
}
