const express = require('express');
const fs = require('fs');
// var privateKey = fs.readFileSync('./ssl/privkey.pem');
// var certificate = fs.readFileSync('./ssl/cert.pem');
require('dotenv').config()
const app = express();
// const server = require('https').createServer({ key: privateKey, cert: certificate }, app);
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
// const peerServer = ExpressPeerServer(server, {
//   debug: true,
//   host: '/',
//   port: '3001'
// });

var indexRouter = require('./routes/index');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerServer);
app.use('/', indexRouter);
app.get('/', (req, res) => {
  res.render('landing');
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId, userName);
    socket.on('user-disconnected', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId, userName)
    })
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
    socket.on('move', (msg) => {
      socket.broadcast.to(roomId).emit('move', msg);
    });
    socket.on('changeBoard', (newconfig) => {
      socket.broadcast.to(roomId).emit('changeBoard', newconfig);
    })
    socket.on('positionPieceDrop', (msg) => {
      socket.broadcast.to(roomId).emit('positionPieceDrop', msg);
    })
  });
});

server.listen(process.env.PORT || 3000, () => console.log(`Server started on http://localhost:${process.env.PORT}`));