const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require('method-override');
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Gird = require("gridfs-stream");


const app = express();


// mongoose.connect("mongodb://mahen:12345a@ds355357.mlab.com:55357/aggregation",
// {  useCreateIndex: true,useFindAndModify: false , useNewUrlParser: true }).then(()=>{
//     console.log("mongodb is connected")
// })


app.set('view engine','ejs');
app.use(bodyParser.json());
app.use(methodOverride('_method'));

const mongoURI = "mongodb://mahen:12345a@ds355357.mlab.com:55357/aggregation";
const conn = mongoose.createConnection(mongoURI);
let gfs ;
conn.once('open',()=>{
    gfs = Gird(conn.db,mongoose.mongo);
    gfs.collection('uploads');
})
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

app.get("/",(req,res)=>{
  gfs.files.find().toArray((err,files)=>{
    if(!files || files.length === 0){
      res.render("index",{files:false});
    }else{
      files.map(file =>{
        if(file.contentType === "image/jpeg" || file.contentType === "image/png"){
            file.isImage = true
        }else{
          file.isImage = false
        }
      })
      res.render("index",{files});
    }
    
  })
    
})
app.post("/upload",upload.single('file'),(req,res)=>{
    res.redirect("/");
})
app.get("/files",(req,res)=>{
  gfs.files.find().toArray((err,files)=>{
    if(!files || files.length === 0){
      return res.status(404).json({
        err:'no file is exist'
      })
    }
    return res.json(files)
  })
})
app.get("/files/:filename",(req,res)=>{
  gfs.files.findOne({filename:req.params.filename},(err,file)=>{
    if(!file || file.length === 0){
      return res.status(404).json({
        err:'no file is exist'
      })
    }
    return res.json(file)

  })
})
app.get("/image/:filename",(req,res)=>{
  gfs.files.findOne({filename:req.params.filename},(err,file)=>{
    if(!file || file.length === 0){
      return res.status(404).json({
        err:'no file is exist'
      })
    }
    if(file.contentType === "image/jpeg" || file.contentType === "img/png"){
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    }else{
      return res.status(404).json({
        err:'no file is exist'
      })
    }

  })
})

app.delete('/files/:id',(req,res)=>{
  gfs.remove({_id:req.params.id,root:'uploads'},(err,gridStore)=>{
    if(err){
      return res.status(404).json({err:err})
    }
    res.redirect("/");
  })
})

app.listen(3001,()=>{
    console.log("everything is okk");
})