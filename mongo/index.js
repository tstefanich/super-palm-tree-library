require('shelljs/global');
var util = require('util');

// EXPRESS APP

var express  =  require( 'express' );
var multer   =  require( 'multer' );

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload   =  multer( { storage: storage } );

var exphbs   =  require( 'express-handlebars' );
require( 'string.prototype.startswith' );

var app = express();

app.use( express.static( __dirname + '/bower_components' ) );

app.engine( '.hbs', exphbs( { extname: '.hbs' } ) );
app.set('view engine', '.hbs');

app.get( '/', function( req, res, next ){
  return res.render( 'index' );
});

app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {

	console.log("got a post from: " + req.file.filename);

  if ( !req.file.mimetype.startsWith( 'application/pdf' ) ) {
    return res.status( 422 ).json( {
      error : 'The uploaded file must be a pdf'
    } );
  }

  // I think this is where I'd start doing stuff,,,
  // 
  // RUN A BUNCH OF SHELL STUFF

  cd('uploads');
  var fileString = req.file.originalname;
  var folderString = fileString.slice(0,-4);
  mkdir(folderString);
  mv(fileString,folderString);
  cd(folderString);

  // method 1: get number of pages and pdftotext each page, send stdout of pdftotext
  // directly to mongo,, upside: no extra files,, downside: if we wanted to return just 
  // the page of the pdf (i.e. if we wanted to display it) we would have to 
  // send the whole book

  // grab pdf info
  if(!which('pdfinfo')){
  	console.log('whoops you need to install pdfseparate');
  	return res.status( 422 ).json ( { 
  		error : 'server missing dependency'
  	});
  }
  var fileInfo = exec('pdfinfo ' + fileString).stdout;
  var numberOfPages = /Pages:\s+(\d+)/g.exec(fileInfo)[1];

  for(var p = 1; p < 10; p++){
  	// save text to file
  	exec('pdftotext -f ' + p + ' -l ' + p + ' ' + fileString + ' ' + folderString + '-' + p + '.txt');
  	// text to stdout
  	// var pageText = exec('pdftotext -f ' + p + ' -l ' + p + ' ' + fileString + ' -').stdout;
  	// then I would pass it to mongo
  }

  // now that the pages are all separated, we have to manually add the text for each page to our db
  // exec('pdftotext')

  // method 2: pdfseparate, then pdftotext each separate page

  return res.status( 200 ).send( req.file );
});

app.listen( 8080, function() {
  console.log( 'Express server listening on port 8080' );
});

// DATABASE STUFF

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