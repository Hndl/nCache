'use explicit';

// Standard
const util 				= require("util");
const WebSocket 		= require("ws");
const WebSocketServer 	= require("ws").Server;
const readline			= require("readline");
const express			= require('express');
const path				= require('path');
const bodyParser		= require('body-parser');


// Customer internal

const nCache 			= require('./lib/nCache.js');

const LISTEN_PORT						= 5000;	
const LISTEN_PORT_WS					= 5001;
const CACHENAME							= 'wCache:0001-0001-0001';
const EVT 								= ['SIGINT','connection'];
const EVT_FS_SIGINT						= 0;
const EVT_WS_CONN  						= 1;
const APPNAME							= 'wCache';
const PUBLICDIR							= 'wCacheApp';
const currentDir						= '.';
const CMD_CACHE_GET						= 'get';
const CMD_CACHE_PUT						= 'put';
const CMD_CACHE_KEYS					= 'keys';
const CMD_CACHE_REMOVE					= 'remove';
const CMD_CACHE_STDOUT					= 'whats_in';
const CMD_CACHE_TRUNC					= 'cache_purge';
const CMD_CACHE_DUMP					= 'cache_dump';
const CMD_CACHE_SEED					= 'cache_seed';


const DATA_POINTS						=	[0,0,0,0,0,0,0,0,0];
const DP_G_REQUEST						=	0;
const DP_G_REQUEST_HITS					=	1;
const DP_P_REQUEST						=	2;
const DP_STDIO_REQUEST					=	3;
const DP_POST_ERRORS					=	4;
const DP_G_REQUEST_HITSEXPIRE			=	5;
const DP_G_REQUEST_REMOVE				=	6; // IMP 001
const DP_G_REQUEST_GETKEYS				=	7; // IMP 001
const DP_G_CACHESIZE					=	8; // IMP 001

const HTTP_OK							= 200;
const HTTP_ERR							= 404;
const HTTP_IATP							= 418;



