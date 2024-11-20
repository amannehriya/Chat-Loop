const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateToken } = require("../utills/generateToken");
const userModel = require("../models/userModel");
module.exports.registerUser =  async function(req,res){
    try{
        let{username,email,password} = req.body;
        let user = await userModel.findOne({username});
        if(user){
        req.flash("anothergmail","please try an another gmail");
        res.redirect("/");
    }
        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(password,salt,async(err,hash)=>{
                 let user = await userModel.create({
                  username,
                  password:hash,
                  email,
                });
        let token = generateToken(user);
        res.cookie("token",token);
        //  req.flash("id",'user created successfully');
         res.redirect("/main");
            })
        })
      
    }
    catch(err){
     res.send(err.message);
    }
}
module.exports.loginUser = async (req,res)=>{

    try{
      let{username,password} = req.body;
      let user = await userModel.findOne({username});
      if(!user){
      req.flash("invalidMail","something wents wrong");
      res.redirect("/");
    }
      bcrypt.compare(password,user.password,(err,result)=>{
        if(err){
            console.log(err)
        }
        if(result){
            let token = generateToken(user);
            res.cookie("token",token);
            res.redirect("/main")
        }
  else{
        req.flash("invalidPass","something wents wrong");
        res.redirect("/");}
      })
    }
    catch(err){
        console.log(err.message)
    }

}