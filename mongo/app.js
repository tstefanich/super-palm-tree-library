/************************************

 EXPRESS APP

************************************/

var express  =  require( 'express' );
var exphbs   =  require( 'express-handlebars' );
var multer   =  require( 'multer' );
var bodyParser = require('body-parser');
var util = require('util');

// load in database module
var database = require('./database.js');
database.init();

var app = express();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/uploads/');
  }
});

var upload   =  multer( { storage: storage } );
require( 'string.prototype.startswith' );

/************************************

 EXPRESS CONFIG

************************************/

app.use(express.static( __dirname + '/bower_components' ) );
app.use(express.static(__dirname + '/views'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
}))
//app.engine('html', require('ejs').renderFile);
app.engine( '.hbs', exphbs( { extname: '.hbs' } ) );
app.set('view engine', '.hbs');

/************************************

 EXPRESS GET

************************************/

app.get( '/', function( req, res, next ){

	// potentially add option to pass custom aggregate object,, right now its 
	// { $group: 
	//     { _id: '$title', totalPages: { $sum: 1 } } 
	// }
	database.dbInfo(function(results){
		return res.render('index', {'userlist' : results});
	});
    //Document.find({}, {}, function(e, docs) { // .distict vs .find
      //var books = collapsePagesIntoBooks(docs);
      //console.log(docs);
      //return res.render('index', {'userlist' : books});
    //});
    //return res.render( 'index' );
    //return res.render('index', {'userlist' : docs});
});

app.get( '/upload', function( req, res, next ){
  return res.render( 'upload' );
});

app.get("/search", function(req, res, next) {
  if(req.query.s){
    var query = req.query.s;
    database.searchDocs(query, function(items){
      //console.log('found cryptoanalysis results '+ items);
      //return res.status( 200 ).send(items);
      res.render('search', {'search_results' : items});
    });
  } else {
    return res.render('search');
  }
});

/************************************

 EXPRESS POST

************************************/
app.post( '/delete', function( req, res ) {
  database.removeFileFromServer(req);
}); 

app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {

	console.log("got a post from: " + req.file.filename);

	database.addFile(req.file, function(err, response){
	  	if(err){
	  		return res.status( 422 ).json( {
		      error : err.text
		    } );
	  	} else {
	  		return res.status( 200 ).send( response );
	  	}
	});  
});

/************************************

TEMPORARY FUNCTIONS FOR SEARCH RESULTS

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

var books = {};
function collapsePagesIntoBooks(data)
{
  data.forEach(function(doc, index) { // Maybe change the type of loop
      var currentBook = doc.title;
      if(books[currentBook] === undefined){
        books[currentBook] = 0;
      }
      books[currentBook] += 1;
  });

  // Loop to print only the Unique books 
  for(var prop in books){
    console.log("the book is "+prop+": with this many pages" +books[prop]);
  }
  return books;
}


module.exports = app;