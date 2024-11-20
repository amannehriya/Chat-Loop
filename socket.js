const express = require("express");
const app = express();
const path = require("path");
const expressSession = require("express-session")

const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);
const{registerUser,loginUser} = require("./controllers/authcontoller");
const userModel = require("./models/userModel");
const msgModel = require("./models/msgModel");
const cookieParser = require("cookie-parser");
const { connect } = require("http2");
const isLoggedIn = require("./middleware/isLoggedIn")
const flash = require("connect-flash");
const { time } = require("console");
app.use(expressSession({
    secret:"your secret key",
    resave:false,
    saveUninitialized:false
}));
require("dotenv").config();
app.use(flash());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));

const onlineUsers = new Map(); // Track online users with their socket IDs

io.on("connection",(socket)=>{
    // console.log("connect");
    socket.on("chat-with",async function(data){

        console.log("User registered:", data.user);
        onlineUsers.set(data.user, socket.id); // Map the data.user to the socket ID
         //sending old msg for the user


        let oldmessage = await msgModel.find({ 
            $or:[
           { $and: [{ from:data.user }, { to:data.friend }]},
           { $and: [{ from:data.friend }, { to:data.user }]}  
        ]
    }).sort({ timestamp: 1 });

    for (let message of oldmessage) {
        message.delivered = true; // Mark as delivered
        await message.save(); // Save updated status in database
        const timeOnly = message.timestamp.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', });
       
        socket.emit("oldmessage", { from: message.from, message: message.message, time:timeOnly});
     }
   })
    socket.on("message",async function(data){
        const {from, to, message}= JSON.parse(data);
           let msg = await msgModel.create({
            from,
            to,
            message,
        });  

        
        const timeOnly = msg.timestamp.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', });
         // Emit the message to the recipient if online
         const recipientSocketId = onlineUsers.get(to);
         if (recipientSocketId) {
             io.to(recipientSocketId).emit("newmessage",{ message, time:timeOnly});
         }
})

});

app.get("/",(req,res)=>{
    let error = req.flash("error");
    let anothergmail = req.flash("anothergmail")
    let invalidPass = req.flash("invalidPass");
    let invalidMail = req.flash("invalidMail");
    res.render("login",{error,anothergmail,invalidPass, invalidMail });
   
});

app.post("/users/register",registerUser);
app.post("/users/login",loginUser);

app.get("/main",isLoggedIn,async (req,res)=>{
    let friends =  await userModel.find();
    let user = req.user;
    res.render("main",{friends, user});
})

app.get("/user/:friend",isLoggedIn,async (req,res)=>{
   let friend = req.params.friend;
   let user = req.user;
   res.render("chatWith",{friend, user});
})
app.get("/logout",isLoggedIn,async (req,res)=>{
try { 
    res.cookie("token","")
    res.redirect('/');
}catch(err){
    console.log(err);
}
 })
server.listen(3000);