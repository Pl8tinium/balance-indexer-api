import { IExplorerDataSupplicant } from "../interfaces/IExplorerDataSupplicant";

export class MempoolSpaceAdapter implements IExplorerDataSupplicant {
    coin: string = 'btc';

    constructor() { 
    }
    
    verifyFullState(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    updateState(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    aggregateData(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}