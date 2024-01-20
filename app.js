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
  let usersInRoom = {};
  socketIdsInRoom.forEach((socketId) => {
    usersInRoom = {
      ...usersInRoom,
      [socketId]: socketToUsername[socketId],
    };
    console.log(usersInRoom);
  });

  return usersInRoom;
}

io.on("connection", (socket) => {
  console.log("A user connected");

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

  socket.on("startGame", (roomCode) => {
    console.log("starting game");
    socket.to(roomCode).emit("startGame");
  });

  socket.on("startCountdown", (roomCode) => {
    const duration = 5;
    console.log(`Starting a countdown timer of ${duration}s`);

    let timer = duration;
    const countdownInterval = setInterval(() => {
      io.to(roomCode).emit("setCountdown", timer);

      if (timer === 0) {
        clearInterval(countdownInterval);
        // io.to(roomCode).emit("countdownFinished");
      } else {
        timer--;
      }
    }, 1000);
  });

  socket.on("startGameClock", (roomCode) => {
    const duration = 30;
    console.log(`Starting a game clock timer of ${duration}s`);

    let timer = duration;
    const countdownInterval = setInterval(() => {
      io.to(roomCode).emit("setGameClock", timer);

      if (timer === 0) {
        clearInterval(countdownInterval);
        // io.to(roomCode).emit("countdownFinished");
      } else {
        timer--;
      }
    }, 1000);
  });

  socket.on("kickPlayer", (roomCode, user) => {
    Object.keys(getUsersInRoom(roomCode)).forEach((playerId) => {
      if (socketToUsername[playerId] === user) {
        delete socketToUsername[playerId];
      }
    });
  });
});

server.listen(API_PORT, () => {
  console.log(`Socket.IO Server is running on http://localhost:${API_PORT}`);
});
