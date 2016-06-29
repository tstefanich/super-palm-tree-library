var fs = require("fs");
var sqlite3 = require("sqlite3").verbose();

module.exports = {

	db:{database:null,name:null},

	checkForDBFile: function(filename){
		return fs.existsSync(filename);
	},

	init: function(dbname,filename){
		if(this.db.database === null){
			this.db.name = dbname;
			this.db.database = new sqlite3.Database(filename);
		}
		return this.db;
	},

	new: function(columnNames,tokenizer){
		var columnString = columnNames.join(',');
		this.db.database.run("CREATE VIRTUAL TABLE "+this.db.name+" USING fts4("+columnString+", tokenize="+tokenizer+")");
	},

	add: function(dbObject){
		//split db object, and create comma separated lists of columns and values
		var columns = [];
		var values = [];
		var questions = [];
		for (var key in dbObject) {
			if (dbObject.hasOwnProperty(key)) {
				columns.push(key);
				values.push(dbObject[key]);
				questions.push('?');
			}
		}
		this.db.database.run("BEGIN TRANSACTION");
		this.db.database.run("INSERT OR IGNORE INTO "+this.db.name+" ("+columns.join(',')+") VALUES ("+questions.join(',')+")",values);
		this.db.database.run("END");
	},

	search: function(query, callback){
		this.db.database.all("SELECT * FROM "+this.db.name+" WHERE text MATCH '\""+query+"\"';", callback);
	},

	close: function(){
		this.db.database.close();
	}
}
