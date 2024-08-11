async function sendFile(fileName) {
    const folderInput = document.getElementById('folderInput');
    const files = folderInput.files;

    // Find the file in the selected folder
    const file = Array.from(files).find(f => f.name === fileName);
    if (!file) {
        console.error('File not found in the selected folder');
        return;
    }

    const fileReader = new FileReader();

    fileReader.onload = (event) => {
        dataChannel.send(event.target.result);
        updateProgress(event.loaded / event.total);
    };

    fileReader.readAsArrayBuffer(file);
}


function requestFile(host, fileName) {
    // Request the file from the sender
    socket.emit('requestFile', { to: socket.id,host, fileName });
}

socket.on('fileDownload', data =>{
    sendFile(data.fileName);
})