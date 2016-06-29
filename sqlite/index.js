// var fs = require("fs");
// var file = "ftsTest.db";
// var exists = fs.existsSync(file);

// var sqlite3 = require("sqlite3").verbose();
// var db = new sqlite3.Database(file);
var util = require('util');
require('shelljs/global');

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
/************************************

 EXPRESS APP

************************************/

var express  =  require( 'express' );
var exphbs   =  require( 'express-handlebars' );
var multer   =  require( 'multer' );

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

var app = express();
var bodyParser = require('body-parser')
app.use(express.static( __dirname + '/bower_components' ) );
app.use(express.static(__dirname + '/views'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
//app.engine('html', require('ejs').renderFile);
app.engine( '.hbs', exphbs( { extname: '.hbs' } ) );
app.set('view engine', '.hbs');



/************************************

 EXPRESS GET

************************************/

app.get( '/', function( req, res, next ){
  // Document.aggregate(
  //   { $group: 
  //     { _id: '$title', totalPages: { $sum: 1 } } 
  //   },
  //   function (err, results) {
  //     if (err) return handleError(err);
  //     console.log(results);
  //     return res.render('index', {'userlist' : results});
  //  }
  // );
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
    sql.search(query,function(err,items){
    	for (item of items){
    		console.log(item.page);
    	}
    	res.render('search',{'search_results' : items});
    });
    // searchDocs(Document, query, function(items){
    //   //console.log('found cryptoanalysis results '+ items);
    //   //return res.status( 200 ).send(items);
    //   res.render('search', {'search_results' : items});
    // });
  } else {
    return res.render('search');
  }
});


/************************************

 EXPRESS POST

************************************/


app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {
	if(!which('pdfinfo')){
	  	console.log('whoops you need to install poppler');
	  	return res.status( 422 ).json ( { 
	  		error : 'server missing dependency. Install Brew then type "brew install poppler"'
	  	});
	}

	// rename file
	cd(__dirname + '/uploads');
	// some issues with shell when '&' appears in filename, this is a temporary solution
	var fileString = req.file.originalname.replace('&','and');
	var folderString = fileString.slice(0,-4);
	mv(req.file.filename,fileString);

	console.log(fileString);

	var fileInfo = exec('pdfinfo ' + fileString).stdout;
	var numberOfPages = /Pages:\s+(\d+)/g.exec(fileInfo)[1];

	// Check to see if PDF has text
	var pdfTitle = /Title:\s+(\w+.*)/g.exec(fileInfo);
	if(pdfTitle == null){
	console.log('[ NO TITLE DATA ] whoops this pdf does not have title metadata');
	}

	var pdfAuthor = /Author:\s+(\w+.*)/g.exec(fileInfo);
	console.log('author' + pdfAuthor);
	if(pdfAuthor == null){
	console.log('[ NO AUTHOR DATA ] whoops this pdf does not have author metadata');
	}

	console.time("pdftotext"); // on my comp this is averaging about 35s on 250pg book


	for(var p = 1; p < numberOfPages; p++){
		// save text to file, 
		// exec('pdftotext -f ' + p + ' -l ' + p + ' ' + fileString + ' ' + folderString + '-' + p + '.txt');
		// text to stdout
		var pageText = exec('pdftotext -f ' + p + ' -l ' + p + ' ' + fileString + ' -',{silent:true}).stdout;
		// then I would pass it to mongo
		var page = {
			title: folderString,
			page: p,
			text: pageText
		};

		sql.add(page);

	}

	console.timeEnd("pdftotext");

	cd(__dirname);


	return res.status( 200 ).send( req.file );
});



app.listen( 8080, function() {  
  console.log( 'Express server listening on port 8080' );
});


/************************************

 SQLITE

************************************/



var sql = require('./sql.js');
var file = "palmtree.db";
var exists = sql.checkForDBFile(file);

sql.init('palmtree',file);

if (!exists) {
	sql.new(['title','page','text'],'porter');
}


// db.serialize(function() {
	// if (!exists) {
		// lookng into tokenizers, the porter one is at least optimized for english stems,
		// however it most likely doesn't work well with unicode (hence the 'unicode61' tokenizer)
		// also its english only it looks like (seems like the icu tokenizer is possible)
		// It is not clear from the docs (https://www.sqlite.org/fts3.html#tokenizer) if
		// combining tokens is possible,, though custom tokenizers can be written
		// db.run("CREATE VIRTUAL TABLE texts USING fts4(title, body, tokenize=porter)");
		// sql.new(['title','page','text'],'porter');
		// Testing intsertion,, need to test times for this statement and the prepare/finalize below
		// var text1 = "I tried to imitate this and saw almost no performance difference. Am I doing it wrong? Right now, the data retrieves from the API much faster than it writes to the DB, though it's not intolerably slow. But pummeling the DB with 600K individual INSERT commands feels clumsy.";
		// var text2 = "One could draw lines on maps of Africa, the Middle East, and Central Asia that mark the boundary between desert and conventionally arable land. These are lines that may be moving as temperatures and rates of evaporation rise, causing all sorts of strife in Eritrea, Ethiopia, Somalia, Sudan, Chad, Niger, Mali, Mauritania, Senegal, Syria, Iraq, Iran, Afghanistan, and Pakistan";
		// db.run("BEGIN TRANSACTION");
		// db.run("INSERT OR IGNORE INTO texts (title, body) VALUES (?,?)","text1",text1);
		// db.run("INSERT OR IGNORE INTO texts (title, body) VALUES (?,?)","text2",text2);
		// db.run("END");
		// sql.add({
		// 	'title':'text1',
		// 	'body':text1
		// });

		// sql.add({
		// 	'title':'text2',
		// 	'body':text2
		// });

		// var stmt = db.prepare("INSERT INTO stuff VALUES (?)");
		// // insert random data
		// var rnd;
		// for (var i = 0; i < 10; i++) {
		// 	rnd = Math.floor(Math.random() * 10000000);
		// 	stmt.run("THING #" + rnd);
		// }
		// stmt.finalize();
	// }
	// listing rows
	// db.each("SELECT rowid AS id, title FROM texts", function(err, row) {
	// 	console.log(row.id + ": " + row.title);
	// });

	// example search

	//Query for all documents that contain the phrase "linux applications".

	// runs function on each result object
	// db.each("SELECT * FROM texts WHERE texts MATCH '\"Central Asia\"';",function(err,row) {
	// 	console.log(row.title);
	// });

	// sql.addToDatabase({
	// 	'title':'coolTitle',
	// 	'body':'hotbody'
	// });

	// callback function returns array of result objects
	// var results = sql.search("Central Asia",function(err, results){
	// 	for ( result of results) {
	// 		console.log(result.title);
	// 	}
	// });
	

	// db.all("SELECT * FROM texts WHERE texts MATCH '\"Central Asia\"';",function(err,results) {
	// 	for ( result of results) {
	// 		console.log(result.title);
	// 	}
	// });
// });

