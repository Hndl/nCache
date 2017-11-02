'use explicit';

nCache = require('./lib/ncache.js');

myTestCache = new nCache('test-cache');


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



console.log(`${myTestCache.toString()}`);

console.log('done');