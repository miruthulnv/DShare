const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let peers = {}; // Store peers

// Serve the static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // send a connected event from server to client
    // socket.emit('connected', socket.id);
    peers[socket.id] = socket;

    for (let id in peers) {
        console.log(id)
        if (id !== socket.id) {
            peers[id].emit('connected', socket.id);
        }
    }

    socket.on('signal', (data) => {
        if (data.to && peers[data.to]) {
            peers[data.to].emit('signal', { from: socket.id, ...data });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete peers[socket.id];
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Signaling server and static file server running on port 3000');
});
