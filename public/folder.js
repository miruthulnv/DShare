document.getElementById('folderInput').addEventListener('change', (event) => {
    const files = event.target.files; // List of files in the folder
    let fileList = Array.from(files).map(file => {
        return {host: socket.id, name: file.name};
    });
    socket.emit('update-files-object',fileList)
    displayFileList()
    // Send the file list to the remote peer
    socket.emit('fileList', { files: fileList });


    // Optionally, you can also send the actual files here
});

function displayFileList() {
    const listElement = document.getElementById('fileList');
    socket.emit('request-all-files',{});
    socket.on('get-all-files',(files)=>{
        console.log(files)
        listElement.innerHTML = files.map(file => `<li>Host: ${file.host}, ${file.name} <button onclick="downloadFile('${file.host}','${file.name}')">Download</button></li>`).join('');
    })
}

socket.on('fileList', (data) => {
    const fileList = data.files;
    console.log(fileList)
    displayFileList();
});


displayFileList()
