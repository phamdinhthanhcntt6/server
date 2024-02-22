const express = require("express");
const app = express();
const cors = require("cors");
const authRouter = require("./source/routers/authRouter");
const connectDb = require("./source/configs/connectDb");
const errorMiddleHandle = require("./middlewares/errorMiddleware");
require("dotenv").config();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.use("/auth", authRouter);
connectDb();
app.use(errorMiddleHandle);

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Server is starting at http://localhost:${PORT}`);
});
