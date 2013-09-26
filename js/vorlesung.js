/*variables*/
var ws;
var name;
var mediaConstraints = {'mandatory': {
                        'OfferToReceiveAudio':true,
                        'OfferToReceiveVideo':true }};

/*WebSocket*/

/*Create WebSocket connection*/
function openWs() {
    var serverName = "ws://localhost:10081";
    ws             = new WebSocket(serverName);
    ws.onopen      = function() {
        console.log("Openned websocket connection");
    };
    ws.onmessage   = function(evt) { messageWs(evt);};
    ws.onclose     = function(evt) { closeWs(); };
    ws.onerror     = function(evt) { console.log("Error "+ evt) };
}
function closeWs() {
    if (ws.readyState == 3) {
        console.log("Maybe your URI is wrong, please check!");
    }
    else {
        console.log("Disconnected");
    }
}
/*Is the WebSocket connection established, the identifier (role) will be send to the WebSocket.*/
function sendRole(role) {
    name = role;
    console.log("name: " + role);
    if (ws.readyState == 1) {
        ws.send("name: " + name);
    }
    else {
        setTimeout("sendRole(name)",500);
    }
}
