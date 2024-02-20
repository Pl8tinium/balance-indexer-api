
import axios from "axios";
import { indexerApi } from "./api";
import { AdapterController } from "./api_adapters/adapterController";
import { TransactionUTXO } from "./models/TransactionUTXO";

// start blockchain explorer adapters
// const adapterController = new AdapterController();
// adapterController.start();

// const PORT = 3000;
// indexerApi.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });



// TESTING

console.log('Testing...');


async function getTransactionsForWallet(walletAddress: string): Promise<TransactionUTXO[]> {
    try {
        const response = await axios.get(`https://mempool.space/api/address/${walletAddress}/txs`);
        
        // Parse each transaction using the provided data structure
        const unifiedTransactions: TransactionUTXO[] = response.data.map(parseSampleDataToUTXOModel);

        return unifiedTransactions;
    } catch (error) {
        console.error('Error fetching transactions for wallet:', error);
        throw error; // Rethrow or handle as needed
    }
}

function parseSampleDataToUTXOModel(data: any): TransactionUTXO {
    const inputs = data.vin.map((input: any) => ({
        addresses: [input.prevout.scriptpubkey_address], // Assuming there's only one address per input
        output_value: input.prevout.value,
    }));

    const outputs = data.vout.map((output: any) => ({
        addresses: [output.scriptpubkey_address], // Assuming there's only one address per output
        value: output.value,
    }));

    const transactionUTXO: TransactionUTXO = {
        txid: data.txid,
        fees: data.fee,
        confirmed: data.status.confirmed ? "true" : "false", // Assuming you want a string representation
        inputs: inputs,
        outputs: outputs,
    };

    return transactionUTXO;
}

// Example usage
const walletAddress = '1wiz18xYmhRX6xStj2b9t1rwWX4GKUgpv';
getTransactionsForWallet(walletAddress)
    .then(transactions => {
        console.log(transactions);
    })
    .catch(error => {
        console.error(error);
    });