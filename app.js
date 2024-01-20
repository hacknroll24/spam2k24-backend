// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors());

// Define a route
app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

app.get("/api/data", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
