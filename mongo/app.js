/************************************

 EXPRESS APP

************************************/

var express  =  require( 'express' );
var exphbs   =  require( 'express-handlebars' );
var multer   =  require( 'multer' );
var bodyParser = require('body-parser');
var util = require('util');


var fs = require('fs');


var app = express();
var database;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/data/uploads/');
  }
});

var upload   =  multer( { storage: storage } );
require( 'string.prototype.startswith' );

/************************************

 EXPRESS CONFIG

************************************/

app.use(express.static(__dirname + '/bower_components' ) );
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/data'));
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json());       // to support JSON-encoded bodies
//app.engine('html', require('ejs').renderFile);

// Create `ExpressHandlebars` instance with a default layout.
app.engine( '.hbs', exphbs( { extname: '.hbs' } ) );
app.set('view engine', '.hbs');

/************************************

 EXPRESS GET

************************************/

app.get( '/', function( req, res, next ){
	database.dbInfo(function(results){
		return res.render('index', {'books' : results});
	});
});

app.get( '/grid', function( req, res, next ){
  database.dbInfo(function(results){
    return res.render('grid', {'books' : results});
  });
});

app.get( '/trash', function( req, res, next ){
    fs.readdir("./data/trash",function(error,files){
      if(error) console.log(error);
        else{

          for(var i in files){
            if(/.+\.pdf/i.test(files[i])){
              curFile = files[i];  
              console.log(curFile);    
            }
          }

          database.searchDocsTrash(files, function(results){
            console.log(results);
            return res.render( 'trash',{'books' : results} );
          });

        }
    });
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

 EXPRESS GET for PDF images

************************************/

app.get(/(.*\.pdf)\/([0-9]+).png$/i, function (req, res) {
    var pdfPath = req.params[0];
    var pageNumber = req.params[1];
 
    var PDFImage = require("pdf-image").PDFImage;
    var pdfImage2 = new PDFImage('data/'+pdfPath, { convertOptions: {'-density': '36', '-trim':'' /*'-quality':'90' I don't think this works */}, convertExtension : 'png', outputDirectory : __dirname+'/data/thumbnails/' });



    pdfImage2.convertPage(pageNumber).then(function (imagePath) {

      //This part moves image from Done Folder to Thumbnail folder
      image = imagePath.split('/').pop();
      mv(imagePath, __dirname+'/data/thumbnails/'+image);

      //Send File to browser 
      //res.sendFile(imagePath, { root : __dirname});
      res.sendFile('data/thumbnails/'+image, { root : __dirname});
    }, function (err) {
      res.status(500).json( {
          error : err.message
        } );
    });
  });

/************************************

 EXPRESS GET BOOK URLS
 -- This is now used for Single View

************************************/
app.get('/:title/view', function(req, res) {
    var title = req.params.title;
    title = title.split('!!!!!!!!!!!!!!!!!!');//Ther should be an easier way.
    console.log(title);
    database.searchDocsTitle(title, function(results){
      console.log('Render Single View');
      return res.render( 'viewer',{'books' : results} );
    });
});

app.get('/:title/edit', function(req, res) {
    var title = req.params.title;
    title = title.split('!!!!!!!!!!!!!!!!!!');//Ther should be an easier way.
    console.log(title);
    database.searchDocsTitle(title, function(results){
      console.log('Render Single View');
      return res.render( 'single',{'books' : results} );
    });
});

/************************************

 EXPRESS GET FOR ALL UNMATCHED URLS
 -- This is now used for Single View

************************************/

/*
app.get('*', function(req, res) {

  //res.redirect("http://www.mysite.com/");
});*/


/************************************

 EXPRESS POST

************************************/
app.post( '/restore', function( req, res ) {
  database.restoreFile(req);
  // This was need for successful callback for ajax
  // This should probably be in a callback maybe inside the restoreFile request.... maybe....
  res.send(req.body);
}); 

app.post( '/delete', function( req, res ) {
  database.removeFileFromServer(req);
    // This was need for successful callback for ajax
  // This should probably be in a callback maybe inside the deleteFile request.... maybe....
  res.send(req.body);
}); 

app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {

	console.log("got a post from: " + req.file.filename);

	database.addFile(req.file, function(err, response){
	  	if(err){
	  		return res.status( 422 ).json( {
		      error : err.message
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

module.exports = {
  app: function(db){ 
    database = db;
    return app;
  }
}

/************************************

TEMPORARY FUNCTIONS FOR CRON INDEXING

************************************/

// var CronJob = require('cron').CronJob;
// //var //database = require('../database.js');
// //var elasticsearch = require('elasticsearch');
// //var client = new elasticsearch.Client();
// var fs = require('fs');
// //var tika = require('tika');
// var curFile = '';


// var job = new CronJob({
//     cronTime: '0 * * * * *',
//     onTick: function() {
//     fs.readdir("./data/uploads",function(error,files){
//         if(error) console.log(error);
//           else{
//             for(var i in files){
//                 if(/.+\.pdf/i.test(files[i])){
//                     curFile = files[i];
//                       //tika.extract(files[i], function(err, text, meta) {
//                         database.addFileCron(curFile, function(err, response){
//                             if(err){
//                               return res.status( 422 ).json( {
//                                 error : err.message
//                               } );
//                             } else {
//                               //createDocument(text, meta);

//                             }
//                         });  
                        
//                       //});
//                   }
//               }
//           }
//       });
//   },
//   start: false
// });
// job.start();






