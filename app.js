// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const API_PORT = process.env.API_PORT;
const FRONTEND_PORT = process.env.FRONTEND_PORT;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

// const apiRoutes = require("./routes");
// app.use("/api", apiRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: `http://localhost:${FRONTEND_PORT}`,
  },
});

// Store the mapping of socket IDs to usernames
const socketToUsername = {};
function getUsersInRoom(roomCode) {
  const socketIdsInRoom = Array.from(
    io.sockets.adapter.rooms.get(roomCode) || []
  );
  const usersInRoom = socketIdsInRoom.map((socketId) => ({
    [socketId]: socketToUsername[socketId],
  }));
  return socketToUsername;
}

io.on("connection", (socket) => {
  console.log("A user connected");

  // socket.join(roomCode);
  // socket.emit("currentPlayers", io.in(roomCode).clients);

  // Handle events from the client
  socket.on("sendMessage", (message) => {
    console.log("Received message from client:", message);

    // Broadcast the message to all connected clients
    io.emit("message", { text: message });
  });

  socket.on("joinRoom", ({ roomCode, user }) => {
    socket.join(roomCode);

    // Messages
    socket.emit("message", `You joined room ${roomCode}`);
    socket.to(roomCode).emit("message", `${user} joined room ${roomCode}`);

    console.log(io.sockets.adapter.rooms.get(roomCode));

    socket.emit("roomJoined");

    socketToUsername[socket.id] = user;

    io.to(roomCode).emit("userList", getUsersInRoom(roomCode));
  });

  socket.on("click", (newIq, user, roomCode) => {
    socket.to(roomCode).emit("updateClick", user, newIq);
  });

  socket.on("accountUser", (user) => {
    socket.emit("accountUser", user);
  });

  socket.on("startGame", (roomCode) => {
    console.log("starting game");
    socket.to(roomCode).emit("startGame");
  });

  // Handle disconnect
  socket.on("disconnect", (roomCode, user) => {
    console.log("A user disconnected");
    delete socketToUsername[socket.id];
    socket.to(roomCode).emit("accountUser", user);
    socket.disconnect();
  });
});

server.listen(API_PORT, () => {
  console.log(`Socket.IO Server is running on http://localhost:${API_PORT}`);
});
