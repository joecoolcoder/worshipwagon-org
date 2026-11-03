const audio = document.querySelector("#music-audio");
const shuffleButton = document.querySelector("#shuffle-button");
const playPauseButton = document.querySelector("#play-pause-button");
const nextButton = document.querySelector("#next-button");
const progressBar = document.querySelector("#progress-bar");
const nowPlayingTitle = document.querySelector("#now-playing-title");
const playerDetail = document.querySelector("#player-detail");
const playerStatus = document.querySelector("#player-status");
const timeDisplay = document.querySelector("#time-display");
const songCount = document.querySelector("#song-count");
const libraryTitle = document.querySelector("#library-title");
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
  renderTrackList();
}

function updateControls() {
  const hasTracks = tracks.length > 0;
  const hasCurrentTrack = Boolean(currentTrack);
  shuffleButton.disabled = !hasTracks;
  playPauseButton.disabled = !hasTracks;
  nextButton.disabled = !hasCurrentTrack;
  playPauseButton.textContent = audio.paused ? "Play" : "Pause";
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
  if (!tracks.length) {
    return;
  }

  shuffleBag = shuffle(tracks.filter((track) => track.file !== currentTrack?.file));

  if (currentTrack) {
    playerDetail.textContent = `${shuffleBag.length} song${shuffleBag.length === 1 ? "" : "s"} left in this shuffle.`;
    playerStatus.textContent = "Your song queue has been shuffled.";
    updateTrackList();
    updateControls();
  } else {
    playNextTrack();
  }
}

function queueTracks() {
  return currentTrack ? [currentTrack, ...shuffleBag] : tracks;
}

function selectTrack(track) {
  if (track.file === currentTrack?.file) {
    if (audio.paused) {
      audio.play().catch(() => {
        playerStatus.textContent = `Unable to play ${track.title}. Please try again.`;
      });
    }
    return;
  }

  const remainingTracks = shuffleBag.filter((queuedTrack) => queuedTrack.file !== track.file);
  shuffleBag = remainingTracks.length
    ? remainingTracks
    : shuffle(tracks.filter((queuedTrack) => queuedTrack.file !== track.file));
  playTrack(track);
}

function renderTrackList() {
  trackList.replaceChildren();
  const queuedTracks = queueTracks();
  const isShuffled = Boolean(currentTrack);
  libraryTitle.textContent = isShuffled ? "Shuffle Queue" : "Available Songs";

  queuedTracks.forEach((track, index) => {
    const item = document.createElement("li");
    item.dataset.file = track.file;
    const isCurrentTrack = track.file === currentTrack?.file;
    item.className = `track-card${isCurrentTrack ? " is-current" : ""}`;
    item.toggleAttribute("aria-current", isCurrentTrack);

    const selectButton = document.createElement("button");
    selectButton.className = "track-select";
    selectButton.type = "button";
    selectButton.setAttribute("aria-label", `${isCurrentTrack ? "Now playing" : "Play"} ${track.title}`);
    selectButton.addEventListener("click", () => selectTrack(track));

    const order = document.createElement("span");
    order.className = "track-order";
    order.textContent = String(index + 1).padStart(2, "0");

    const icon = document.createElement("span");
    icon.className = "track-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = isCurrentTrack && !audio.paused ? "♫" : "♪";

    const text = document.createElement("span");
    text.className = "track-text";
    const title = document.createElement("span");
    title.className = "track-title";
    title.textContent = track.title;
    text.append(title);

    if (isCurrentTrack) {
      const state = document.createElement("span");
      state.className = "track-state";
      state.textContent = audio.paused ? "Paused" : "Now Playing";
      text.append(state);
    }

    selectButton.append(order, icon, text);

    const download = document.createElement("a");
    download.className = "track-download";
    download.href = encodeURI(track.file);
    download.download = "";
    download.setAttribute("aria-label", `Download ${track.title}`);
    download.title = `Download ${track.title}`;
    download.innerHTML = '<span aria-hidden="true">⇩</span><span class="download-label">Download</span>';

    item.append(selectButton, download);
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

playPauseButton.addEventListener("click", () => {
  if (!currentTrack) {
    startNewShuffle();
    return;
  }

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

audio.addEventListener("play", () => {
  updateTrackList();
  updateControls();
});
audio.addEventListener("pause", () => {
  updateTrackList();
  updateControls();
});
audio.addEventListener("ended", playNextTrack);
audio.addEventListener("error", () => {
  playerStatus.textContent = "This song could not be played. Choose Next Song to continue.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

loadLibrary();
