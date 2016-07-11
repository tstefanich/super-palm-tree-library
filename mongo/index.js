var app = require('./app.js');

/*

Schedules will go here for now, if needed we can put them in a schedule.js file

*/

var schedule = require('node-schedule');
var cp = require('child_process');

// for testing, run this every 30 sec, might be more efficient to leave child_process running and
// schedule commands for the process to execute some code
var j = schedule.scheduleJob('30 * * * * *', function(){
	var trash = cp.fork('./schedules/trash');
	
	// This line will delete files that have not been modified for 30 days or more days
	// it looks like when we do mv() to move files this changes the last modifited time on 
	// on files 
	// find ~/data/trash/* -mtime +30 -exec rm -f {} \; 

	trash.on('close', (code) => console.log(`trash exited w/ code ${code}`));
});



app.listen( 8080, function() {  
  console.log( 'Express server listening on port 8080' );
});