// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.API_PORT;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

const apiRoutes = require("./routes/index");
app.use("/api", apiRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
