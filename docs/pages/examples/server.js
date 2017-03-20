#!/usr/bin/env node
var express = require('express');
var app = express();
var cors = require('cors');
var serveIndex = require('serve-index')

app.use(cors());
app.use(express.static('./'));
app.use(serveIndex('./', {'icons': true}));

var port = process.env.PORT != null ? parseInt(process.env.PORT) : 4000;

app.listen(port, function () {
  console.log('CORS enabled file server listening on port ' + port);
});