import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
});

const GROUP_ROOM = 'group';
const onlineUsers = new Set();

io.on('connection', (socket) => {
  console.log('connected userName:', socket.id);
  // JOIN APP
  socket.on('joinRoom', (userName) => {
    console.log("here is username",userName);
    socket.userName = userName;
    onlineUsers.add(userName);
    socket.join(GROUP_ROOM);

    // send updated user list to everyone
    io.emit('users', Array.from(onlineUsers));
  });

  // GROUP MESSAGE
  socket.on('chatMessage', (msg) => {
    socket.to(GROUP_ROOM).emit('chatMessage', msg);
  });

  // JOIN PRIVATE ROOM
  socket.on('joinPrivate', ({ from, to }) => {
    const room = [from, to].sort().join('_');
    socket.join(room);
  });

  // PRIVATE MESSAGE
  socket.on('privateMessage', ({ from, to, msg }) => {
    const room = [from, to].sort().join('_');

    socket.to(room).emit('privateMessage', {
      sender: from,
      text: msg,
      ts: Date.now(),
    });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (socket.userName) {
      onlineUsers.delete(socket.userName);
      io.emit('users', Array.from(onlineUsers));
    }
  });
});

server.listen(4600, () => {
  console.log('Server running on http://localhost:4600');
});
