const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const inviteButton = document.querySelector("#inviteButton");
myVideo.muted = true;

var board;
var game;

window.onload = function () {
  initGame();
};

var initGame = function () {
  var config = {
    draggable: true,
    position: 'start',
    // onDragStart: onDragStart,
    onDrop: handleMove,
    // onSnapEnd: onSnapEnd
  };

  game = new Chess();
  board = new ChessBoard('mainBoard', config);
}

var handleMove = function (source, target) {
  var move = game.move({ from: source, to: target });
  if (move == null) return 'snapback';
  else {
    socket.emit('move', move);
  }
}

socket.on('move', function (msg) {
  game.move(msg);
  board.position(game.fen());
})

const user = prompt("Enter your name");

var peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})

let myVideoStream;
navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
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

  socket.on('user-connected', (userId) => {
    connectToNewUser(userId, stream);
  });
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
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