import { AdapterController } from "./apiAdapters/adapterController";
import { DbAdapter } from "./dbAdapter";
import { IndexService } from "./indexService";
import { DataAggregator } from './dataAggregator';

const dbAdapter = new DbAdapter();
const indexService = new IndexService(dbAdapter);
const dataAggregator = new DataAggregator(dbAdapter, indexService);
const adapterController = new AdapterController(indexService, dbAdapter, dataAggregator);
adapterController.start();


// const hardcodedAddresses = ['bc1q5kvdu35dhjgm0v5zp8vgeq0ysr8ql4enusejpa'];

// const PORT = 3000;
// indexerApi.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });


// NOTE HARDCODE VSC ACCOUNTS IN FOR NOW TO STARTUP THE WHOLE THING