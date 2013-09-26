/*variables*/
var pc;


/*PeerConnection */
/*Create the RTCPeerConnection
  pc_config = configuration which containes the information about the STUN-Server*/
function generatePeerConnection() {
    var pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    try{
        pc                = new RTCPeerConnection(pc_config);
        pc.onicecandidate = onIceCandidate;
        pc.onconnecting   = onSessionConnecting;
        pc.onopen         = onSessionOpened;
        pc.onaddstream    = onAddStream;
        pc.onremovestream = onRemoveStream;
        console.log("new peerConnection!");
    }
    catch (e) {
        console.log(e, "generatePeerConnection error");
    }
}
function onSessionConnecting(message) {
    console.log("Session connecting.");
}
function onSessionOpened(message) {
    console.log("Session opened.");
}
function onAddStream(e) {
    console.log("No Stream?!");
    var stream = e.stream;
    var url = webkitURL.createObjectURL(stream);
    try {
        document.getElementById("remoteView").src = url;
        console.log("Started showing remote stream. url = " + url);
    }
    catch (e) {
        console.log(e, "onAddStream error");
    }

}
function onRemoveStream(e) {
    document.getElementById("remoteView").src = "";
}
function onIceCandidate(candidate, moreToFollow) {
    if (candidate) {
        sendMessage({type: 'candidate',
                     label: event.candidate.sdpMLineIndex,
                     id: event.candidate.sdpMid,
                     candidate: event.candidate.candidate});
    }
}

/*Creates an offer*/
function doCall() {
    console.log("Send offer to peer");
    pc.createOffer(setLocalAndSendMessage, null, mediaConstraints);
}
/*Creates an answer*/
function doAnswer() {
    console.log("Send answer to peer");
    pc.createAnswer(setLocalAndSendMessage, null, mediaConstraints);
}
/*Set the localDescription and sends the sessionDescription to the WebSocket*/
function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log("sessionDescriptipon: " + sessionDescription);
    sendMessage(sessionDescription);
}
/*Messages the WebSocket received which have a connection to the RTCPeerConnection*/
function processSignalingMessage(message) {
    var msg = JSON.parse(message.data);
    console.log(msg);
    if (msg.type === 'offer') {
        generatePeerConnection();
        pc.setRemoteDescription(new RTCSessionDescription(msg));
        doAnswer();
    }
    else if (msg.type === 'answer') {
        pc.setRemoteDescription(new RTCSessionDescription(msg));
    } 
    else if (msg.type === 'candidate') {
        var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
                                             candidate:msg.candidate});
        pc.addIceCandidate(candidate);
    }
    else if (msg.type === 'bye') {
        onRemoteHangup();
    }
}

/*Messages from the WebSocket. Contains the message no special phrase (false or ready) then the message contains SDP-informations for the RTCPeerConnection and the funktion processSignalingMessage will be called */
function messageWs(evt) {
    if (evt.data.indexOf("false") != -1) {
        console.log("Dozent is not ready");
    }
    else if (evt.data.indexOf("ready") != -1) {
        sendRole("student");
    }
    else {
        processSignalingMessage(evt);
    }
}
/*Start WebSocket connection and send role*/
function startWS() {
    openWs();
    sendRole("student");
}
/*Send message to the WebSocket*/
function sendMessage(msg) {
    var stringMsg = JSON.stringify(msg);
    ws.send(stringMsg);
}
