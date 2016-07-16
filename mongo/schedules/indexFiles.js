// require some modules
var fs = require('fs');
var database = require('../database.js');

function checkDirectory(dir){
	return promise = new Promise( function(resolve, reject){
		fs.readdir(dir, (err, files) => {
			if(err){
				reject(err);
			} 

			if(files.length == 0){
				reject({message: "no files to index"});
			} else {
				console.log(`found ${files.length} files`);
				resolve(files);
			}
		
		});
	});
}

function openDatabaseConnection(){
	return promise = new Promise( function(resolve, reject){
		database.init().then((db) => resolve(db));
	});
}

function indexFiles(db, dir, files){
	return promise = new Promise( function(resolve, reject){

		if(db == null || typeof db == 'undefined'){
			reject({message: "must pass database"});
		} 

		console.log(`indexing ${files.length} files`);
		for(file of files){
			if( /.+\.pdf/i.test(file) ){
                db.addFileCron(file, dir, function(err, response){
                    if(err) reject(err);
                });         
            }
		}
		resolve(files);
	});
}

function cleanupFiles(){
	return promise = new Promise(function(resolve,reject){
		// this is where I'd move the files to the indexed files folder
		resolve();
	});
}

function exit(){
	process.exit();
}


process.on('message', (m) => { 
	if(m.index){
		if(typeof m.dir != 'undefined') {
			var files;
			checkDirectory(m.dir)
				.then((filesToIndex) => {
					files = filesToIndex;
					return openDatabaseConnection();
				})
				.then((db) => {return indexFiles(db, m.dir, files)})
				.then((indexedFiles) => {return cleanupFiles(indexedFiles)})
				.then(console.log("indexing complete"))
				.catch((err) => console.log(err.message));
			
		} else {
			console.log('please specify a directory for attribute "dir"');
		}
	} else if (m.exit) {
		exit();
	} else {
		console.log('unrecognized message passed to child process');
	}
});