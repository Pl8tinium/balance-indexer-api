interface Transaction {
    txid: string;
    fees: number;
    confirmed: string;
    inputs: Array<{
        addresses: string[];
        output_value: number;
    }>;
    outputs: Array<{
        addresses: string[];
        value: number;
    }>;
}