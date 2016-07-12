// var app = require('./app.js');

/*

Schedules will go here for now, if needed we can put them in a schedule.js file

*/

var schedule = require('node-schedule');
var cp = require('child_process');

// for testing, run this every 30 sec, might be more efficient to leave child_process running and
// schedule commands for the process to execute some code

// var j = schedule.scheduleJob('30 * * * * *', function(){
// 	var trash = cp.fork('./schedules/trash');
// 	trash.on('close', (code) => console.log(`trash exited w/ code ${code}`));
// });

var children = [];

var index = cp.fork(__dirname + '/schedules/index.js');

index.on('message', (response) => console.log(response));
index.on('close', (code) => console.log(`index exited w/ code ${code}`));

var indexingSchedule = schedule.scheduleJob('10 * * * * *', () => {
	index.send({index: true, dir: './unindexed-files'})
});

children.push(index); // store in collection



// app.listen( 8080, function() {  
//   console.log( 'Express server listening on port 8080' );
// });



// dealing with exit now that we've got children, not totally sure how/why all of this
// is working, if there's a cleaner way to have this happen let me know

function exitHandler(options, err) {

    if (options.cleanup) {
    	console.log( `\nShutting down ${children.length} process(es)` );
    	// clean up child processes
		for(child of children){
			child.send({exit : true});
		}
    }
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing

// process.exit()
process.on('exit', exitHandler.bind(null,{cleanup:true}));
// ctrl+c
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
// uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));