// require some modules
var fs = require('fs');

function index(){

	var core = {
		checkDirectory: function(dir){
			var promise = new Promise( function(resolve, reject){
				fs.readdir(dir, (err, files) => {
					if(err){
						reject(err.message);
					} else {
						console.log(`found ${files.length} files`);
						for(file in files){
							console.log(file);
							// do something with file

							// update database?
						}
						resolve(files);
					}
				});
			});
			return promise;
		},
		exit: function(){
			process.exit();
		}
	} 

	return {
		'areThereFilesIn' : function(dir){
			return core.checkDirectory(dir);
		},
		'exit'	: function(){ core.exit() }
	}
}

function indexFiles(files){
	console.log(`indexing ${files.length} files`);
}

process.on('message', (m) => { 
	if(m.index){
		if(typeof m.dir != 'undefined') {

			index()
				.areThereFilesIn(m.dir)
				.then((results) => indexFiles(results),(err) => console.log(err.message));
			
		} else {
			console.log('please specify a directort for attribute "dir"');
		}
	} else if (m.exit) {
		exit();
	} else {
		console.log('unrecognized message passed to child process');
	}
});