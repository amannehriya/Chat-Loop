const jwt = require('jsonwebtoken');
const userModel = require("../models/userModel");
module.exports = async(req,res,next)=>{
    try{
    if(!req.cookies.token){
        // res.send("error", "you need to login first");
       console.log("aman")
        res.redirect("/");
    }

     let decoded = jwt.verify(req.cookies.token,process.env.JWT_KEY);
     let user =  await userModel
     .findOne({username:decoded.username})
     .select("-password")  //esa krne se user ke password ke alava hmko saari detail mil jayegi
     req.user = user;  // iska mtlb ab hmara user yha save hojayega
     next();
    }
    catch(err){
       console.log(err.message);
       console.log("token not generated")
        res.redirect('/');
    }
}