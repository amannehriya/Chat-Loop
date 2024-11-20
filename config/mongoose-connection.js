const mongoose = require('mongoose');
const config = require('config');
// const env = require("cross-env");
const dbgr = require("debug")("development:mongoose");  //set env variable $env:DEBUG="development:mongoose"

mongoose.
connect(`${config.get('MONGODB_URI')}/chating`)
.then(function(){
    dbgr("connected");
})
.catch(function(err){
    dbgr(err);
})
module.exports = mongoose.connection;