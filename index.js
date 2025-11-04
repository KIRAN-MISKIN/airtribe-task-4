const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const router = require('./src/router')

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health/check', (req, res) => {
    res.send('Welcome to the AirTribe Task 4 API');
});

app.use('/', router);

module.exports = app;