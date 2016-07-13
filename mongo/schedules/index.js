// require some modules
var fs = require('fs');

function index(dir){

	var core = {
		checkDirectory: function(dir){
			
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



function checkDirectory(dir) {
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
}

function indexFiles(files){
	console.log(`indexing ${files.length} files`);
}

process.on('message', (m) => { 
	if(m.index){
		if(typeof m.dir != 'undefined') {
			p1 = new Promise((resolve, reject) => checkDirectory(m.dir));
			p1.then((results) => indexFiles(results));
			p1.catch((err) => console.log(err.message));
			
		} else {
			console.log('please specify a directort for attribute "dir"');
		}
	} else if (m.exit) {
		exit();
	} else {
		console.log('unrecognized message passed to child process');
	}
});