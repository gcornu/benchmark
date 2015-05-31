
var express = require('express'),
	fs = require('fs'),
	_ = require('underscore'),
	MongoClient = require('mongodb').MongoClient,
	assert = require('assert');

var app = express(),
	http = require('http');
	
var port = Number(process.env.PORT || 5000);

var server = http.createServer(app);

server.listen(port, function() {
	console.log("Listening on " + port);
});

var url = 'mongodb://localhost:27017/test';

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

app.get('/create10MListDb', function (req, res) {
	count = 0;
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		createListToDb(db, 'blacklist10M', 5000000, function () {
			db.close();
			res.setHeader('Content-Type', 'text/plain');
			res.end('10M elements inserted in Db\nCount = ' + count);
		});
	});
});

app.get('/createDbIndex', function (req, res) {
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		createDbIndex(db, 'blacklist10M', function(indexName) {
			db.close();
			res.setHeader('Content-Type', 'text/plain');
			res.end('Created following index: ' + indexName);
		});
	});
});

app.get('/countDb', function (req, res) {
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		countDocuments(db, 'blacklist10M', function(count) {
			db.close();
			console.log('Nb of docs: ' + count);
			res.setHeader('Content-Type', 'text/plain');
			res.end('Nb of docs: ' + count);
		});
	});
});

app.get('/emptyDb', function (req, res) {
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		emptyDb(db, 'blacklist10M', function() {
			db.close();
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify([]));
		});
	});
});

app.get('/dropDb', function (req, res) {
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		dropDb(db, 'blacklist10M', function() {
			db.close();
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify([]));
		});
	});
});

app.get('/dropAllDb', function (req, res) {
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		dropAllDb(db, function() {
			db.close();
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify([]));
		});
	});
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

function createListToDb(db, dbName, nbElements, callback) {
	insertDocuments(db, dbName, function (){
		count++;
		if (count < Math.floor(nbElements/10000)) {
			createListToDb(db, dbName, nbElements, callback);
		} else {
			callback();
		}
	});
}

function insertDocuments(db, dbName, callback) {
	var hrstart = process.hrtime();
	ids = new Array(10000);
	var hrend = process.hrtime(hrstart);
	console.log('Creating array: ' + hrend[1]/1000000 + 'ms');
	var hrstart = process.hrtime();
	for (var i = 0; i < 10000; i++) {
		ids[i] = {'id': createHexaId()};
	}
	var hrend = process.hrtime(hrstart);
	console.log('Filling array: ' + hrend[1]/1000000 + 'ms');
	var hrstart = process.hrtime();
	db.collection(dbName).insertMany(ids, function (err, result) {
		var hrend = process.hrtime(hrstart);
		console.log('Inserting elements: ' + hrend[1]/1000000 + 'ms');
		assert.equal(err, null);
		delete ids;
		callback();
  	});
};

function createDbIndex(db, dbName, callback) {
	db.collection(dbName).createIndex({'id': 1}, null, function (err, indexName) {
		callback(indexName);
	});
};

function countDocuments(db, dbName, callback) {
	var cursor = db.collection(dbName).find().count(function (err, count) {
		callback(count);
	});
};

function emptyDb(db, dbName, callback) {
	db.collection(dbName).deleteMany({}, function (err, results) {
		assert.equal(err, null);
		callback();
	});
}

function dropDb(db, dbName, callback) {
	db.collection(dbName).drop(function (err, results) {
		assert.equal(err, null);
		callback();
	});
}

function dropAllDb(db, callback) {
	db.dropDatabase(function (err, results) {
		assert.equal(err, null);
		callback();
	});
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

app.get('/benchmark10MDb', function (req, res) {
	time = 0;
	count = 0;
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		benchmarkDb(db, function() {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Total time: ' + time + 'ms' + '\n' + 'Mean time: ' + time/count + 'ms');
			console.log('Total time: ' + time + 'ms' + '\n' + 'Mean time: ' + time/count + 'ms');
		});
	});
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

function benchmarkDb(db, callback) {
	var id = createHexaId();
	var hrstart = process.hrtime();
	findInBlacklist(db, 'backlist10M', id, function() {
		var hrend = process.hrtime(hrstart);
		time += hrend[1]/1000000
		count++;
		if (count < 1000000) {
			benchmarkDb(db, callback);
		} else {
			db.close();
			callback();
		}
	});
}

function findInBlacklist(db, dbName, id, callback) {
	var cursor = db.collection(dbName).count({'id': id}, function(err, count) {
		assert.equal(err, null);
		if(count !== 0) {
			console.log('Found id: ' + id);
		}
		callback();
	});
}