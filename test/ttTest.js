const nCacheClient 			= require('../lib/nCacheClient');
const fs = require('fs');


var bodyxml  = fs.readFileSync("./sf.xml","UTF-8");

var myCache = new nCacheClient('127.0.0.1',5000);


myCache.on('cr_put',function (d){
	console.log('PUT:' + d);
});
myCache.on('cr_get',function (d){
	console.log('GET:' + JSON.stringify(d));
});
myCache.on('error',function (d){
	console.log('err:' + JSON.stringify(d));
});
var i=0;
for (i=0; i<process.argv[3] ; i++){

	try{
	
		myCache.put(process.argv[2]+i,bodyxml,'text',1000);
	} catch ( err ){
		console.log(`err:${err}`);
	}
}


//for (i=0; i<5 ; i++){
	
//	myCache.get(process.argv[2]+i);
	
//}


