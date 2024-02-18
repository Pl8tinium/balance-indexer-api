import axios from 'axios';
import { Big } from 'big.js';

// Adjust fetchTransactionHistory to accommodate the new structure
async function fetchAllTransactions(address: string, page: number = 0, txsAccumulated: DetailedTransaction[] = []): Promise<DetailedTransaction[]> {
    const limit = 50; // Set limit per request. Adjust based on API limits.
    try {
        const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full?limit=${limit}&skip=${page * limit}`);
        const newTxs = response.data.txs || [];
        const accumulatedTxs = txsAccumulated.concat(newTxs);

        // Check if there are more transactions to fetch
        if (newTxs.length === limit) {
            // Recursively fetch next page
            return fetchAllTransactions(address, page + 1, accumulatedTxs);
        } else {
            // No more transactions, return accumulated result
            return accumulatedTxs;
        }
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        throw error;
    }
}

// Adjusted calculateDailyBalancesWithInitialValue to include fees
function calculateDailyBalancesWithInitialValue(transactions: DetailedTransaction[], initialBalanceSatoshi: number, address: string): Map<string, Big> {
    let currentBalance = new Big(initialBalanceSatoshi)//.div(satoshiPerBitcoin); // Convert initial balance to Bitcoin
    const balances = new Map<string, Big>();

    transactions.forEach(tx => {
        const date = tx.confirmed.split('T')[0]; // Extract the date part
        const fee = new Big(tx.fees)//.div(satoshiPerBitcoin); // Convert fee to Bitcoin
        let netValue = new Big(0);

        // Determine if the address is the sender
        const isSender = tx.inputs.some(input => input.addresses.includes(address));
        
        tx.outputs.forEach(output => {
            if (output.addresses.includes(address)) {
                netValue = netValue.plus(new Big(output.value))
            }
        });

        if (isSender) {
            // Subtract the fee from the sender's balance
            netValue = netValue.minus(fee);
        }

        // Update the balance for this transaction
        currentBalance = currentBalance.plus(netValue);
        balances.set(date, new Big(currentBalance));
    });

    // Optional: Sort by date if needed
    return new Map([...balances.entries()].sort());
}

function convertSatoshiToDollars(currentBitcoinPrice: number, satoshiAmount: number): number {
    const satoshiPerBitcoin = 100000000; // 100 million Satoshis in 1 Bitcoin
    const bitcoinAmount = satoshiAmount / satoshiPerBitcoin;
    const dollarValue = bitcoinAmount * currentBitcoinPrice;
    return dollarValue;
  }

// Example usage
const bitcoinAddress = 'bc1ppexzwfjmyqg74f3xd5sx9e5cgfccwhh5g9x4ddzy38l3v3x0qxasm7hlyt'; // Example Bitcoin address
const initialBalanceSatoshi = 0; // Example initial balance in Satoshi

console.log(`Fetching transaction history for Bitcoin address: ${bitcoinAddress}...`);
fetchAllTransactions(bitcoinAddress)
    .then(transactions => {
        const dailyBalances = calculateDailyBalancesWithInitialValue(transactions, initialBalanceSatoshi, bitcoinAddress);
        dailyBalances.forEach((balance, date) => {
            console.log(`${date}: ${balance.toString()} BTC`);
            console.log(`$${convertSatoshiToDollars(51000, balance.toNumber())}`);
        });
    })
    .catch(error => {
        console.error('Failed to calculate daily balances:', error);
    });
