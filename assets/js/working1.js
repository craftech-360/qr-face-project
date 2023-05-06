
// QR Scanner Code
const socket = io();
let scanner = new Instascan.Scanner(
    {
        video: document.getElementById('preview')
    }
);
var a = [];
scanner.addListener('scan', function(content) {
   console.log(content)
   var a = content;
    socket.emit('getUserOne',(content));   
});

Instascan.Camera.getCameras().then(cameras => 
{
    if(cameras.length > 0){
        scanner.start(cameras[0]);
    } else {
        console.error("camera not started");
    }
});
   
 // Start Button
 function getStarted() {
    document.getElementById('bg').style.display = 'none'
    document.getElementById('btn').style.display = 'none'
    document.getElementById('preview').style.display = 'block'
    document.getElementById('bg2').style.display = 'block'
    document.getElementById('btn2').style.display = 'block'
    document.getElementById('qr').style.display = 'block'
}
// Manual QR Enter
let plzField = document.getElementById("btn2");
plzField.addEventListener("click", function() {
    let e = document.getElementById("qr").value
    socket.emit('getUserOne',e);
});  
// User Details From DB
socket.on('userDetailsOne', (e) => {
    document.getElementById('name').innerText = e.name;
    document.getElementById('company').innerText = e.company;
})

// Home For Refresh
socket.on('navigate', (e) => {
    location.reload()
})

function backSub(){
    location.href = '/'
}