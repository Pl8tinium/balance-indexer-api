import { IExplorerDataSupplicant } from "../interfaces/IExplorerDataSupplicant";
import { MempoolSpaceAdapter } from "./mempoolSpaceAdapter";

export class AdapterController {
    private checkInterval: NodeJS.Timeout = null!;
    
    constructor() {
    }

    public async start(): Promise<void> {
        const adapters = this.getAdapters();
        this.checkInterval = setInterval(async () => {
            for (const adapter of adapters) {
                await adapter.verifyFullState();
                await adapter.updateState();
            }
        }, 15 * 60 * 1000);
    }

    public stop(): void {
        clearInterval(this.checkInterval);
    }

    private getAdapters(): Array<IExplorerDataSupplicant> {
        return [new MempoolSpaceAdapter()];
    }
}