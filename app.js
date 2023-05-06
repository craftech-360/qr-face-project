const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const port = 3000
const User = require('./models/Attendee')
require('dotenv').config()


//////////////////////////////////////////////////////////////////////////////////

const app = express()

const server = require("http").Server(app)
const io = require("socket.io")(server)

app.use(cors())
///////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////Always add these///////////////////////////////
app.set('view engine', 'html'); 
app.engine('html', require('ejs').renderFile)
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(express.static(__dirname+'/public/'));
app.use('/assets', express.static(path.join(__dirname, 'assets')))
// app.use('/models', express.static(path.join(__dirname, '/public/models')))
// app.use('/js', express.static(path.join(__dirname, 'js')))
// app.use('/views', express.static(path.join(__dirname, '/public/views')))
  
const mongo_URI = 'mongodb+srv://SAC:G8BO4x3rWEDFSYqk@cluster0.btu1pyt.mongodb.net/userlist'
mongoose.connect(mongo_URI, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(result => {console.log('Connected To DB')})
  .catch(err => console.error(err))

app.get('/face',(req,res) => {
    res.render('index1.html')
});

// Registration Form submit handling
app.get("/register", (req, res) => {
    res.render('reg.html')
})

app.get("/print", (req, res) => {
    res.render('print.html')
})

app.get('/', function (req, res) {
    res.render("home.html");
});

app.get('/qr', function (req, res) {
  res.render("qr.html");
});

app.post('/addUser', (req,res) => {
    const data = req.body;
    // console.log(data)
    const imageData = data.image64.replace(/^data:image\/\w+;base64,/, '');
    // console.log(imageData)
     const buffer = Buffer.from(imageData, 'base64');
    //  console.log(buffer)
    fs.mkdirSync(`./assets/images/labels/${data.name}`)
     const imgName = `./assets/images/labels/${data.name}/1.png`
    fs.writeFileSync(imgName, buffer, err => {
          if (err) {  res.status(500).send({ error: 'Error saving image' })} 
          else {  res.send({ 'ImageName':imgName })
                 console.log('Added New User!')}
    });
})

app.get('/getLabels', (req,res)=>{
    const testFolder = path.join(__dirname, './assets/images/labels');
    // const fs = require('fs');
    // console.log(path.join(__dirname, ''))
    let labels = [];
    fs.readdirSync(testFolder).forEach(file => {
        // console.log(file);
        labels.push(file)
    });
    // console.log(labels)
    res.send(labels)
})

app.post("/upload", (req, res) => {
    const data = req.body;
    const imageData = data.image64.replace(/^data:image\/\w+;base64,/, '');
    // console.log(imageData)
     const buffer = Buffer.from(imageData, 'base64');
     const imgName = `./uploads/image${Date.now()}.png`
    fs.writeFile(imgName, buffer, err => {
          if (err) {  res.status(500).send({ error: 'Error saving image' })} 
          else {  res.send({ 'ImageName':imgName })}
    });  
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('getEmails' ,(e) => {
      async function asyncCall() {
        const result = await User.find({ $or: [ { "email": e }, { "phone":e} ] })
        io.emit('userList', result)
      }
      asyncCall();
    })
   
    socket.on('getAll' ,(e) => {
      async function asyncCall() {
        // const list = await User.count({ "isAttended": true })
        // io.emit('count', list)
        const result = await User.find( { "isAttended": true })
        .skip((e-1) * 110)
        .limit(110)
        io.emit('userList', result)
      }
      asyncCall();
    })
  
    socket.on('getUserOne' , (e) => {
      console.log(e);
      async function asyncCall() {
        await User.updateOne({"uniquecode":e.toLowerCase()},{$set: {"isAttended":true}})
        const result = await User.findOne( { "uniquecode": e.toLowerCase() } )
        io.emit('userDetailsOne',result )
      }
      asyncCall();
    })
  });

server.listen(port, ()=>console.log(`App started running on port: ${port}`))