const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
const PORT = 3001;
app.get("/auth/hello", (_req, res) => {
  res.send("<h1>Hello world</h1>");
});
app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Server is starting at http://localhost:${PORT}`);
});
