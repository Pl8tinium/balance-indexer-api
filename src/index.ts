import { DbAdapter } from './dbAdapter';
import { IndexService } from './indexService';
import { DataAggregator } from './dataAggregator';
import { BtcDataService } from './chaindata/btcDataService';
import { MempoolSpaceAdapter } from './apiAdapters/mempoolSpaceAdapter';

async function main() {
  const dbAdapter = new DbAdapter();
  await dbAdapter.start();
  const indexService = new IndexService(dbAdapter);
  const dataAggregator = new DataAggregator(dbAdapter, indexService);
  await indexService.indexAccount('bc1q5kvdu35dhjgm0v5zp8vgeq0ysr8ql4enusejpa', 'BTC');
  await indexService.indexAccount('bc1qcckklpst7dmk2wxe63pp2s8apsa7gfpya6uugj', 'BTC');
  const btcDataService = new BtcDataService(
    dbAdapter.getRawCollection('BTC'),
    dbAdapter.getIndexCollection('BTC'),
    new MempoolSpaceAdapter(dbAdapter.getRawCollection('BTC'), indexService),
    indexService,
    dataAggregator
  );

  // const hardcodedAddresses = ['bc1q5kvdu35dhjgm0v5zp8vgeq0ysr8ql4enusejpa'];

  // const PORT = 3000;
  // indexerApi.listen(PORT, () => {
  //     console.log(`Server is running on http://localhost:${PORT}`);
  // });

  // NOTE HARDCODE VSC ACCOUNTS IN FOR NOW TO STARTUP THE WHOLE THING

  // DEBUG
  await new Promise(resolve => setTimeout(resolve, 60 * 1000));
}

main();
