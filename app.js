const express = require("express");
const app = express();
const path = require("path");

const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);

let waitingusers = [];
let rooms ={};

io.on("connection",(socket)=>{
   socket.on("joinroom",function(){
    if(waitingusers.length>0){
    let patner = waitingusers.shift(); //jo bnda waiting user m hoga vo us array me se bahar nikl kr ye patnr vale var me ajjayega
   const roomname = `${socket.id}-${patner.id}` ;
   socket.join(roomname);
   patner.join(roomname);
   io.to(roomname).emit("joined",roomname);  // sirf is roomnname ke andr vale socket ko hi msg jayega  
   }else{
      waitingusers.push(socket)
    }
   })
   socket.on("disconnect",function(){
      let index = waitingusers.findIndex(waitinguser=> //ye check krega ki waiting users ke andr is id ka soket he kya by comparing evry valu of an array(waitingusers)
         waitinguser.id == socket.id)
         waitingusers.splice(index,1)
    })
   socket.on('message',function(data){
    socket.broadcast.to(data.room).emit("message",data.message)
   })
   socket.on("startVideoCall",({room})=>{
      console.log(room)
      socket.broadcast.to(room).emit("incomingCall");
   })
   socket.on("acceptCall",({room})=>{
      socket.broadcast.to(room).emit("callAccepted");
   })
   socket.on("rejectCall",({room})=>{
      socket.broadcast.to(room).emit("callRejected");
   })
   socket.on("signalingMessage",(data)=>{
      socket.broadcast.to(data.room).emit("signalingMessage",data.message);
   })
 
})

const indexRoute = require("./routes/index");
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));

app.use("/",indexRoute);


server.listen(3000);