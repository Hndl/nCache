'use explicit'

const app		= require('express');

const CacheT_Default		= "?";
const CacheT_Undeclared		= "undefined";
const maxCache = 5;
/*
const TestObj		= '{"value":"james","value2":"bob"}';
const TestObj1		= '{"value":"james9","value2":"bob9"}';
const TestObj2		= '{"value":"james8","value2":"bob8"}';
*/
/* Really Simply Cache Mech - obj! */
/*
_cache = {'0001':'clive','00002':'michelle','0003':'{"value":"james1","value2":"bob1"}'};
*/
_cache = {};

function mkCacheOfTypeT(key, ttl,mimeType, cacheValue )	{
	return (
			{
				"key":key,
				"ttl":ttl,
				"createOnDate":(new Date()),
				"mimeType":mimeType,
				"value":cacheValue
			}
		);
}

var i = 0;

console.log("TEST: build cache ");
for ( i = 0 ; i < maxCache ; i++){
	o = mkCacheOfTypeT(i,i,i,i);
	_cache[''+i] = o;
}
console.log ('cache loaded..');

console.log("============================TEST: sequence access + some not stored items============================");
for ( i = 0 ; i < maxCache+5 ; i++){
	//console.log('o:$j',o);
	var ro = _cache[''+i];
	
	if ( ro == null ){
		console.log('not located:$i',i);
	} else {
		console.log('found:$j',ro.key);	
	}
}


console.log("============================TEST: random access============================");
for ( i = 0 ; i < 10 ; i++){
	var targetItem = Math.floor(Math.random() * 10);

	var ro = _cache[''+targetItem];
	
	if ( ro == null ){
		console.log('not located:$i',targetItem);
	} else {
		console.log('found:$j',ro);	
	}
}


console.log("============================TEST: sequence access + with updates============================");
for ( i = 0 ; i < maxCache+5 ; i++){
	var ro = _cache[''+i];
	
	if ( ro == null ){
		console.log('not located:$i',i);
	} else {
		ro.value = ro.value + ":" + ro.value
		console.log('found:$j',ro.value);	
	}
}
console.log("============================TEST: sequence access + some not stored items============================");
for ( i = 0 ; i < maxCache+5 ; i++){
	//console.log('o:$j',o);
	var ro = _cache[''+i];
	
	if ( ro == null ){
		if ( i >= 5){
			console.log('PASS - should not of found items >= 5.... looking for $s',i);
		} else {
			console.log('FAIL - should not of found items >= 5.... looking for $s',i);
		}
		
	} else {
		if ( i < 5 ){
			console.log('PASS - should have found items < 5.... looking for $s',i);
			var expvale = ro.key + ":" + ro.key;
			if (expvale === ro.value){
				console.log('PASS - key & value show update .... looking for $s=$s',expvale,ro.value);
			} else {
				console.log('FAIL - key & value show update .... looking for $s=$s',expvale,ro.value);	
			}
		} else {
			console.log('FAIL - should have found items  <5.... looking for $s',i);
		}

	}
}




process.exit(0);



