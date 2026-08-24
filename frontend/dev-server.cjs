const express = require('../backend/node_modules/express');
const path = require('node:path');

const app = express();
const port = Number.parseInt(process.env.PORT || '5500', 10);

app.use(express.static(__dirname));
app.listen(port, '127.0.0.1', () => {
  console.log(`Frontend tersedia di http://127.0.0.1:${port}`);
});
