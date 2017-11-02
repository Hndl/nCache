var http = require("http");
var fs = require('fs');



var bodyxml  = fs.readFileSync("./sf.xml","UTF-8");

b64Data = new Buffer("Hello World").toString('base64');
b64Data = new Buffer(bodyxml).toString('base64');

var body = "";

if (process.argv[4] === 'put' ){
  body =  '{"key":"'+process.argv[5]+'","mimeType":1,"ttl":100,"data":"'+ b64Data+'"}';
}else{
  body =  '{"key":"'+process.argv[5]+'"}';
}

//var soapbody = '<?xml version="1.0" encoding="utf-8"?>' +
//           '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'+
//            '<soap12:Body>......</soap12:Body></soap12:Envelope>';

var postRequest = {
    host: process.argv[2],
    path: "/wCache/"+process.argv[4],
    port: process.argv[3],
    method: "POST",
    headers: {
        'Cookie': "cookie",
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    }
};

var buffer = "";

var req = http.request( postRequest, function( res )    {

   console.log( res.statusCode );
   var buffer = "";
   res.on( "data", function( data ) { buffer = buffer + data; } );
   res.on( "end", function( data ) { 
      var jO = JSON.parse(buffer);
      console.log( buffer ); 
      console.log(new Buffer(jO.data, 'base64').toString('ascii'));
    });

});

req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
});

req.write( body);
req.end();