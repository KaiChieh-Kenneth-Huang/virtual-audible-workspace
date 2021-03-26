var preloadedBackgroundAudioBuffer = {};
var preloadedAudioBuffer = {};
var backgrounAudioElements = {};
var currentlyPlayingBackgroundSound;
const initialSelectedBackgroundSound = 'nowhere';
var selectedBackgroundSound;
var backgroundSoundMuted = false;
var muted = true;

const backgroundSoundGain = {
  nowhere: 1,
  people: 0.2,
  urban: 0.2,
  nature: 1,
}

const pages = {
  landing: 'landing-page',
  setup: 'setup-page',
  room: 'room-page'
}
var curPage = pages.landing;

const playBackgroundSound = (key) => {
  const randStartTime = Math.random() * backgrounAudioElements[key].buffer.duration;
  if (currentlyPlayingBackgroundSound) {
    currentlyPlayingBackgroundSound.stop();
    currentlyPlayingBackgroundSound = null;
  }
  playMonoSound(key, backgrounAudioElements, true, randStartTime);
  currentlyPlayingBackgroundSound = backgrounAudioElements[key].source;
}

const updateBackgroundSound = () => {
  if (muted || backgroundSoundMuted) {
    if (currentlyPlayingBackgroundSound) {
      currentlyPlayingBackgroundSound.stop();
      currentlyPlayingBackgroundSound = null;
    }
  } else {
    playBackgroundSound(selectedBackgroundSound);
  }
}

const allAudioBuffers = [preloadedBackgroundAudioBuffer, preloadedAudioBuffer];

const bkgSoundSwitch = document.querySelector('#background-sound-switch');

const backgroundSoundsReady = () => {
  bkgSoundSwitch.style.opacity = 1;
  bkgSoundSwitch.style.cursor = 'pointer';
  delete bkgSoundSwitch.dataset.loading;
  document.querySelector('#background-sounds-spinner').style.display = 'none';

  // register background sound names
  for (const [key, path] of Object.entries(BACKGROUND_SOUND_SRCS)) {
    backgrounAudioElements[key] = {
      source: null, // source created when sound is played
      buffer: preloadedBackgroundAudioBuffer[path],
      gain: backgroundSoundGain[key]
    }
  }
  preloadAudioElements(flattenObjectToUniqueStringArray(SOUND_SRCS), preloadedAudioBuffer, otherSoundsReady, 'other-sounds');
  //checkAllAudiosLoaded(allAudioBuffers, allSoundsReady);
}

const otherSoundsReady = () => {
  checkAllAudiosLoaded(allAudioBuffers, allSoundsReady);
}

const allSoundsReady = () => {
  document.querySelector('#enter-room-btn').disabled = false;
}

const checkAllAudiosLoaded = (buffers, callback) => {
  for(const buffer of buffers) {
    if (!buffer.loaded) {
      return;
    }
  }
  callback();
}
// initialize pages
for (const key in pages) {
  const page = pages[key];
  if (page !== curPage) {
    document.querySelector('#' + page).style.display = 'none';
  }
}

// make background sound switch unclickable
bkgSoundSwitch.style.opacity = 0.3;
bkgSoundSwitch.style.cursor = 'not-allowed';
bkgSoundSwitch.dataset.loading = 'loading';

document.onload = () => {
  preloadAudioElements(flattenObjectToUniqueStringArray(BACKGROUND_SOUND_SRCS), preloadedBackgroundAudioBuffer, backgroundSoundsReady,'background-sounds');
};

setSelectedBackgroundSound(initialSelectedBackgroundSound);
document.querySelector('#background-sound-select').dataset.value = initialSelectedBackgroundSound;

// event listeners
const initialsInputHandler = function(e) {
  if (e.target.value.length > 2) {
    showAlert('Maximum initials length is two characters.');
  }
  e.target.value = e.target.value.toUpperCase().substring(0, 2);
}
const initialsBox = document.querySelector('#initials');
initialsBox.addEventListener('input', initialsInputHandler);
initialsBox.addEventListener('propertychange', initialsInputHandler);

for (const soundSwitch of document.querySelectorAll('.sound-switch')) {
  soundSwitch.onclick = muteUnmute;
}

for (const select of document.querySelectorAll('.select-from-images')) {
  for (const item of select.querySelectorAll('li')) {
    item.onclick = selectFromImages;
    if (item.dataset.value === select.dataset.value) {
      item.querySelector('img').src = item.dataset.selected_src;
    } else {
      item.querySelector('img').src = item.dataset.unselected_src;
    }
  }
}

