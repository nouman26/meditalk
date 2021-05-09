const express = require('express');
var path = require('path');
const bodyParser=require("body-parser");
const app = express();
var main=require("./routes/main")
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 4000;
const {ExpressPeerServer} = require('peer')
const peer = ExpressPeerServer(server , {
  debug:true
});
app.use('/peerjs', peer);

// Body Parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

app.use(express.static('public'))

var aid,aname,aimage,uname,occup1,email1;
app.get('/acall/:lkem' , (req,res)=>{
  var lkem=req.params.lkem;
  var split=lkem.split("__");
  videoid=split[0];
  aname=split[1];
  aimage=split[2];
  uname=split[3];
  email1=split[4];
  occup1=split[5];
  res.redirect("/audio_call");
});

app.get('/audio_call' , (req,res)=>{
  res.render('audiocalling' , {RoomId:aid,name:aname,image:aimage,uname:uname,email:email1,occup:occup1});  
});

var vid,name,image,uname2,occup2,email2;
app.get('/vcall/:lkem' , (req,res)=>{
  var lkem=req.params.lkem;
  var split=lkem.split("__");
  vid=split[0];
  name=split[1];
  image=split[2];
  uname2=split[3];
  email2=split[4];
  occup2=split[5];
  res.redirect("/video_call");
});

app.get('/video_call' , (req,res)=>{
  res.render('videocalling' , {RoomId:vid,name:name,image:image,uname:uname2,email:email2,occup:occup2});
});

io.on("connection" , (socket)=>{
  socket.on('newUser' , (id , room)=>{
    socket.join(room);
    socket.to(room).broadcast.emit('userJoined' , id);
    socket.on('disconnect' , ()=>{
        socket.to(room).broadcast.emit('userDisconnect' , id);
    })
  })
})

// set route
app.use("/",main);

server.listen(port , ()=>{
  console.log("Server running on port : " + port);
})
