let audioCtx = null;
let masterGain = null;
let musicGain = null;
let musicPlaying = false;
let musicOscs = [];

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(masterGain);
  }
}

function setVolume(v) {
  if (masterGain) masterGain.gain.value = v;
}

function setMute(muted) {
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  source.connect(gain);
  gain.connect(masterGain);
  source.start();
}

const sfx = {
  paddleHit() {
    playTone(440, 0.08, 'square', 0.2);
    playTone(660, 0.06, 'square', 0.1);
  },
  brickHit(row = 0) {
    const pitchMod = 1 + (7 - row) * 0.08;
    playTone(880 * pitchMod, 0.05, 'square', 0.15);
    playTone(1100 * pitchMod, 0.04, 'square', 0.1);
  },
  steelHit() {
    playTone(220, 0.1, 'triangle', 0.1);
  },
  wallHit() {
    playTone(330, 0.05, 'triangle', 0.1);
  },
  powerUp() {
    playTone(523, 0.08, 'square', 0.15);
    setTimeout(() => playTone(659, 0.08, 'square', 0.15), 80);
    setTimeout(() => playTone(784, 0.12, 'square', 0.15), 160);
  },
  loseLife() {
    playNoise(0.3, 0.2);
    playTone(200, 0.3, 'sawtooth', 0.15);
    setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.1), 150);
  },
  laser() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  },
  stageClear() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'square', 0.15), i * 120);
    });
  },
  gameStart() {
    const notes = [261, 329, 392, 523];
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.2, 'square', 0.12), i * 150);
    });
  },
  launch() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  },
  teleport() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  },
};

const MUSIC_PATTERNS = [
  [261, 0, 329, 0, 392, 0, 523, 0, 392, 0, 329, 0, 261, 0, 196, 0],
  [196, 0, 261, 0, 329, 0, 392, 0, 329, 0, 261, 0, 196, 0, 164, 0],
  [329, 0, 392, 0, 523, 0, 659, 0, 523, 0, 392, 0, 329, 0, 261, 0],
  [164, 0, 196, 0, 261, 0, 329, 0, 261, 0, 196, 0, 164, 0, 130, 0],
];

let musicStep = 0;
let musicPatternIdx = 0;
let musicInterval = null;

function startMusic(stageNum = 1) {
  if (!audioCtx || musicPlaying) return;
  stopMusic();
  musicPlaying = true;
  musicPatternIdx = (stageNum - 1) % MUSIC_PATTERNS.length;
  musicStep = 0;

  musicInterval = setInterval(() => {
    if (!audioCtx || !musicPlaying) return;
    const pattern = MUSIC_PATTERNS[musicPatternIdx];
    const freq = pattern[musicStep % pattern.length];
    if (freq > 0) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }

    const bassPattern = [130, 0, 0, 0, 164, 0, 0, 0, 196, 0, 0, 0, 164, 0, 0, 0];
    const bassFreq = bassPattern[musicStep % bassPattern.length];
    if (bassFreq > 0) {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(bassFreq, audioCtx.currentTime);
      gain2.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(musicGain);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.35);
    }

    musicStep++;
    if (musicStep % pattern.length === 0) {
      musicPatternIdx = (musicPatternIdx + 1) % MUSIC_PATTERNS.length;
    }
  }, 200);
}

function stopMusic() {
  musicPlaying = false;
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

export { initAudio, sfx, setVolume, setMute, startMusic, stopMusic };
