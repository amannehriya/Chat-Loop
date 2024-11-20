const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/chating");
const userSchema = mongoose.Schema({
    username:String,
    email:String,
    password:String,
    phone:Number,
    picture:String,
    address:String
})
module.exports = mongoose.model("user",userSchema);