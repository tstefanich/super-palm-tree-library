// require some modules
var fs = require('fs');

// check if there are files in the trash folder, 
// use path based the location of the file calling it (should pass the path string then to avoid confusion)
fs.readdir('./trash', (err, files) => {
	if(err){
		console.log(err.message);
	} else {
		console.log(`found ${files.length} files`);
		for(file in files){
			console.log(file);
			// do something with file

			// update database?
		}
	}
});