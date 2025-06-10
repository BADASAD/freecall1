const remoteAudio = document.getElementById('remoteAudio');
const ringtone = document.getElementById('ringtone');
const myIdSpan = document.getElementById('my-id');
const callBtn = document.getElementById('call-btn');
const statusDiv = document.getElementById('status');
const warningDiv = document.getElementById('warning');

let currentCall = null;
let localStream = null;
let isMuted = false;

// Peer ID storage
let savedId = localStorage.getItem('permanentPeerId');
const peer = new Peer(savedId || undefined);

peer.on('open', id => {
  myIdSpan.textContent = id;
  if (!savedId) localStorage.setItem('permanentPeerId', id);
});

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
  localStream = stream;

  peer.on('call', call => {
    ringtone.play();
    call.answer(localStream);
    call.on('stream', remoteStream => {
      ringtone.pause();
      remoteAudio.srcObject = remoteStream;
      updateStatus("In Call");
    });
    currentCall = call;
  });

  window.callPeer = function () {
    if (!canCallToday()) {
      warningDiv.style.display = 'block';
      callBtn.disabled = true;
      return;
    }

    const peerId = document.getElementById('peer-id').value;
    if (!peerId) return;

    updateStatus("Calling...");
    incrementCallCount();

    const call = peer.call(peerId, localStream);
    call.on('stream', remoteStream => {
      remoteAudio.srcObject = remoteStream;
      updateStatus("In Call");
    });
    currentCall = call;
  };

  window.toggleMute = function () {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
  };

  window.endCall = function () {
    if (currentCall) {
      currentCall.close();
      currentCall = null;
    }
    if (remoteAudio.srcObject) {
      remoteAudio.srcObject.getTracks().forEach(track => track.stop());
      remoteAudio.srcObject = null;
    }
    updateStatus("Call Ended");
  };

}).catch(error => {
  console.error('Microphone access error:', error);
});

function updateStatus(text) {
  statusDiv.textContent = "Status: " + text;
}

// Call limit logic
function getTodayKey() {
  const today = new Date();
  return 'callCount_' + today.toISOString().split('T')[0];
}

function getCallCount() {
  return parseInt(localStorage.getItem(getTodayKey()) || "0");
}

function incrementCallCount() {
  let count = getCallCount() + 1;
  localStorage.setItem(getTodayKey(), count);
}

function canCallToday() {
  return getCallCount() < 3;
}
