
//var ws = new WebSocket("ws://192.168.1.81:3000");
//var ws = new WebSocket("ws://clives-macbook-air.local:3000");
var ws = new WebSocket("ws://10.182.131.139:5001");

ws.onopen = function() {
	setTitle("Requesting connection to 192.168.1.81 @3000");
};

ws.onclose = function() {
	setTitle("Disconnection received from 192.168.1.81 @3000");
};


ws.onmessage = function(payload) {

    try{

        var incomingMessage = JSON.parse(payload.data);

        if ( incomingMessage.evt === 'EVT_CSTM_WS_EMIT_CONNECTED' || incomingMessage.evt === 'EVT_GDATA' ){
            
            if (incomingMessage.evt === 'EVT_GDATA' ){
                var graphData = JSON.parse(incomingMessage.msg);
                var ctx = document.getElementById(incomingMessage.idname);
                var graphData_Ops = new Chart(ctx,graphData);
                printMessage(incomingMessage.origDate,incomingMessage.origUsr,incomingMessage.evt + ":" + incomingMessage.idname);
            } else {
                printMessage(incomingMessage.origDate,incomingMessage.origUsr,incomingMessage.msg);
            }

        } else {
            printMessage(now(),'this.page:onmessage::evt is unknown',incomingMessage.evt);
        }

    } catch ( err ) {
        printMessage(now(),'this.page:onmessage',err);
    }
        
        
};

function now(){
    return ((new Date()).toISOString().slice(11,22));
}

function setTitle(title) {
    printMessage(now(),'this.page',title); 
}


function printMsg(message) {
    var p = document.createElement('p');
    p.innerText = message;
    document.querySelector('div.messages').appendChild(p);
}

function printMessage(dte, origUsr , message) {
    var p = document.createElement('p');
    p.innerText = '['+dte + ']['+origUsr +']:'+ message;
    document.querySelector('div.messages').appendChild(p);
}
