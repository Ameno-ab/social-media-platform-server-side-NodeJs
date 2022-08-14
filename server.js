import express from "express";
import Mongoose from "mongoose";
import cors from "cors";
 import { readdirSync } from "fs";

const morgan = require("morgan");
require("dotenv").config();
const app = express();
const http= require("http").createServer(app);
const io = require("socket.io")(http,{
  path:"/socket.io",
  cors:{
    origin:"http://localhost:3000",
    methods:["GET","POST"],
    allowedHeaders:["Content-type"],
  },
})
Mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  //   useCreateIndex: true,
  //     useFindAndModify: false,
  useUnifiedTopology: true,
})
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB CONNECTION ERROR =>", err));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.CLIENT_URL],
  })
);
readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

//socketio

// io.on("connect" , (socket)=>{
//   //  console.log("socket io",socket.id);
//   socket.on("send-message",(message)=>{
//     // console.log("New message received =>",message)
//     socket.broadcast.emit("recieve-message",message)
//   })
// });


io.on("connect" , (socket)=>{
  //  console.log("socket io",socket.id);
  socket.on("new-post",(newPost)=>{
    //  console.log("New post =>",newPost)
    socket.broadcast.emit("new-post",newPost);
  
  })
});
const port = process.env.PORT || 8000;
http.listen(port, () => console.log(`server running on port ${port}`));
