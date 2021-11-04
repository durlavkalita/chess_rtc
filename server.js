const express = require('express');
require('dotenv').config()
const app = express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId);
  });

  socket.on('move', (msg) => {
    socket.broadcast.emit('move', msg);
  });
});

server.listen(process.env.PORT || 3000);