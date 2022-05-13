const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const publicPath = path.join(__dirname, "public");
const port = process.env.PORT || 3000;
let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));

app.get("/", (req, res) => {
  console.log(publicPath);
  res.sendFile(path.join(publicPath, "index.html").toString());
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});
