var express  = require('express');
var app      = express();                                       // create our app w/ express
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)

app.use(express.static(__dirname + '/public'));    // set the static files location /public/img will be /img for users

app.get('/', function(req,res){
    res.sendFile(__dirname + '/public/index.html');
});

app.get('*', function(req, res) {
    res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                       // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json asjson

// listen (start app with node server.js) ======================================
app.listen(9000);
console.log("App listening on port 9000");