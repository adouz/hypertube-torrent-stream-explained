const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const streamHandler = require('./torrentStream');
// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// enable cors
app.use(cors());
app.options('*', cors());

//torrent-stream route
app.get('/stream/:magnet', streamHandler);

//index.html
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
module.exports = app;