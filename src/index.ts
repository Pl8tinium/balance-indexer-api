
import { indexerApi } from "./api";
import { AdapterController } from "./api_adapters/adapterController";

// start blockchain explorer adapters
const adapterController = new AdapterController();
adapterController.start();

const PORT = 3000;
indexerApi.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
