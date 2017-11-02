'use explicit';

const nCache = require('./lib/ncache.js');

function makeJSONMessage ( originalUsr, message, geocode, evt, mime, idname ){
	
	return (
			{
				"idname":idname,
				"evt":evt.trim().toLowerCase(),
				"origDate":(new Date()).toISOString().slice(11,22),
				"origUsr":originalUsr.trim().toLowerCase(),
				"mimeType":mime.trim().toLowerCase(),
				"msg":message,
				"geocode":geocode
			});
	
}

myTestCache = new nCache('test-cache');
myTestCache1 = new nCache('test-cache1');
myTestCache1.seedCache();

console.log(`Test[0]: Name match [${(myTestCache.getName()==='test-cache')}]`);

var i = 0 ;
for ( i =0 ; i<5 ; i++){
	var cO = myTestCache.generateCacheObj ( ''+i, i, 'application/'+i, i);

	myTestCache.put( cO );
	console.log(`Test[1]: Cachable Create item[${i}] [${(cO.key === ''+i)}][${(cO.ttl === i)}][${(cO.mimeType === 'application/'+i)}][${(cO.data === i)}] Size[${(myTestCache.size() === (i+1))}]`);

	
}


cO = null;

for ( i =0 ; i<5 ; i++){
	cO = myTestCache.get(''+i);
	console.log(`Test[2]: Cachable Retrieve item[${i}] [${(cO.key === ''+i)}][${(cO.ttl === i)}][${(cO.mimeType === 'application/'+i)}][${(cO.data === i)}]`);
}

cO = null;
for ( i = 0 ; i<6 ; i++){
	cO = myTestCache.get(''+(i+5));
	console.log(`Test[3]: Cachable Retrieve item[${i}] NotFound=${cO==null}`);
}


cO = null;
for ( i = 0 ; i<10 ; i++){
	
	console.log(`Test[4]: Cachable Contains item[${i}] NotFound=${myTestCache.contains(''+i)}`);
}


console.log(`myTestCache
			${myTestCache.toString()}`);

console.log(`myTestCache1
			${myTestCache1.toString()}`);
myTestCache.dumpCache();


cO = null;
for ( i = 0 ; i<10 ; i++){
	
	console.log(`Test[5]: Cachable Contains item[${i}] NotFound=${myTestCache1.contains(''+i)}`);
}

myTestCache3 = new nCache('testCache3');

cO = null;
for ( i = 0 ; i<10 ; i++){
	var jO = makeJSONMessage ( ''+i,'good message:'+i, 'x/'+i, 'evt'+i, 'app/json', 'id:'+i );
	var cO = myTestCache3.generateCacheObj ( jO.idname, i, jO.mimeType, JSON.stringify(jO));
	myTestCache3.put(cO);
	console.log(`Test[6]: Cachable Contains item[${i}] NotFound=${myTestCache3.contains(jO.idname)}`);
}

console.log(`myTestCache3
			${myTestCache3.toString()}`);


myTestCache3.dumpCache();




myTestCache4 = new nCache('testcache4');
myTestCache4.seedCache();

cO = null;
for ( i = 0 ; i<15 ; i++){
	
	console.log(`Test[7]: Cachable Contains item[${i}] NotFound=${myTestCache4.contains('id:'+i)}`);
}

for ( i = 0 ; i<10 ; i++){
	if ( myTestCache4.contains('id:'+i)) {
		var tO = myTestCache4.get('id:'+i);
		if ( tO != null ){
			if ( tO.mimeType === 'app/json'){
				var tOdata = JSON.parse(tO.data);
				if ( tOdata != null ){
					console.log(`test[8]: match Id[${(tOdata.idname==='id:'+i)}] match Msg[${(tOdata.msg==='good message:'+i)}]`);
				}else{
					console.log(`test[8]: todata[${i}] FAIL`);
				}
			} else{
				console.log(`test[8]: mimeType[${i}] FAIL`);
			}
		} else {
			console.log(`test[8]: tO[${i}] FAIL`);
		}
	} else {
		console.log(`test[8]: doesnt contain ${i}`);
	}
	
}


console.log(`myTestCache4
			${myTestCache4.toString()}`);

console.log('done');