const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/chating");
const MessageSchema = mongoose.Schema({
from:String,
to:String,
message:String,
timestamp:{
    type:Date,
    default:Date.now,
},

delivered: {
     type: Boolean,
     default: false 
    },
})
module.exports = mongoose.model("message",MessageSchema);