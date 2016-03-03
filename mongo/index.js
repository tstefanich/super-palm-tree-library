var mongoose = require('mongoose');

// connect to database
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


// once connected, do stuff
db.once('open', function() {
	console.log('database connection successful');
  // we're connected!

  // define document schema
  var docSchema = mongoose.Schema({
  	title: String
  });

  // make sure to add any methods b4 defining the model
  docSchema.methods.test = function () {
  	// code that might do something, can reference self with 'this.title' etc.
  	console.log(this.title + "'s test function");
  }

  // define document model
  var Document = mongoose.model('Document', docSchema);

  // listAllDocs(Document);
  searchDocs(Document, 'Second');

  // create a dummy Doc and save it

  // var testDoc = new Document({title: 'My Second Document'});
  // console.log(testDoc.title);
  // saveDocument(testDoc);

});

function listAllDocs(DocModel){
	DocModel.find(function (err, docs) {
		if (err) return console.error(err);
		console.log(docs);
	});
}

function searchDocs(DocModel, keyword){
	var r = new RegExp(keyword,'');
	DocModel.find({ 'title': {$regex:r}}, function(err, results){
		if (err) return console.error(err);
		// returns results array
		if(results.length > 0) {
			console.log('found: ' + results[0]);
		} else {
			console.log('no results');
		}
		
	});
}

function saveDocument(doc){
	doc.save(function (err, doc) {
		if (err) return console.error(err);
		doc.test(); // maybe run the function if you feel like it
	});
}