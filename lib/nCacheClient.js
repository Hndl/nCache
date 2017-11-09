'use explicit'
const fs 	= require('fs');
const path	= require('path');
const http	= require('http');
const EventEmitter = require('events');


const HTTP_ROUTE_PUT	= 0;
const HTTP_ROUTE_GET	= 1 ;
const HTTP_METHOD_POST	= 2;
const HTTP_METHOD_GET	= 3;
const HTTP_CONTENTTYPE	= 4;
const HTTP_COOKIE		= 5;

const HTTP_HEADER		= ['/wCache/put','/wCache/get','POST','GET','application/json','cookie'];
const EVT				= ['data','end','error','cr_put','cr_get'];
const EVT_HTTP_DATA		= 0;
const EVT_HTTP_END		= 1;
const EVT_HTTP_ERR		= 2;
const EVT_TTCACHE_PUT	= 3;
const EVT_TTCACHE_ERR	= 1;
const EVT_TTCACHE_GET	= 4;

const ENCODINGS			= ['base64','ascii'];
const ENC_B64			= 0;
const ENC_ASC			= 1;



module.exports = class nCacheClient extends EventEmitter{
	constructor( host, port ){
		super();
		this._host = host;
		this._port = port;
	}
	
	
	/**
	 * method: put
	 *  args: 
	 *			key: 		<string> 	- a key by which to reference the data
	 *	 		data: 		<string>	- 
	 *			mimeType:   <string>	- describe the type of data stored in the data field. eg. application/json
	 *			ttl:        <integer> 	- positive integer. represents milliseconds.
	 * Events:
	 *			'cr_put', <pojo> 
	 *			'error' , <err>
	 */
	put ( key, data,mimeType, ttl ) {
		let _this = this;
		try{	
			let oBody = this._generateCacheObj (key,ttl,mimeType,(new Buffer(data).toString(ENCODINGS[ENC_B64])));		
    		let req = http.request( this._requestOptions(HTTP_HEADER[HTTP_ROUTE_PUT],HTTP_HEADER[HTTP_METHOD_POST],oBody), function( res )    {
				var buffer = "";
   				res.on( EVT[EVT_HTTP_DATA], function( data ) 	{ buffer = buffer + data; });
				res.on( EVT[EVT_HTTP_END], 	function( data ) 	{ _this.emit(EVT[EVT_TTCACHE_PUT],buffer); });
				req.on( EVT[EVT_HTTP_ERR],	function( e) 		{ _this.emit(EVT[EVT_TTCACHE_ERR],e) });
			});	
			req.write(oBody);
			req.end();	
		} catch (err ){
			throw err
		}
	}

	/**
	 * method: get
	 *  arg: 
	 *			key: 		<string> 	- a key by which to reference the data
	 * Events:
	 *			'cr_put', <pojo> 
	 *			'error' , <err> 
	 */
	get ( key ) {
		let _this = this;
		try{	
			let oBody = this._generateCacheObj (key,-1,'','');		
    		let req = http.request( this._requestOptions(HTTP_HEADER[HTTP_ROUTE_GET],HTTP_HEADER[HTTP_METHOD_POST],oBody), function( res )    {
				var buffer = "";
   				res.on( EVT[EVT_HTTP_DATA], function( data ) 	{ buffer = buffer + data; });
				res.on( EVT[EVT_HTTP_END], 	function( data ) 	{ 
					let bO = JSON.parse(buffer);

					switch (bO.errorCode){
						case 1 :
							_this.emit(EVT[EVT_TTCACHE_GET],bO); 
						break;
						case 0 :
							bO.data = (new Buffer(bO.data,ENCODINGS[ENC_B64]).toString(ENCODINGS[ENC_ASC]));
							_this.emit(EVT[EVT_TTCACHE_GET],bO); 
						break;
						default:
							_this.emit(EVT[EVT_HTTP_ERR],'undefined switch@error'); 
						break;
					}
					
				});
				req.on( EVT[EVT_HTTP_ERR],	function( e) 		{ _this.emit(EVT[EVT_TTCACHE_ERR],e) });
			});	
			req.write(oBody);
			req.end();	
		} catch (err ){
			throw err
		}
	}

	_generateCacheObj ( key, ttl, mimeType, data){
		return (`{"key":"${key}","ttl":${ttl},"createOnDate":${this._getMilliseconds()},"mimeType":"${mimeType}","data":"${data}"}`);
	}
	_getMilliseconds(){
		return ((new Date()).getTime());
	}
	_requestOptions (url, method , body){
		return(	{
	    		host: this._host,
	    		path: url,
	    		port: this._port,
	    		method: method,
	    		headers: {
	        		'Cookie': HTTP_HEADER[HTTP_COOKIE],
	        		'Content-Type': HTTP_HEADER[HTTP_CONTENTTYPE],
	        		'Content-Length': Buffer.byteLength(body)
	    		}
    		});
	}

	
}//end Class::nCache









