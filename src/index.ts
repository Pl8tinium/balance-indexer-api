import axios from 'axios';
import { Big } from 'big.js';

// src/index.ts
console.log('Hello, TypeScript!');

interface Transaction {
    tx_input_n: number; // -1 indicates an output (received), >=0 indicates an input (sent)
    value: number;
    confirmed: string; // Date of confirmation
}

// Fetches the transaction history for a Bitcoin address
async function fetchTransactionHistory(address: string): Promise<Transaction[]> {
    try {
        const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}`); //  /full
        return response.data.txrefs || [];
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        throw error;
    }
}

// Calculate daily balances from transaction history
function calculateDailyBalances(transactions: Transaction[]): Map<string, Big> {
    let currentBalance = new Big(0)
    const balances = new Map<string, Big>();

    // Sort transactions by date to ensure chronological order
    transactions.sort((a, b) => a.confirmed.localeCompare(b.confirmed));

    transactions.forEach(tx => {
        const date = tx.confirmed.split('T')[0]; // Extract the date part

        const value = new Big(tx.value)//.div(satoshiPerBitcoin); // Convert value to Bitcoin
        if (tx.tx_input_n === -1) { // Output to the address (received)
            currentBalance = currentBalance.plus(value);
        } else { // Input from the address (sent)
            currentBalance = currentBalance.minus(value);
        }

        // Store the cumulative balance for each day
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
const bitcoinAddress = 'bc1ppexzwfjmyqg74f3xd5sx9e5cgfccwhh5g9x4ddzy38l3v3x0qxasm7hlyt';
console.log(`Fetching transaction history for Bitcoin address: ${bitcoinAddress}...`);
fetchTransactionHistory(bitcoinAddress)
    .then(transactions => {
        const dailyBalances = calculateDailyBalances(transactions);
        dailyBalances.forEach((balance, date) => {
            console.log(`${date}: ${balance.toString()}`);
            console.log(`$${convertSatoshiToDollars(51000, balance.toNumber())}`);
        });
    })
    .catch(error => {
        console.error('Failed to calculate daily balances:', error);
    });