/**
 * Customer Functions Beyon this point
 */
 	function renderCacheToStout( cache ) {
 		if ( cache!= null){
			util.log(`dumping ${APPNAME} ${CACHENAME} to stdio 
					---------------------------
					${cache.toString()}
					---------------------------
					completed..`);
		}
 	}

 	function makeJSONResponse( errCode, errDesc,mimeType,data , found){
 		return (
 				{
 					"errorCode":errCode,
 					"errorDescription":errDesc,
 					"found":found,
 					"type":mimeType,
 					"data":data
 				}
 			);
 	}

 	function manageRequests( req, res){
 		switch ( req.params.cacheCommand.trim().toLowerCase() ){
 			case CMD_CACHE_SEED:
				try{
					util.log('seeding core cache');
					oCache.seedCache();
					DATA_POINTS[DP_G_CACHESIZE] = oCache.size();
					util.log('seeding core cache - completed. Items Seeded:' + oCache.size());
					res.contentType('application/json');
					res.send (makeJSONResponse(0,'cache dumped','','',''));
				} catch ( err ){
					util.log(`ERROR Processing POST::${CMD_CACHE_SEED} [${err}] - ${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
					DATA_POINTS[DP_POST_ERRORS]++;
					res.contentType('application/json');
					res.send (makeJSONResponse(901,'cache dumped err','','',''));
				}
				break;
			case CMD_CACHE_DUMP:
				try{
					util.log('dumping core cache, persisting ' + oCache.size());
					oCache.dumpCache();
					util.log('dumping core :done');
					res.contentType('application/json');
					res.send (makeJSONResponse(0,'cache seeded','','',''));

				} catch ( err ){
					util.log(`ERROR Processing POST::${CMD_CACHE_DUMP} [${err}] - ${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
					DATA_POINTS[DP_POST_ERRORS]++;
					res.contentType('application/json');
					res.send (makeJSONResponse(902,'cache seed err','','',''));
				}
				break;
			case  CMD_CACHE_KEYS:
				/** 
				 * IMP1 - Fetch the Keys in the Cache.
				 * WIP
				 */
				try{
					//console.dir(req);
					DATA_POINTS[DP_G_REQUEST_GETKEYS]++;
					hdnleCacheKeys(req,res);
				} catch (err) {
					util.log(`ERROR Processing POST::${CMD_CACHE_KEYS} [${err}] - ${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);	
				}
				break;
			case CMD_CACHE_REMOVE:
				/** 
				 * IMP1 - Fetch the Keys in the Cache.
				 * WIP
				 */
				try{
					DATA_POINTS[DP_G_REQUEST_REMOVE]++;
			        hdnleRemoveCacheKeys(req,res);		
					DATA_POINTS[DP_G_CACHESIZE] = oCache.size();
				} catch (err){
					util.log(`ERROR Processing POST::${CMD_CACHE_REMOVE} [${err}] - ${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);	
				}
				break
			case CMD_CACHE_GET:
				DATA_POINTS[DP_G_REQUEST]++;
				/* invoke the get object from cache and render the response */
				try{
					hndleCacheGet(req,res);
				} catch (err){
					util.log(`ERROR Processing POST::${CMD_CACHE_GET} [${err}] - ${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
					DATA_POINTS[DP_POST_ERRORS]++;
				}
			break;
			case CMD_CACHE_TRUNC:
				try{
					oCache.cleanAll();
					renderCacheToStout( oCache );
					DATA_POINTS[DP_G_CACHESIZE] = oCache.size();
					res.send(oCache.toString());
				} catch ( err ){
					util.log(`ERROR Processing POST::${CMD_CACHE_PUT} [${err}] - ${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
					DATA_POINTS[DP_POST_ERRORS]++;
					res.contentType('application/json');
					res.send (makeJSONResponse(504,err,'','',''));
				}
				break;
			case CMD_CACHE_STDOUT:
				DATA_POINTS[DP_STDIO_REQUEST]++;
				renderCacheToStout( oCache );
				res.send(oCache.toString());
			break;
			case CMD_CACHE_PUT:
				DATA_POINTS[DP_P_REQUEST]++;
				/* invoke the put object from cache and render the response */
				try{
					hndleCachePut(req,res);
					DATA_POINTS[DP_G_CACHESIZE] = oCache.size();
			          			
				} catch (err){
					util.log(`ERROR Processing POST::${CMD_CACHE_PUT} [${err}] - ${req.method} request for '${req.url}' - Body:${req.body}`);
					DATA_POINTS[DP_POST_ERRORS]++;
					res.contentType('application/json');
					res.send (makeJSONResponse(504,err,'','',''));
				}
			break;

		}
 	}


 	function hdnleCacheKeys( req, res ) {
 		res.contentType('application/json');
 		try{
 			//let cacheKey	= req.param('key', null);  					// get the key,if null then we will use getKeys, otherwise we will getKeysLike
 			let keys = null;
 			//if ( cacheKey === null ){
 				keys = oCache.getKeys();
 			//} else {
			//	keys = oCache.getKeys();
 			//}
 			console.dir(keys);
 			//function 				  makeJSONResponse(errCode, errDesc,mimeType,data , found){
 			res.status( HTTP_OK).send(makeJSONResponse(0,`getKeys:`,'application/json',JSON.stringify(keys),true));
 		} catch (err){
 			res.status( HTTP_OK).send(makeJSONResponse(1,`${err} - getKeys:`,'application/json','',false));	
 		}
 	}

 	function hdnleRemoveCacheKeys(req,res){
 		try{
 			var cacheKey	= req.param('key', null);  					// get the key
 			console.log(`hdnleRemoveCacheKeys::${cacheKey}`);
 			if ( cacheKey === null ){
 				throw new Error('invalid param:key not supplied');
 			}
 			res.contentType('application/json');
 			if ( oCache.remove(cacheKey) ) {
 				// key removed
 				res.send (makeJSONResponse(0,cacheKey,'','',true));
 			} else {
 				// failed to remove key
 				res.send (makeJSONResponse(1,cacheKey,'','',false));
 			}
 		} catch (err){
 			throw (err);
 		}

 	}
 	
 	function hndleCacheGet(req,res){
 		try{
 			var cacheKey	= req.param('key', null);  					// get the key
 			if ( cacheKey === null ){
 				throw new Error('invalid param:key not supplied');
 			}
 			res.contentType('application/json');
 			var cObj = oCache.get(cacheKey);
 			if ( cObj == null){
 				console.dir(makeJSONResponse(1,cacheKey,null,null,false));
 				res.send (makeJSONResponse(1,cacheKey,null,null,false));
 			} else{
 				if ( cObj.expired === true ){
					DATA_POINTS[DP_G_REQUEST_HITSEXPIRE]++;
 					res.send (makeJSONResponse(909,cacheKey+':expired',cObj.mimeType,cObj.data,false));
 				} else {
 					DATA_POINTS[DP_G_REQUEST_HITS]++;
 					res.send (makeJSONResponse(0,cacheKey,cObj.mimeType,cObj.data,true));
 				}
 			}
 		} catch (err){
 			throw (err);
 		}

 	}

 	function hndleCachePut(req,res) {

 		try{
 			var cacheKey	= req.param('key', null);  					// get the key
 			if ( cacheKey === null ){
 				if ( req.body === ''){
 					throw new Error('invalid param:key not supplied');
 				} else {
 					// NOT TESTED
 					/**
 					 * Get the details from the body posted
 					 */
 					var jO = JSON.parse(req.body);
 					if ( jO.key == null){
 						throw new Error('invalid param:obj.key not supplied');
 					}else{
	 					var cObj = oCache.generateCacheObj ( jO.key, jO.ttl, jO.mimeType, jo.Data);
	 					if ( !(oCache.put ( cObj )) ){
	 						throw new Error(`ERROR: unable to cache ${jO.key}.`);
	 					} 
	 					util.log(`POSTED::body::cached ${jO.key}`);
	 					//todo set headers
	 					res.contentType('application/json');
	 					res.send (makeJSONResponse(0,jO.key,'','',''));
 					}
 				}
 				
 			} else {
	 			//TODO req.param is deprecated
	 			var cacheMime	= req.param('mimeType', 'appliction/text');  	// get the key
	 			var cacheTTL	= req.param('ttl', 10000);  					// get the key
	 			var cacheData	= req.param('data', req.body);  				// get the data from the data field or the body
				
				//util.log(`POST::params::caching ${cacheKey}:${cacheData}`);	 		

	 			var cObj = oCache.generateCacheObj ( cacheKey, cacheTTL, cacheMime, cacheData);

	 			if ( !(oCache.put ( cObj )) ){
	 				throw new Error(`ERROR: unable to cache ${cacheKey}.`);
	 			} 

	 			util.log(`POST::params::cached ${cacheKey}`);
	 			//todo set headers
	 			res.contentType('application/json');
	 			res.send (makeJSONResponse(0,cacheKey,'','',''));
 			}

 		} catch (err){
 			throw (err);
 		}

 	}

 	/**
 	* func: broadcastJSON 
	 * arguments
	 *		<WebSocketServer>	webSS  									- instance of the WebSocketServer, typically called wss.
	 *		<JSON>				JSON {origDate,origUsr,msg,geocode }	- the name of the client whom issues the message
	 */
	function broadcastJSON ( webSS, jsonPayload ) {
		const func = 'boradcastJSON';
		if ( webSS !== null ){
			webSS.clients.forEach(function(client) {
					if ( isConnected (client)){
						client.send(JSON.stringify(jsonPayload));
						util.log(`[INFO] ${func} - ${JSON.stringify(jsonPayload)}`);
					} else {
						util.log(`[WARN] ${func} - client connection cached but stale - nothing sent`);
					}
			});
		}
	}

	function isConnected( client ){
		return  ( client.readyState === WebSocket.OPEN);
	}


 	function makeJSONMessage ( originalUsr, message, geocode, evt, mime, idname ){
	return (
			{
				"idname":idname,
				"evt":evt.trim().toUpperCase(),
				"origDate":(new Date()).toISOString(),
				"origUsr":originalUsr.trim().toLowerCase(),
				"mimeType":mime.trim().toLowerCase(),
				"msg":message,
				"geocode":geocode
			});
	
	}

	function publishOperationalData( webSS ) {
		broadcastJSON(webSS,makeJSONMessageByGraphStats());
	}

	function makeJSONMessageByGraphStats( ){
		return (
			makeJSONMessage (	CACHENAME,
								JSON.stringify(graph_operational_stat()),
								'?/?',
								'EVT_GDATA',
								'application/json',
								'gdata-general'
							)
			);
	}


	function graph_operational_stat() {
		return (
			{
			    type: 'bar',
			    data: {
			        labels: ["Cache::PUSH", "Cache::FETCH","Cache::Remove","Cache::GetKey","Cache::Size", "Cache::HIT","Cache::HIT-EXPIRE", "Cache::QUERY", "Cache:ERR"],
			        datasets: [{
			            label: '# of',
			            data: [	DATA_POINTS[DP_P_REQUEST],
			            		DATA_POINTS[DP_G_REQUEST],
			          			DATA_POINTS[DP_G_REQUEST_REMOVE],
			          			DATA_POINTS[DP_G_REQUEST_GETKEYS],
			          			DATA_POINTS[DP_G_CACHESIZE],
			            		DATA_POINTS[DP_G_REQUEST_HITS],
			            		DATA_POINTS[DP_G_REQUEST_HITSEXPIRE],
			            		DATA_POINTS[DP_STDIO_REQUEST],
			            		DATA_POINTS[DP_POST_ERRORS]],
			            backgroundColor: [
			                'rgba(255,99,  132, 0.2)',  // Put
			                'rgba(54, 162, 235, 0.2)',	// Get
			                'rgba(58, 46 , 242, 0.2)',  // Remove : New IMP001
			                'rgba(249,101, 32 , 0.2)',	// Keys : New IMP001
			                'rgba(94, 249, 32 , 0.2)',	// Cache Size : New IMP001
			                'rgba(255,206, 86 , 0.2)',	// Hit
			                'rgba(75, 192, 192, 0.2)',	// Hit Expire
			                'rgba(153,102, 255, 0.2)',	// Std Out
			                'rgba(255,159, 64 , 0.2)'	// Post Err
			            ],
			            borderColor: [
			                'rgba(255, 99 , 132, 1 )',		// Put
			                'rgba(54 , 162, 235, 1)',		// Get
			                'rgba(58 , 46 , 242, 1)',		// Remove
 							'rgba(249,101, 32 ,  1)',		// Keys : New IMP001
			                'rgba(94, 249, 32 ,  1)',		// Cache Size : New IMP001
			                'rgba(255, 206, 86 , 1)',		// Hit
			                'rgba(75 , 192, 192, 1)',		// Expire Hit
			                'rgba(153, 102, 255, 1)',		// STD Out
			                'rgba(255, 159, 64 , 1)'		// POST ERR
			            ],
			            borderWidth: 1
			        }]
			    },
			    options: {
			        scales: {
			            yAxes: [{
			                ticks: {
			                    beginAtZero:true
			                }
			            }]
			        }
			    }
			}
			);
	}
/**
 *  Setup long term listerners and timers here.
 */
 	/* 
  	 * Hook into the control-c... allows us to do some clean up...
  	 */
	//var rl  = readline.createInterface( process.stdin, process.stdout);
	
	/*
	 * CTRL-C - causes this to fire and exit the app clean.... 
	 */
	//rl.on( EVT[EVT_FS_SIGINT], function ( stdin ){
		/*
		 * TODO put clean up code in here
		 */
		//util.log(`CTRL-C evt recevied for ${APPNAME}.  Terminating...`);
		//process.exit(0);
	//});

	/*
	 * setup express 
	 */
	app = express();
	app.use(express.json());       // to support JSON-encoded bodies
	app.use(express.urlencoded()); 
	//app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit:50000 }));
	//app.use(bodyParser.json({limit: "50mb"}))
	app.use(function(req, res, next) {
		/*
		 * created for future use!
		 */
		//console.log(`${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
		//util.log(`${req.method} request for '${req.url}'`);
		util.log(`${req.method} request for '${JSON.stringify(req.headers)}'`);
		util.log(`${req.method} request for '${req.url}'`);
		//util.log(`${req.method} ${JSON.stringify(req.body)}`);
		next();
	});
	app.use(express.static(path.join(currentDir,PUBLICDIR)));

	app.post('/'+ APPNAME +'/:cacheCommand', function(req, res) {
		manageRequests( req, res);
	});

	app.get('/'+ APPNAME +'/:cacheCommand', function(req, res) {
		manageRequests( req, res);
	});
	
	/*
	 * Setup the websocket for the stats data
	 */
	var wss = new WebSocketServer({ port: LISTEN_PORT_WS }); 
	wss.on(EVT[EVT_WS_CONN], function(ws) {
		const func = 'wss.on::';
		util.log(`${func} - Connection Requested.`);
		ws.send ( JSON.stringify(makeJSONMessage(CACHENAME,'CONN_EST','lng/x:lat/y','EVT_CSTM_WS_EMIT_CONNECTED','application/text', 'CONN_EST' )));
	});
/**
 * Main
 *
 */
 var oCache = new nCache(CACHENAME);
 app.listen(LISTEN_PORT);

 var timer_opsdata	= setInterval(publishOperationalData, 10000, wss ); //TODO change this from 10sec to 59sec


util.log(`${APPNAME} Cache Server@${LISTEN_PORT}...StatsSvr:@${LISTEN_PORT_WS}`);

