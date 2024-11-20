
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
// Create an Express app
const app = express();
const server = http.createServer(app);

// Attach WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

const db = require("./config/mongoose-connection");
const path = require("path");
const userModel = require("./models/userModel");
const msgModel = require("./models/msgModel");
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));


const clients = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected.',);

    ws.on('message',async (message) => {
        const data = JSON.parse(message);

        // Register user with a username
        if (data.type === 'register') {
            clients.set(data.username, ws);
            ws.username = data.username;
            ws.send(JSON.stringify({ type: 'status', message: 'Registered successfully!' }));
            console.log(ws.username);

         //sending old msg for the user
         let oldmessage = await msgModel.find({
            $or: [{ from: data.username }, { to: data.username }],
         }).sort({ timestamp: 1 });
        oldmessage.forEach((oldmessage) => {
            ws.send(JSON.stringify({ type: 'oldmessage',from:oldmessage.from, message: oldmessage.message}));
        });

         // Send undelivered messages for the user
               const undeliveredMessages = await msgModel.find({
                to: data.username,
                delivered: false,
            }).sort({ timestamp: 1 });

            undeliveredMessages.forEach(async(oldmessage) => {
                console.log(oldmessage);
                ws.send(JSON.stringify({ type: 'oldmessage',from:oldmessage.from, message: oldmessage.message}));
                oldmessage.delivered = true; // Mark as delivered
                await oldmessage.save();
            });
    

        }
        // Handle sending a message
        else if (data.type === 'message') {
            const recipientSocket = clients.get(data.to);  //ye check kr rha he ki jisko msg krna he 
            if (recipientSocket) {                         //vo bnda  register he ki nhi
                recipientSocket.send(JSON.stringify({
                    type: 'message',
                    from: ws.username,
                    message: data.message,
                   }));
                // Acknowledge the sender
            ws.send(JSON.stringify({ type: 'status', message: 'Message sent.' }));

            let msg = await msgModel.create({
                from:ws.username,
                to:data.to,
                message:data.message,
                delivered:true
            });   
            } else if(await userModel.findOne({username:data.to})){
                let msg = await msgModel.create({
                    from:ws.username,
                    to:data.to,
                    message:data.message,
                    delivered:false
                });
                ws.send(JSON.stringify({ type: 'status', message: 'Message sent.' }));
             } else{
                ws.send(JSON.stringify({ type: 'error', message: 'User not available.' }));
            }
        }
    });

    ws.on('close', () => {
        console.log(`${ws.username || 'A user'} disconnected.`);
        clients.delete(ws.username);
    });
});

app.get("/",(req,res)=>{
    res.render("front")
})
app.post("/create/user",async(req,res)=>{
  let{username, email, password}  = req.body;
  let user = await userModel.create({
    email,
    password,
    username
  });
  res.render("msg",{user})
})










server.listen( 3000);
