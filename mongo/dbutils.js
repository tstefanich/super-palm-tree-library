/************************************

Command line interface

************************************/


if(process.argv.length < 3){
	var message = "\nPlease enter an argument: \n\n\tnode dbutils.js [place argument here] \n\n list of arguments: \n\tclear : removes all documents from database\n";
	done(message);
}

process.argv.forEach(function (val, index, array) {

// argument for clearing the database
  if(val === 'clear'){
  	// make sure you really want to do it
  	print('are you sure (y/n): ');
  	process.stdin.resume();
  	process.stdin.setEncoding('utf8');

  	process.stdin.on('data', function (text) {
	    if (text === 'n\n') {
	      done();
	    } else if(text === 'y\n'){
	    	process.stdin.pause();

	    	clearDatabase(function(){
				done("database cleared");
	    	});
	    }
	  });
// argument for returning number of docs in database
  } else if(val === 'count'){
  	countCollection(function(count){
  		done(count + " documents in collection");
  	});

  }
});

function print(message){
	console.log(message);
}

function done(message) {
	if(message) print(message);
    process.exit();
}


/************************************

Database Functions

************************************/

var mongoose;

function connectToDatabase(){
	mongoose = require('mongoose');

	print('connecting to database');
    var conn = mongoose.createConnection('mongodb://localhost/test');

	// use separate mongoose schema file once its created
	var Schema = mongoose.Schema;
	return Docs = conn.model('Document', new Schema({title: String, page: Number, text: String}),'documents');

}


function clearDatabase(callback){
	var model = connectToDatabase();
	model.remove({},function(err){
		
		if(err) done(err);

		mongoose.disconnect();

		callback();
	});
}

function countCollection(callback){
	var model = connectToDatabase();
	model.count({},function(err, result){
		
		if(err) done(err);

		mongoose.disconnect();

		callback(result);
	});
}

function clearSomeDocumentsFromCollection(searchTerm, callback) {
  var query = searchTerm + '.pdf';
  var model = connectToDatabase();
  model.remove({ title: query }, function (err) {
    if (err) return handleError(err);
    // removed!
  });
};

function removeFileFromServer(req){
  var filePath = req.body.filePath;
  fs.unlinkSync(filePath);
  clearSomeDocuments(db,filePath)
}


