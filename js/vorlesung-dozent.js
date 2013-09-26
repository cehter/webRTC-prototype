/*variables*/
var localStream;
var currentId;
var pc           = new Array();
var studentId    = new Array();
var countStudent = 0;

/*Webcam access*/
/*Access permitted and the mediastream will be passed to the video-tag */
function gotStream(s) {
    var url                                  = webkitURL.createObjectURL(s);
    document.getElementById("localView").src = url;
    localStream                              = s;
    console.log("Started showing local stream. url = " + url);
}
/*Access denied, there will be an error message*/
function gotStreamFailed(error) {
    console.log("Failed to get access to local media. Error code was "
                + error.code + ".");
}
/*Gets the permission from the user for the media-access*/
function getUserMedia() {
    try {
        navigator.webkitGetUserMedia({audio: true, video:true},
                                     gotStream, gotStreamFailed);
        console.log("Requested access to local media");
    } 
    catch (e) {
        console.log(e, "getUserMedia error");
    }
}

/*PeerConnection */
/*Create the RTCPeerConnection
  pc_config = configuration which containes the information about the STUN-Server
  The RTCPeerConnection is saved as an array, the index is the current student-WebSocket-ID.*/
function generatePeerConnection(Id) {
    currentId = Id; //Current ID of the sending Student
    var pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    try {
        pc[currentId]                = new RTCPeerConnection(pc_config);
        pc[currentId].onicecandidate = onIceCandidate;
        pc[currentId].onconnecting   = onSessionConnecting;
        pc[currentId].onopen         = onSessionOpened;
        pc[currentId].onremovestream = onRemoveStream;
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
    var stream = e.stream;
    var url = webkitURL.createObjectURL(stream);
    try {
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
        console.log("sdpmLineIndex: " + event.candidate.sdpMLineIndex);
    }
    else {
        console.log("End of candidates.");
    }
}

/*Adds the stream and calls the doCall Funktion*/
function startCall() {
    console.log("adding stream" + localStream);
    pc[currentId].addStream(localStream);
    doCall();

}
/*Creates an offer*/
function doCall() {
    console.log("Send offer to peer");
    pc[currentId].createOffer(setLocalAndSendMessage, null, mediaConstraints);
}
/*Creates an answer*/
function doAnswer() {
    console.log("Send answer to peer");
    pc[currentId].createAnswer(setLocalAndSendMessage, null, mediaConstraints);
}
/*Set the localDescription and sends the sessionDescription to the WebSocket*/
function setLocalAndSendMessage(sessionDescription) {
    pc[currentId].setLocalDescription(sessionDescription);
    console.log("sessionDescriptipon: " + sessionDescription);
    sendMessage(sessionDescription);
}
/*Messages the WebSocket received which have a connection to the RTCPeerConnection*/
function processSignalingMessage(message) {
    var msg = JSON.parse(message.data);
    if (msg.type === 'offer') {
        pc[currentId].setRemoteDescription(new RTCSessionDescription(msg));
        doAnswer();
    } 
    else if (msg.type === 'answer') {
        pc[currentId].setRemoteDescription(new RTCSessionDescription(msg));
    } 
    else if (msg.type === 'candidate') {
        var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
                                             candidate:msg.candidate});
        pc[currentId].addIceCandidate(candidate);
    } 
    else if (msg.type === 'bye') {
        onRemoteHangup();
    }
}

/*Messages from the WebSocket. Contains the message no special phrase (false or ready) then the message contains SDP-informations for the RTCPeerConnection and the funktion processSignalingMessage will be called */
function messageWs(evt) {
    if (evt.data.indexOf("Student") !=-1){
        studentId.push(evt.data.slice(8));
        generatePeerConnection(studentId[countStudent]);
        countStudent = countStudent + 1;
        startCall();
    }
    else {
        processSignalingMessage(evt);
    }
}
/*Start WebSocket connection and send role*/
function startWS() {
    openWs();
    sendRole("dozent");
}
/*Send message to the WebSocket*/
function sendMessage(msg) {
    var stringMsg = JSON.stringify(msg);
    ws.send(currentId + " " + stringMsg);

}
