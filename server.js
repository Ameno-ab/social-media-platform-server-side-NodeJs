import express from "express";
import Mongoose from "mongoose";
import cors from "cors";
 import { readdirSync } from "fs";

const morgan = require("morgan");
require("dotenv").config();
const app = express();

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
    origin: ["http://localhost:3000"],
  })
);
readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));
const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`server running on port ${port}`));
