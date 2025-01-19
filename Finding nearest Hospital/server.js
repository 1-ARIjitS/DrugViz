import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/places', async (req, res) => {
    const { url } = req.query;
    console.log(`Fetching URL: ${url}`); // Log the URL being fetched
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(`Response data: ${JSON.stringify(data)}`); // Log the response data
        res.json(data);
    } catch (error) {
        console.error(`Error fetching data: ${error}`); // Log the error
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
