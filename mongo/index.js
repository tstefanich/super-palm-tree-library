var schedule = require('node-schedule');
var cp = require('child_process');

var children = [];

// load in database module
var database = require('./database.js');
// when db has init, pass to app and setup scheduler
database.init()
    .then((db) => {

        var app = require('./app.js').app(db);

        var index = cp.fork(__dirname + '/schedules/indexFiles.js');

        index.on('message', (response) => console.log(response));
        index.on('close', (code) => console.log(`index exited w/ code ${code}`));

        var indexingSchedule = schedule.scheduleJob('10 * * * *', () => {
            index.send({
                index : true, 
                dir : './data/uploads'
            })
        });

        children.push(index); // store any child processes for later

        app.listen( 8080, function() {  
          console.log( 'Express server listening on port 8080' );
        });


    })
    .catch((err) => console.log("uh oh: " + err.message)); 


var j = schedule.scheduleJob('30 * * * * *', function(){
    console.log('Trash Cron Success');
	var trash = exec('find ./data/trash/* -mtime +30 -exec rm -f {} \\; ').stdout;
	//var trash = cp.fork('./schedules/trash');
	//trash.on('close', (code) => console.log(`trash exited w/ code ${code}`));
});




var b = schedule.scheduleJob('30 * * * * *', function(){
    var d = new Date();
    var curr_date = d.getDate();
    var curr_month = d.getMonth() + 1; //Months are zero based
    var curr_year = d.getFullYear();
    console.log(curr_date + "-" + curr_month + "-" + curr_year);


    console.log('Database Backup Cron Success');
    var trashBackups = exec('find ./data/dbBackups/* -mtime +30 -exec rm -f {} \\; ').stdout;
    //sudo mongodump --db newdb --out /var/backups/mongobackups/`date +"%m-%d-%y"`
    //3 3 * * * `
    var dbBackups = exec('mongodump --out ./data/dbBackups/date-'+curr_year + '-' + curr_month + '-' +curr_date+'').stdout;
    //    find /var/backups/mongobackups/ -mtime +7 -exec rm -rf {} \;
    //var trash = exec('find ./data/trash/* -mtime +30 -exec rm -f {} \\; ').stdout;
    //var trash = cp.fork('./schedules/trash');
    //trash.on('close', (code) => console.log(`trash exited w/ code ${code}`));
});

// var j = schedule.scheduleJob('30 * * * * *', function(){
// 	var trash = cp.fork('./schedules/trash');
// 	trash.on('close', (code) => console.log(`trash exited w/ code ${code}`));
// });


// dealing with exit since we've got children
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

// process.exit()
process.on('exit', exitHandler.bind(null,{cleanup:true}));
// ctrl+c
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
// uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
