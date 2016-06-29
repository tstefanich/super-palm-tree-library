var chai = require('chai');
var expect = chai.expect;

var sql = require('../sql.js');

var file = "palmtree.db";
var exists;

sql.init("texts",file);

describe('sqlTimes', function(){
	it('should return some results',function(){
		var currentResults;
		sql.search("africa", function(err, results){
			currentResults = results;
			expect(currentResults).to.exist;
			done();
		});
	});
});

sql.close();