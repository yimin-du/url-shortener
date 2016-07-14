var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var dburl = process.env.MONGO_URI;

app.get('/', (req, res) => {
	res.send('./public/index.html');
});

app.get('/:param', (req, res) => {
	var param = req.params.param;
	if(isNaN(param)) {
		// create a new db doc: { url: param, id: randomNum }, and update db
		mongoClient.connect(dburl, (err, db) => {
			if(err) {
				res.send(500);
			} else {
				var id = Math.round(Math.random() * 9999 + 1);
				db.collection('urlmap').updateOne(
					{ url: param },
					{
						$set: { id: id },
						$currentDate: { lastModified: true }
					},
					{ upsert: true }
				);
				db.close();

				// return { "original_url": param, "shortened_url": shortUrl }
				var shortUrl = "https://short-my-url.herokuapp.com/" + id;
				res.send({
					"original_url": param, 
					"shortened_url": shortUrl
				});
			}

		})
	} else {
		console.log("a num: ", param);
		// query { id: param } to db
		// if success, redirect to url; else return error
		mongoClient.connect(dburl, (err, db) => {
			if(err) {
				res.send(500);
			} else {
				console.log("query: ", { id: Number(param) });
				db.collection('urlmap').find({ id: Number(param) }).toArray((err, items) => {
					if(items.length > 0) {
						console.log(items[0].url);
						res.redirect(301, 'http://' + items[0].url);
					} else {
						res.send(404);
					}

				});
			}

			db.close();
		})
	}
});





app.listen(port);