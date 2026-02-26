const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from /public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve /data JSON files
app.use('/data', express.static(path.join(__dirname, 'data')));

// Serve /assets (audio files)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.listen(PORT, () => {
    console.log(`BengalBird サーバーはポート${PORT}で起動しています`);
    console.log(`http://localhost:${PORT}`);
});