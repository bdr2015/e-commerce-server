const express = require('express');
const mongoos = require("mongoose");
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

mongoos.set("strictQuery", false);
const scheme  = new mongoos.Schema({
    name:{
        type:String,
        required:true    
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        
    }
})


const User = mongoos.model("Users", scheme)

const app = express()
app.listen(5000)
app.use(cors({
    credentials:true
}))

app.use(express.json())
/* app.use(function(req, res, next) {
    res.header('Content-Type', 'application/json;charset=UTF-8')
    res.header('Access-Control-Allow-Credentials', true)
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    )
    next()
  }) */
app.use(cookieParser())

const checkUser = (req,res,next)=>{
    try{
        const token = req.cookies.token
        const user = jwt.verify(token, "secret")
        req.user = user
        next()
    }
    catch(err){
        return res.send("you are not logged in")
    }
   
}
app.get('/user',checkUser,async (req,res)=>{
    await mongoos.connect('mongodb+srv://Deny:admin@cluster0.2qxkvq3.mongodb.net/?retryWrites=true&w=majority')
    const user = await User.findOne({email:req.user.mail})
    res.send(user)
})

app.post('/login', async(req,res)=>{
    await mongoos.connect('mongodb+srv://Deny:admin@cluster0.2qxkvq3.mongodb.net/?retryWrites=true&w=majority')
    const {email, password} = req.body
    const user = await User.findOne({email})

    if(user){
        const checkPs = await bcrypt.compare(password, user.password)
        if(checkPs){
            const token = jwt.sign({mail:email},'secret')
            res.cookie('token',token)
            res.send("login succes")
        }
        else if(!checkPs){
            res.send("password is not correct")
        }
        
    }
    else{
        res.send("User is not registered")
    }
    
    
})

app.post("/register",async (req,res)=>{
    
    mongoos.connect('mongodb+srv://Deny:admin@cluster0.2qxkvq3.mongodb.net/?retryWrites=true&w=majority')
    let findUser = await User.findOne({email:req.body.email})
    if(findUser){
        res.send('User has been already regidtered')
    }
    else{
        let parol = req.body.password
        let parolToSave = await bcrypt.hash(parol, 7)
        await User.create({
            name:req.body.name,
            password:parolToSave,
            email:req.body.email
        })

        const token = jwt.sign({mail:req.body.email},'secret',{expiresIn:"10m"})
        res.cookie("token",token,{httpOnly:true, maxAge:"60000"})
        res.send("Register succes")
    }
    
    
})
app.get("/",(req,res)=>{
    res.cookie("ccc","ddd")
    res.cookie("cama",'dssewegrg')
    res.json("okffff")
})

const token = process.env.BOT_TOKEN
const bot = new TelegramBot(token, {polling: true});
const userId = process.env.USER_ID;


app.post('/checkout',async(req,res)=>{
    let message = ""
    req.body.order.products.forEach((el)=>{
        message+=`   ID товару: ${el.id}; Кількість: ${el.quantity};\n`
    })
    await bot.sendMessage(userId,`Замовник: ${req.body.order.receiver.name} ${req.body.order.receiver.surname}\nТелефон: ${req.body.order.receiver.phone}\nАдреса доставки: ${req.body.order.receiver.address}\nТовар:\n${message}`)  
    res.send("succes")
    
})
bot.addListener('message',(m)=>{
    bot.sendMessage(userId,m.text)
})





