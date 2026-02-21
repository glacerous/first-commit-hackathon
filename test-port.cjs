const express = require('express');
const app = express();
const port = 3001;

app.get('/test', (req, res) => res.send('OK'));

app.listen(port, () => {
    console.log(`Minimal server running on ${port}`);
});
