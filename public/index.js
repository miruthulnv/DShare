const socket = io.connect('http://localhost:3000'); // Connect to the signaling server
let peerConnection;
let dataChannel;
let fileReader;
let fileInput = document.getElementById('fileInput');
let remoteSocketId;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
// Function to create a peer connection and a data channel
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Create a data channel for file transfer
    dataChannel = peerConnection.createDataChannel('fileTransfer');
    // Event listener for when the data channel opens
    dataChannel.onopen = () => {
        console.log(`Data channel is open between ${socket.id} and ${remoteSocketId}`);
    };

    // Event listener for receiving data
    dataChannel.onmessage = (event) => {
        receiveFile(event.data);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        console.log('New ice candidate found...')
        if (event.candidate) {
            socket.emit('signal', {
                to: remoteSocketId,
                signal: { candidate: event.candidate }
            });
        }
    };

    return peerConnection;
}

// Modify this function to send a folder
// async function sendFile() {
//     const file = fileInput.files[0];
//     if (!file) return;
//
//     fileReader = new FileReader();
//     fileReader.onload = (event) => {
//         dataChannel.send(event.target.result);
//         updateProgress(event.loaded / event.total);
//     };
//     fileReader.readAsArrayBuffer(file);
// }

// Function to receive a file and display it
function receiveFile(data) {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'received_file';
    a.textContent = 'Download received file';
    document.getElementById('receivedFiles').appendChild(a);
}

// Function to update the progress of the file transfer
function updateProgress(progress) {
    document.getElementById('progress').textContent = `Progress: ${(progress * 100).toFixed(2)}%`;
}

// Handle incoming signaling data
socket.on('signal', async (data) => {
    console.log('Handling incoming signaling data')
    if (!peerConnection) {
        peerConnection = await createPeerConnection();
    } else{
        console.log('peer connection already there..')
    }
    if (data.signal.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        if (data.signal.sdp.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            remoteSocketId = data.from
            socket.emit('signal', {
                to: data.from,
                signal: { sdp: peerConnection.localDescription }
            });
        }
    } else if (data.signal.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
    }
});

// Function to create and send an offer
async function createOffer(remoteSocketId) {
    if (!peerConnection) {
        peerConnection = await createPeerConnection();
    }
    const offer = await peerConnection.createOffer();
    console.log(offer)
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', {
        // replace with actual remote socket ID
        to: remoteSocketId, // Replace with the actual remote socket ID
        signal: { sdp: peerConnection.localDescription }
    });
}

// Establish connection with the remote peer
socket.on('connected', (id) => {
    remoteSocketId = id;
    createOffer(id);
});