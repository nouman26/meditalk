const socket = io('/');
const peer = new Peer();
let myVideoStream;
let myId;
var videoGrid = document.getElementById('videoDiv')
var myvideo = document.createElement('video');
myvideo.muted = true;
const peerConnections = {}
navigator.mediaDevices.getUserMedia({
  video:true,
  audio:true
}).then((stream)=>{
  myVideoStream = stream;
  addVideo(myvideo , stream);
  peer.on('call' , call=>{

    document.getElementById("hhh").innerText=""
    clear()
    start();

    call.answer(stream);
      const vid = document.createElement('video');
    call.on('stream' , userStream=>{
      addVideo(vid , userStream);
    })
    call.on('error' , (err)=>{
      alert(err)
    })
  })
}).catch(err=>{
    alert(err.message)
})
peer.on('open' , (id)=>{
  myId = id;
  socket.emit("newUser" , id , roomID);
})
peer.on('error' , (err)=>{
  alert(err.type);
});
socket.on('userJoined' , id=>{
  document.getElementById("hhh").innerText=""
  clear()
  start();
  console.log("new user joined")
  
  const call  = peer.call(id , myVideoStream);
  const vid = document.createElement('video');
  call.on('error' , (err)=>{
    alert(err);
  })
  call.on('stream' , userStream=>{
    addVideo(vid , userStream);
  })
  call.on('close' , ()=>{
    vid.remove();

    stop()
    document.getElementById("hhh").innerText="Call Ended";
    console.log("user disconect")
  })
  peerConnections[id] = call;
})
socket.on('userDisconnect' , id=>{
  stop()
  document.getElementById("hhh").innerText="Call Ended";

  if(peerConnections[id]){
    peerConnections[id].close();
  }
})
function addVideo(video , stream){
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video);
}
