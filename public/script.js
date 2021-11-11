const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const inviteButton = document.querySelector("#inviteButton");
const participantsList = document.getElementById('participants-list');
myVideo.muted = true;

const peers = {}
var board;
var game;
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var currentFen = '';

var configAnalysis = {
  draggable: true,
  position: 'start',
  onDrop: handleMove,
};
var configPosition = {
  draggable: true,
  dropOffBoard: 'trash',
  sparePieces: true
}

window.onload = function () {
  initGame();
};

var initGame = function () {
  var configAnalysis = {
    draggable: true,
    position: localStorage.getItem('currentFen') ? localStorage.getItem('currentFen') : 'start',
    onDrop: handleMove,
  };
  var configPosition = {
    draggable: true,
    dropOffBoard: 'trash',
    sparePieces: true,
    onDrop: handleDrop
  }

  game = localStorage.getItem('currentFen') ? new Chess(localStorage.getItem('currentFen')) : new Chess();
  board = new ChessBoard('mainBoard', configAnalysis);

  $('#position').on('click', () => {
    board = new ChessBoard('mainBoard', configPosition);
    document.getElementsByClassName('pos-config')[0].style.display = 'block';
    socket.emit('changeBoard', 'position');
  });

  $('#analysis').on('click', () => {
    game = new Chess()
    board = new ChessBoard('mainBoard', configAnalysis)
    document.getElementsByClassName('pos-config')[0].style.display = 'none'
    $fen.html('')
    currentFen = ''
    $pgn.html('')
    socket.emit('changeBoard', 'analysis');
  });

  $('#clearBtn').on('click', () => {
    board = new ChessBoard('mainBoard', configPosition);
  })
}

var handleMove = function (source, target) {
  var move = game.move({ from: source, to: target });
  if (move == null) return 'snapback';
  else {
    socket.emit('move', move);
  }
  $fen.html(game.fen())
  currentFen = game.fen()
  $pgn.html(game.pgn())
  saveData(game.fen());
}

var handleDrop = function (source, target, piece, newPos, oldPos, orientation) {
  socket.emit('positionPieceDrop', newPos);
}

socket.on('move', function (msg) {
  game.move(msg);
  board.position(game.fen());
})

socket.on('changeBoard', function (newconfig) {
  if (newconfig == 'analysis') {
    game = new Chess()
    board = new ChessBoard('mainBoard', configAnalysis)
    document.getElementsByClassName('pos-config')[0].style.display = 'none'
    $fen.html('')
    currentFen = ''
    $pgn.html('')
  } else if (newconfig == 'position') {
    board = new ChessBoard('mainBoard', configPosition);
    document.getElementsByClassName('pos-config')[0].style.display = 'block';
  }
})

socket.on('positionPieceDrop', function (msg) {
  board = new ChessBoard('mainBoard', {
    draggable: true,
    dropOffBoard: 'trash',
    position: msg,
    sparePieces: true,
    onDrop: handleDrop
  });
  document.getElementsByClassName('pos-config')[0].style.display = 'block';

})

var user = prompt("Enter your name");
var users = []
if (user == '') {
  var user = prompt('Enter your name');
}
appendToStorage('users', user);
users = localStorage.getItem('users').split(' ');

users.forEach(user => {
  const span = document.createElement('span')
  span.innerHTML = user
  participantsList.append(span)
});

var peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})
// var peer = new Peer(undefined, {
//   host: '/',
//   port: '3001'
// })

let myVideoStream;
navigator.mediaDevices.getUserMedia({
  audio: true,
  video: false,
}).then((stream) => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  peer.on('call', (call) => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', (userId, userName) => {
    connectToNewUser(userId, userName, stream);
  });
});

socket.on('user-disconnected', (userId, userName) => {
  if (peers[userId]) peers[userId].close()
  const i = users.indexOf(userName)
  if (i > -1) {
    users.splice(i, 1);
  }
  console.log(users);
})

const connectToNewUser = (userId, userName, stream) => {
  users.push(userName)
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  peers[userId] = call
  const span = document.createElement('span')
  span.innerHTML = userName
  participantsList.append(span)
};

peer.on('open', (id) => {
  socket.emit('join-room', ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

socket.on("createMessage", (message, userName) => {
  console.log('msg');
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
    }</span> </b>
        <span>${message}</span>
    </div>`;
});

function saveData(fen) {
  if (fen) {
    localStorage.setItem('currentFen', fen);
  }
}

function appendToStorage(name, data) {
  var old = localStorage.getItem(name);
  if (old === null) old = "";
  localStorage.setItem(name, old + " " + data);
}
