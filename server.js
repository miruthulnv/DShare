const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socketIo(server);

let allFiles = [];

let peers = {}; // Store peers

// Serve the static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    peers[socket.id] = socket;

    for (let id in peers) {
        console.log(id)
        if (id !== socket.id) {
            peers[id].emit('connected', socket.id);
            peers[id].emit('new-peer', socket.id);
            socket.emit('new-peer', id); // Notify the new peer of existing peers
        }
    }

    socket.on('request-all-files',()=>{
        socket.emit('get-all-files', allFiles)
    })

    socket.on('signal', (data) => {
        if (data.to && peers[data.to]) {
            peers[data.to].emit('signal', { from: socket.id, ...data });
        }
    });

    // Handle requests for peer list
    socket.on('request-peer-list', () => {
        socket.emit('update-peers', Object.keys(peers));
    });

    socket.on('update-files-object',(data)=>{
        allFiles = [...allFiles,...data];
        console.log(allFiles);
    })

    socket.emit('update-peers', Object.keys(peers));

    socket.on('fileList', (data) => {
        // Forward the file list to the intended peer
        // console.log('received the files list..');
        // console.log(data.files)
        // console.log(data)
        for (let id in peers){
            if (id !== socket.id) {
                peers[id].emit('fileList', { from: socket.id, files: data.files });
            }
        }

    });

    socket.on('requestFile', (data) => {
        const fileName = data.fileName;
        // Send the file to the requesting peer
        peers[data.host].emit('fileDownload', { from: socket.id, fileName });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete peers[socket.id];
        for (let id in peers) {
            peers[id].emit('peer-disconnected', socket.id);
        }

        allFiles = allFiles.filter((file) => file.host!== socket.id)
        // Update all peers with the new list of active peers
        for (let id in peers) {
            peers[id].emit('update-peers', Object.keys(peers));
        }
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Signaling server and static file server running on port 3000');
});
