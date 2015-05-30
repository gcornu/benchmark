
var express = require('express'),
	fs = require('fs'),
	_ = require('underscore');

var app = express(),
	http = require('http');
	
var port = Number(process.env.PORT || 5000);

var server = http.createServer(app);

server.listen(port, function() {
	console.log("Listening on " + port);
});

//CORS middleware
/*var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}
app.use(allowCrossDomain);*/
app.use(express.bodyParser());
app.use(express.static(__dirname + '/views'));
app.set('view engine', 'ejs');

app.get('/index', function (req, res) {
	res.render('index.ejs');
});

app.get('/create1MList', function (req, res) {
	createList('blacklist1M.list', 1000000, false);
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify([]));
});

app.get('/create10MList', function (req, res) {
	createList('blacklist10M.list', 10000000, false);
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify([]));
});

app.get('/create1MSortedList', function (req, res) {
	createList('blacklist1MSorted.list', 1000000, true);
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify([]));
});

app.get('/create10MSortedList', function (req, res) {
	createList('blacklist10MSorted.list', 10000000, true);
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify([]));
});

function createList(fileName, nbElements, sorted) {
	array = new Array(nbElements);
	for (var i = 0; i < 1; i++) {
		for (var j = 0; j < array.length; j++) {
			array[j] = createHexaId();
		}
		if(sorted) {
			array.sort();
		}
		fs.writeFile(fileName, array.join('\n'), function(err) {
			if(err) {
		 		return console.log(err);
			}
		});
	}
	delete array
	
}

function randomInt(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}

function randomIntInc(low, high) {
	return Math.floor(Math.random() * (high - low + 1) + low);
}

function createHexaId() {
	var values = new Array(16);
	for (var i = 0; i < values.length; i++) {
		values[i] = randomIntInc(0, 15).toString(16);
	}
	return values.join('');
}


var time = 0;
var count = 0;

function readBlacklist(listName, loops, subloops, sorted, res) {
	//blacklist = new Array();
	var blacklist;
	fs.readFile(listName + '.list', 'utf8', function (err, data) {
		if(err) {
			return console.log(err);
		}
		blacklist = data.split('\n');
		benchmark(blacklist, loops, subloops, sorted);
		res.setHeader('Content-Type', 'text/plain');
		res.end('Total time: ' + time + 'ms' + '\n' + 'Mean time: ' + time/count + 'ms');
		//delete blacklist;
	});
}

app.get('/benchmark1M', function (req, res) {
	readBlacklist('blacklist1M', 10, 100, false, res);
});

app.get('/benchmark10M', function (req, res) {
	readBlacklist('blacklist10M', 10, 10, false, res);
});

app.get('/benchmark1MSorted', function (req, res) {
	readBlacklist('blacklist1MSorted', 1000, 1000, true, res);
});

app.get('/benchmark10MSorted', function (req, res) {
	readBlacklist('blacklist10MSorted', 100, 1000, true, res);
});

function benchmark(blacklist, loops, subloops, sorted) {
	time = 0;
	count = 0;
	for (var i = 0; i < loops; i++) {
		for (var j = 0; j < subloops - 1; j++) {
			searchIndex(blacklist, createHexaId(), sorted);
		}
		searchIndex(blacklist, blacklist[randomInt(0, blacklist.length)], sorted);
	}
}

function searchIndex(blacklist, id, sorted) {
	var hrstart = process.hrtime();
	_.indexOf(blacklist, id, sorted)
	var hrend = process.hrtime(hrstart);
	time += hrend[1]/1000000
	count++;

	return 0;
}