require('shelljs/global');
var util = require('util');

/************************************

TEMPORARY SINGLETON FOR LIB

************************************/

var sptLIB = module.exports = {
  sayHelloInEnglish: function() {
    return "HELLO";
  },
       
  sayHelloInSpanish: function() {
    return "Hola";
  }
};


/************************************

TEMPORARY FUNCTION FOR SEARCH RESULTS

************************************/
function pagelist(items) {
  result = "<html><body><ul>";
  items.forEach(function(item) {
    console.log(item);
    itemstring = "<li>" + item.title + "<ul><li>Search term found on page - " + item.page +
      "</li></ul></li>";
    result = result + itemstring;
  });
  result = result + "</ul></body></html>";
  return result;
}

/************************************

 EXPRESS APP

************************************/

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
require( 'string.prototype.startswith' );

/************************************

 EXPRESS CONFIG

************************************/

var app = express();
var bodyParser = require('body-parser')
app.use( express.static( __dirname + '/bower_components' ) );
app.use(express.static(__dirname + '/views'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.engine('html', require('ejs').renderFile);
app.listen( 8080, function() {  
  console.log( 'Express server listening on port 8080' );
});

/************************************

 EXPRESS GET

************************************/

app.get( '/', function( req, res, next ){
  return res.render( 'index' );
});

app.get( '/upload', function( req, res, next ){
  return res.render( 'upload.html' );
});

app.get("/search", function(req, res, next) {
  if(req.query.s){
    var query = req.query.s;
    searchDocs(Document, query, function(items){
      //console.log('found cryptoanalysis results '+ items);
      return res.status( 200 ).send(pagelist(items));
    });
  } else {
    return res.render('search.html');
  }
});

/************************************

 EXPRESS POST

************************************/

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
  		error : 'server missing dependency. Install Brew then type "brew install poppler"'
  	});
  }

  var fileInfo = exec('pdfinfo ' + fileString).stdout;
  var numberOfPages = /Pages:\s+(\d+)/g.exec(fileInfo)[1];

  // Check to see if PDF has text
  var pdfTitle = /Title:\s+(\d+)/g.exec(fileInfo);
  if(pdfTitle == null){
    console.log('[ NO TITLE DATA ] whoops this pdf does not have title metadata');
  }

  var pdfAuthor = /Author:\s+(\d+)/g.exec(fileInfo);
  if(pdfAuthor == null){
    console.log('[ NO AUTHOR DATA ] whoops this pdf does not have author metadata');
  }

  // Check to see if PDF has metadata has Title, Author, (maybe these too --- subject, keywords)
  //var pdfMetaData = exec('pdftotext ' + fileString +' - | wc -l').stdout;
  //if(Number(pdfText) == 0){
  //  console.log('whoops this pdf is does not have metadata');
  //  //return res.status( 422 ).json ( { 
  //  //  error : 'please use adobe acrobat or PDFMtEd or another program to OCR your pdf.'
  //  //});
  //}

  console.time("pdftotext"); // on my comp this is averaging about 35s on 250pg book
  for(var p = 1; p < numberOfPages; p++){
  	// save text to file, 
  	// exec('pdftotext -f ' + p + ' -l ' + p + ' ' + fileString + ' ' + folderString + '-' + p + '.txt');
  	// text to stdout
  	var pageText = exec('pdftotext -f ' + p + ' -l ' + p + ' ' + fileString + ' -',{silent:true}).stdout;
  	// then I would pass it to mongo
  	var page = new Document({
  		title: folderString,
  		page: p,
  		text: pageText
  	});

  	if(typeof Document !== 'undefined') saveDocument(page);

  }
  console.timeEnd("pdftotext");

  // now that the pages are all separated, we have to manually add the text for each page to our db
  // exec('pdftotext')

  // method 2: pdfseparate, then pdftotext each separate page

  return res.status( 200 ).send( req.file );
});


/************************************

 DATABASE STUFF

************************************/

var mongoose = require('mongoose');

// connect to database
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var docSchema;
var Document;

// once connected, do stuff
db.once('open', function() {

  // we're connected!
	console.log('database connection successful');
  

  // define document schema
  docSchema = mongoose.Schema({
  	title: String,
  	page: Number,
  	text: String
  });

  // make sure to add any methods b4 defining the model
  docSchema.methods.test = function () {
  	// code that might do something, can reference self with 'this.title' etc.
  	console.log(this.title + " page: " + this.page + " complete");
  }

  // define document model
  Document = mongoose.model('Document', docSchema);

  // listAllDocs(Document);
  searchDocs(Document, 'cryptoanalysis', function(results){
    console.log('first search')
  });

  // create a dummy Doc and save it

  // var testDoc = new Document({title: 'My Second Document'});
  // console.log(testDoc.title);
  // saveDocument(testDoc);

});

/************************************

DATABASE FUNCTIONS

************************************/

function listAllDocs(DocModel)
{
	DocModel.find(function (err, docs) 
  {
		if (err) return console.error(err);
		//console.log(docs);
	});
}

function searchDocs(DocModel, keyword, callback)
{
	console.time('searchTime');
	var r = new RegExp(keyword,'');
  var items = [];
	DocModel.find({ 'text': {$regex:r}}, function(err, results){
		if (err) return console.error(err);
		
    // returns results array
		if(results.length > 0) {
			for (var nextResult of results){
				//console.log('page '+nextResult);
        items.push(nextResult);
			}
		} else {
			console.log('no results');
		}
		console.timeEnd('searchTime');
    //console.log(items);
    callback(items);
	});

}

function saveDocument(doc){
	doc.save(function (err, doc) {
		if (err) return console.error(err);
		doc.test(); // maybe run the function if you feel like it
	});
}