const changePage = (page) => {
  switch (curPage) {
    case pages.landing:
      exitLandingPage();
      break;
    case pages.setup:
      exitSetupPage();
      break;
    case pages.room:
      exitRoomPage();
      break;
  }
  switch (page) {
    case pages.landing:
      setUpLandingPage();
      break;
    case pages.setup:
      setUpSetupPage();
      break;
    case pages.room:
      setUpRoomPage();
      break;
  }
  // change page
  document.querySelector('#' + curPage).style.display = 'none';
  document.querySelector('#' + page).style.display = 'block';
  curPage = page;
}

document.querySelector('#pg-1-next-btn').onclick = () => {
  if (!initialsBox.value) {
    showAlert('Please enter your initials.');
  } else {
    changePage(pages.setup);
  }
};

document.querySelector('#pg-2-back-btn').onclick = () => {
  changePage(pages.landing);
};

function setUpLandingPage() {
  unMuteBackgroundSound();
}

function setUpSetupPage() {

}

function setUpRoomPage() {

}

function exitLandingPage() {
  muteBackgroundSound();
}

function exitSetupPage() {

}

function exitRoomPage() {
  
}

function setSelectedBackgroundSound(value) {
  selectedBackgroundSound = value;
  updateBackgroundSound();
}

function selectFromImages() {
  const select = this.parentElement;
  select.dataset.value = this.dataset.value;
  window[select.dataset.callback](this.dataset.value);
  console.log(select.dataset.value);
  for (const item of select.querySelectorAll('li')) {
    const value = item.dataset.value;
    if (value === select.dataset.value) {
      item.querySelector('img').src = item.dataset.selected_src;
    } else {
      item.querySelector('img').src = item.dataset.unselected_src;
    }
  }
}

function muteUnmute() {
  const status = this.dataset.status;
  if (this.dataset.loading) {
    return;
  }
  if (status === 'muted') {
    this.src = UNMUTED_ICON_PATH;
    this.dataset.status = 'unmuted';
    muted = false;
  } else if (status === 'unmuted') {
    this.src = MUTED_ICON_PATH;
    this.dataset.status = 'muted';
    muted = true;
  }
  updateBackgroundSound();
  console.log(status);
}

function muteBackgroundSound() {
  backgroundSoundMuted = true;
  updateBackgroundSound();
}

function unMuteBackgroundSound() {
  backgroundSoundMuted = false;
  updateBackgroundSound();
}

function preloadAudioElements(sources, audioBuffer, callback, name) {
  const startTime = Date.now();
  let sourceNum = 0;
  console.log('Begin preloading audio...');
  for (const src of sources) {
    sourceNum++;
    preloadAudioElement(src, audioBuffer);
  }

  const checkLoadComplete = setInterval(() => {
    if (sourceNum === Object.keys(audioBuffer).length) {
      const timeElapsed = (Date.now() - startTime) / 1000;
      console.log(name + ' preloaded in ' + timeElapsed + 's.');
      audioBuffer.loaded = true;
      callback();
      clearInterval(checkLoadComplete);
    }
  }, 500);
}

function preloadAudioElement(src, audioBuffer) {
    const myRequest = new Request(src);
  
    fetch(myRequest).then((response) => {
      return response.arrayBuffer();
    }).then((buffer) => {
      audioContext.decodeAudioData(buffer, (decodedData) => {
        // store the buffer for future use
        audioBuffer[src] = decodedData;
      });
    });
}


function playMonoSound(key, audioElements, loop, startTime) {
  const newSource = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  gainNode.gain.value = audioElements[key].gain;

  if (audioElements[key].source && audioElements[key].source.playbackState === 1) {
    try {
      audioElements[key].source.stop();
    } catch {
      console.log(audioElements[key].source);
    }
  }
  audioElements[key].source = newSource;
  if (loop !== undefined) {
    newSource.loop = loop;
  }
  newSource.buffer = audioElements[key].buffer;
  newSource.connect(gainNode);
  gainNode.connect(audioContext.destination);
  newSource.start(0, startTime);
}

function showAlert(text) {
  document.querySelector('#alert-modal').querySelector('.modal-body').innerText = text;
  $('#alert-modal').modal('show');
}

// helper functions
function chooseOneRandomlyFromList(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function rotateCoordinates({x, y}, rotation) {
    const sin = Math.sin(rotation / 180 * Math.PI);
    const cos = Math.cos(rotation / 180 * Math.PI);
    return {x: x * cos - y * sin, y: x * sin + y * cos}
}

function flattenObjectToUniqueStringArray(obj) {
    const set = new Set();
    const processObj = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          set.add(obj[key]);
        } else if (typeof obj[key] === 'object') {
          processObj(obj[key]);
        }
      }
    }
    processObj(obj);
    return set.keys();
}
