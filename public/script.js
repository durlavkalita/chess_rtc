const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const inviteButton = document.querySelector("#inviteButton");
const participantsList = document.getElementById('participants-list');
const sessionClear = document.getElementById('clear-session');
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let myVideoStream;
const peers = {}
var board;
var game;
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var currentFen = '';
myVideo.muted = true;

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
appendToStorage('users', user);
users = localStorage.getItem('users').split(' ');
users.forEach(user => {
  const span = document.createElement('span')
  span.innerHTML = user
  participantsList.append(span)
});

// for heroku deployment
var peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})

// for localhost testing - run peerjs --port 3001
// var peer = new Peer(undefined, {
//   host: '/',
//   port: '3001'
// })

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

const connectToNewUser = (userId, userName, stream) => {
  // users.push(userName)
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
    html = `<i class="fas fa-microphone-slash fa-lg text-red-500"></i>`;
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone fa-lg text-green-500"></i>`;
    muteButton.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

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

sessionClear.addEventListener('click', (e) => {
  e.preventDefault();
  if (localStorage.getItem('users') || localStorage.getItem('currentFen')) {
    localStorage.setItem('users', '');
    localStorage.setItem('currentFen', '');
  }
  location.reload();
})

socket.on("createMessage", (message, userName) => {
  msg = document.createElement('div');
  msg.innerHTML =
    `<div class="message">
        <i class="far fa-user-circle text-gray-500"></i> <span class="text-sm text-gray-500"> ${userName}
    </span>
        <span class="px-1">${message}</span>
    </div>`;
  if (userName === user) {
    msg.classList.add('self')
  }
  messages.append(msg);
});

socket.on("updateUsersList", (userName) => {
  console.log(userName);
  var users = localStorage.getItem('users');
  users.replace(userName, "");
  console.log(users);
  localStorage.setItem('users', users);
})

function saveData(fen) {
  if (fen) {
    localStorage.setItem('currentFen', fen);
  }
}

function appendToStorage(name, data) {
  var old = localStorage.getItem(name);
  if (old === null) old = "";
  if (old === null) {
    old = "";
    localStorage.setItem(name, data);
  } else {
    localStorage.setItem(name, old + " " + data);
  }
}
