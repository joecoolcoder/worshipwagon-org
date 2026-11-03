const audio = document.querySelector("#music-audio");
const shuffleButton = document.querySelector("#shuffle-button");
const playPauseButton = document.querySelector("#play-pause-button");
const nextButton = document.querySelector("#next-button");
const progressBar = document.querySelector("#progress-bar");
const nowPlayingTitle = document.querySelector("#now-playing-title");
const playerDetail = document.querySelector("#player-detail");
const timeDisplay = document.querySelector("#time-display");
const songCount = document.querySelector("#song-count");
const libraryTitle = document.querySelector("#library-title");
const trackList = document.querySelector("#track-list");
const emptyLibrary = document.querySelector("#empty-library");

let tracks = [];
let currentIndex = -1;

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

function updateControls() {
  const hasTracks = tracks.length > 0;
  const hasCurrentTrack = currentIndex >= 0;
  shuffleButton.disabled = !hasTracks;
  playPauseButton.disabled = !hasTracks;
  nextButton.disabled = !hasCurrentTrack;
  playPauseButton.textContent = audio.paused ? "Play" : "Pause";
}

function updatePlayerDetail() {
  if (currentIndex < 0) {
    playerDetail.textContent = "Use Shuffle to make a new listening order.";
    return;
  }

  playerDetail.textContent = `Song ${currentIndex + 1} of ${tracks.length}. The playlist repeats in this order.`;
}

function playTrack(index) {
  const track = tracks[index];

  if (!track) {
    return;
  }

  currentIndex = index;
  audio.src = encodeURI(track.file);
  nowPlayingTitle.textContent = track.title;
  updatePlayerDetail();
  renderTrackList();
  updateControls();

  audio.play().then(updateControls).catch(updateControls);
}

function playNextTrack() {
  if (!tracks.length) {
    return;
  }

  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % tracks.length;
  playTrack(nextIndex);
}

function startNewShuffle() {
  if (!tracks.length) {
    return;
  }

  const currentTrack = tracks[currentIndex];
  tracks = shuffle(tracks);

  if (currentTrack) {
    currentIndex = tracks.findIndex((track) => track.file === currentTrack.file);
    updatePlayerDetail();
    renderTrackList();
    updateControls();
    return;
  }

  playTrack(0);
}

function selectTrack(index) {
  if (index === currentIndex) {
    if (audio.paused) {
      audio.play().catch(updateControls);
    }
    return;
  }

  playTrack(index);
}

function renderTrackList() {
  trackList.replaceChildren();
  libraryTitle.textContent = "Shuffled Playlist";

  tracks.forEach((track, index) => {
    const item = document.createElement("li");
    const isCurrentTrack = index === currentIndex;
    item.className = `track-card${isCurrentTrack ? " is-current" : ""}`;
    item.toggleAttribute("aria-current", isCurrentTrack);

    const selectButton = document.createElement("button");
    selectButton.className = "track-select";
    selectButton.type = "button";
    selectButton.setAttribute("aria-label", `${isCurrentTrack ? "Now playing" : "Play"} ${track.title}`);
    selectButton.addEventListener("click", () => selectTrack(index));

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
    tracks = shuffle(Array.isArray(catalog.tracks) ? catalog.tracks.filter((track) => track.title && track.file) : []);
    songCount.textContent = `${tracks.length} song${tracks.length === 1 ? "" : "s"}`;
    emptyLibrary.hidden = tracks.length > 0;
    renderTrackList();

  } catch (error) {
    emptyLibrary.hidden = false;
  }

  updateControls();
}

shuffleButton.addEventListener("click", startNewShuffle);

playPauseButton.addEventListener("click", () => {
  if (currentIndex < 0) {
    playTrack(0);
    return;
  }

  if (audio.paused) {
    audio.play().catch(updateControls);
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
  renderTrackList();
  updateControls();
});
audio.addEventListener("pause", () => {
  renderTrackList();
  updateControls();
});
audio.addEventListener("ended", playNextTrack);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

loadLibrary();
