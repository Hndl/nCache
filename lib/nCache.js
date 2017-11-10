'use explicit'
const fs 	= require('fs');
const path	= require('path');

const DIR_DATASTORE	=	"data";
const DIR_CURR		=	".";
const EXT 			=	".ncdb";
const CHARSET_UTF8	=	"utf-8";

/*	Version		Who		Date 			Tag
 * 	2.0.0		CGB		Nov 9th 2017	IMP-11-01	Add getKeys & getKeysLike
 *  2.0.1		CGB		Nov10th 2017	IMP-11-02	Add remove key
 *
 */


/**
 * TODO compress the payloads in the cache.
 * TODO encryt the payloads in the cache.
 * TODO create feature to walk the object structT looking for expired object :DONE
 */
module.exports = class nCache {
	constructor( name ){
		//nothing
		if ( name == null || name.trim().length === 0){
			name = 'undefined';
		}
		this._size = 0;
		this._name = name;
		this._cache = {};
	}
	getName(){
		return ( this._name);
	}
	getKeysLike( arg ){
		return ( this._getKeys().filter(k=> k.indexOf(arg)>-1 ));
	}
	getKeys(){
		return  (Object.keys(this._cache));
	}
	size(){
		return ( this._size);
	}
	remove( cacheKey ){
		let b = true;
		try{
			delete this._cache[ cacheKey];
		} catch ( err ){
			b = false;
		}
		return (b);
	}
	cleanAll(){
		
		this._cache = {};
		this._size = 0;
		return ( true);
	}

	toString () {
		return (`_cache[${this._name}][${(this._size)}][${JSON.stringify( this._cache)}`);
	}

	put ( cacheObj ) {
		try{
			this._put( cacheObj.key, cacheObj);
		} catch ( err ){
			throw (err);
		}
		return (true);
	}

	_put ( key, value ) {
		try{
			if ( key == null || key.length === 0)  {
				return (false);
			} else {
				// Note: dont test the value for null/zero len - cant be sure we know what people want to cache...
				this._cache[key] = value;
				this._size++;
			}
		} catch ( err ){
			throw (err);
		}
		return (true);
	}//end Method:put

	_setExpired ( cO ) {
		if ( cO == null ){
			return (cO);
		} 
		if ( cO.ttl === -1) { // never expire
			cO.expired = false; 
		} else{
			cO.expired = ( (cO.createOnDate + cO.ttl) < ((new Date()).getTime()) );
		}
		//cO.expired = ( (cO.createOnDate + cO.ttl) < ((new Date()).getTime()) );
		
		return (cO);
	}

	get ( key ) {
		try{
			if ( key == null || key.length === 0)  {
				return (null);
			} else {
				return ( this._setExpired(this._cache[ key ]) );
			}
		}catch ( err){
			throw (err);
		}
		return ( null);
	} //end Method:get

	contains ( key ) {
		return ( this.get(key) != null ) ;
	}

	//TODO swap createonData to be milliseconds since 1970!,
	generateCacheObj ( key, ttl, mimeType, data){
		return (
			{
				"key":key,
				"expired":false,
				"ttl":ttl,
				"createOnDate":( (new Date()).getTime() ), //milliseconds since midnight 1970.
				"mimeType":mimeType,
				"data":data
			}
		);
	}

	dumpCache(){
		try{
			fs.writeFile(path.join(DIR_CURR,DIR_DATASTORE,this._name+EXT), JSON.stringify(this._cache), CHARSET_UTF8, function (err) {
		    	if (err) {
		        	console.log(err);
		    	}
			}); 
		} catch ( err ){
			throw (err);
		}
	}

	seedCache(){
		try{
			//TODO add the md5 checksum to each item, then, once seeded, expire those items which dont match.
			
			var incomingData = fs.readFileSync(path.join(DIR_CURR,DIR_DATASTORE,this._name+EXT),CHARSET_UTF8);
			this._cache = JSON.parse(incomingData);
			this._size = Object.keys(this._cache).length;

			/* bit me! I know it's not the way!
			var seedingStream = fs.createReadStream (path.join('.',this._name+'.ncdb'),'utf8');

			seedingStream.on('data', function ( data ){
				incomingData+=data;
				console.log(data);
			});

			seedingStream.on('end', function ( data ){
				try{
					this._cache = JSON.parse(incomingData);
				}catch (err){
					console.log('cache seed err: ', err);
				}
			});
			*/
		} catch ( err ){
			throw (err);
		}
		
	}

}//end Class::nCache










