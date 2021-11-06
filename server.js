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
    socket.broadcast.to(roomId).emit('user-connected', userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
    socket.on('move', (msg) => {
      socket.broadcast.to(roomId).emit('move', msg);
    });
  });
});

server.listen(process.env.PORT || 3000, () => console.log(`Server started on http://localhost:${process.env.PORT}`));