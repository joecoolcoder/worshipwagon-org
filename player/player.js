const audio = document.querySelector("#music-audio");
const shuffleButton = document.querySelector("#shuffle-button");
const pauseButton = document.querySelector("#pause-button");
const nextButton = document.querySelector("#next-button");
const progressBar = document.querySelector("#progress-bar");
const nowPlayingTitle = document.querySelector("#now-playing-title");
const playerDetail = document.querySelector("#player-detail");
const playerStatus = document.querySelector("#player-status");
const timeDisplay = document.querySelector("#time-display");
const songCount = document.querySelector("#song-count");
const trackList = document.querySelector("#track-list");
const emptyLibrary = document.querySelector("#empty-library");

let tracks = [];
let shuffleBag = [];
let currentTrack = null;

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const replacement = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[replacement]] = [shuffled[replacement], shuffled[index]];
  }

  return shuffled;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function updateTimeDisplay() {
  timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
}

function updateTrackList() {
  [...trackList.children].forEach((item) => {
    const isCurrentTrack = item.dataset.file === currentTrack?.file;
    item.classList.toggle("is-current", isCurrentTrack);
    item.toggleAttribute("aria-current", isCurrentTrack);
  });
}

function updateControls() {
  const hasTracks = tracks.length > 0;
  const hasCurrentTrack = Boolean(currentTrack);
  shuffleButton.disabled = !hasTracks;
  pauseButton.disabled = !hasCurrentTrack;
  nextButton.disabled = !hasCurrentTrack || shuffleBag.length === 0;
  pauseButton.textContent = audio.paused ? "Resume" : "Pause";
}

function playTrack(track) {
  currentTrack = track;
  audio.src = encodeURI(track.file);
  nowPlayingTitle.textContent = track.title;
  playerDetail.textContent = shuffleBag.length
    ? `${shuffleBag.length} song${shuffleBag.length === 1 ? "" : "s"} left in this shuffle.`
    : "This is the last song in this shuffle.";
  playerStatus.textContent = `Playing ${track.title}.`;
  updateTrackList();
  updateControls();

  audio.play().then(updateControls).catch(() => {
    playerStatus.textContent = `Unable to play ${track.title}. Please try the next song.`;
    updateControls();
  });
}

function playNextTrack() {
  if (!shuffleBag.length) {
    shuffleBag = shuffle(tracks);

    if (currentTrack && shuffleBag.length > 1 && shuffleBag[0].file === currentTrack.file) {
      [shuffleBag[0], shuffleBag[1]] = [shuffleBag[1], shuffleBag[0]];
    }
  }

  const nextTrack = shuffleBag.shift();

  if (nextTrack) {
    playTrack(nextTrack);
  }
}

function startNewShuffle() {
  shuffleBag = shuffle(tracks);
  playNextTrack();
}

function renderTrackList() {
  trackList.replaceChildren();

  tracks.forEach((track) => {
    const item = document.createElement("li");
    item.dataset.file = track.file;
    item.textContent = track.title;
    trackList.append(item);
  });
}

async function loadLibrary() {
  try {
    const response = await fetch("../assets/audio/catalog.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Catalog could not be loaded.");
    }

    const catalog = await response.json();
    tracks = Array.isArray(catalog.tracks) ? catalog.tracks.filter((track) => track.title && track.file) : [];
    songCount.textContent = `${tracks.length} song${tracks.length === 1 ? "" : "s"}`;
    emptyLibrary.hidden = tracks.length > 0;
    renderTrackList();

    if (tracks.length) {
      playerStatus.textContent = `${tracks.length} song${tracks.length === 1 ? " is" : "s are"} ready to play.`;
    } else {
      playerStatus.textContent = "The music library is not available yet.";
    }
  } catch (error) {
    emptyLibrary.hidden = false;
    playerStatus.textContent = "Unable to load the music library. Please try again later.";
  }

  updateControls();
}

shuffleButton.addEventListener("click", startNewShuffle);

pauseButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().catch(() => {
      playerStatus.textContent = "Unable to resume this song. Please try again.";
    });
  } else {
    audio.pause();
  }
});

nextButton.addEventListener("click", playNextTrack);

progressBar.addEventListener("input", () => {
  audio.currentTime = Number(progressBar.value);
  updateTimeDisplay();
});

audio.addEventListener("loadedmetadata", () => {
  progressBar.max = Math.floor(audio.duration);
  progressBar.disabled = false;
  updateTimeDisplay();
});

audio.addEventListener("timeupdate", () => {
  progressBar.value = Math.floor(audio.currentTime);
  updateTimeDisplay();
});

audio.addEventListener("play", updateControls);
audio.addEventListener("pause", updateControls);
audio.addEventListener("ended", playNextTrack);
audio.addEventListener("error", () => {
  playerStatus.textContent = "This song could not be played. Choose Next Song to continue.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

loadLibrary();
