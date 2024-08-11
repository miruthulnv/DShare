// Handle new peers
socket.on('new-peer', (peerId) => {
    console.log('New peer connected:', peerId);
    updatePeerList();
});

// Handle peer disconnection
socket.on('peer-disconnected', (peerId) => {
    console.log('Peer disconnected:', peerId);
    updatePeerList();
});

// Handle update to the list of active peers
socket.on('update-peers', (activePeers) => {
    console.log('Active peers:', activePeers);
    displayPeerList(activePeers);
});

function displayPeerList(peers) {
    const listElement = document.getElementById('peerList');
    listElement.innerHTML = peers.map(peer => `<li>${peer}</li>`).join('');
    displayFileList();
}

// Initial peer list fetch
function updatePeerList() {
    socket.emit('request-peer-list');
}