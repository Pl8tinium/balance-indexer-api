import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/getTx', (req, res) => {
    res.json({ message: 'This is a GET request response' });
});

// retrieves aggregated balance history (daily) for an account for a given timespan
app.get('/api/getBalanceHistory', (req, res) => {
    res.json({ message: 'This is a GET request response' });
});

// gets full account history (all transactions) for a given account
app.get('/api/getAccountHistory', (req, res) => {
    res.json({ message: 'This is a GET request response' });
});

export { app as indexerApi };