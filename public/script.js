var preloadedBackgroundAudioBuffer = {};
var preloadedAudioBuffer = {};
var backgrounAudioElements = {};
var currentlyPlayingBackgroundSound;
const initialSelectedBackgroundSound = 'nowhere';
var selectedBackgroundSound;
var backgroundSoundMuted = false;
var muted = true;

var avatarAudioProfile = {};
var soundAvatarGenerator;
var singleSoundPlayer;

const backgroundSoundGain = {
  nowhere: 0.8,
  people: 0.1,
  urban: 0.1,
  nature: 0.5,
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

const pauseBackgroundSound = () => {
  if (currentlyPlayingBackgroundSound) {
    currentlyPlayingBackgroundSound.stop();
    currentlyPlayingBackgroundSound = null;
  }
}

const updateBackgroundSound = () => {
  if (muted || backgroundSoundMuted) {
    pauseBackgroundSound();
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

const setUpSingleSoundPlayer = () => {
  const audioProfile = {
    ['type-slow']: new AudioSettings(
      SOUND_SRCS.type.slow,
      0.3,
      AUDIO_SETTING.PARTIAL_PLAY,
      500,
      1000,
      500,
      1000
    ),
    ['type-fast']: new AudioSettings(
      SOUND_SRCS.type.fast,
      0.3,
      AUDIO_SETTING.PARTIAL_PLAY,
      500,
      1000,
      1000,
      2000
    ),
    ['clicking']: new AudioGroup(
      [
        new AudioGroupWrapper(
          'single-click', // name
          new AudioSettings(
            SOUND_SRCS.click.single,
            0.5,
            AUDIO_SETTING.DEFAULT,
          ), // settings
          5, // relative frequency
          500, // duration
          1000, // random additional duration
        ),
        new AudioGroupWrapper(
          'double-click', // name
          new AudioSettings(
            SOUND_SRCS.click.double,
            0.5,
            AUDIO_SETTING.DEFAULT,
          ), // settings
          1, // relative frequency
          1500, // duration
          0, // random additional duration
        )
      ],
      0,
      0
    ),
    ['reading']: new AudioSettings(
      SOUND_SRCS.pageFlip.single,
      0.7,
      AUDIO_SETTING.DEFAULT,
    ),
    ['sniffle']: new AudioSettings(
      SOUND_SRCS.sniffle.default,
      1,
      AUDIO_SETTING.DEFAULT,
    ),
    ['movement-on-chair']: new AudioSettings(
      SOUND_SRCS.chair.movingCreak,
      1,
      AUDIO_SETTING.DEFAULT,
    ),
    ['cough-lower']: new AudioSettings(
      SOUND_SRCS.cough.male,
      0.5,
      AUDIO_SETTING.DEFAULT,
    ),
    ['cough-higher']: new AudioSettings(
      SOUND_SRCS.cough.female,
      0.2,
      AUDIO_SETTING.DEFAULT,
    ),
    ['sneeze-lower']: new AudioSettings(
      SOUND_SRCS.sneeze.male,
      0.2,
      AUDIO_SETTING.DEFAULT,
    ),
    ['sneeze-higher']: new AudioSettings(
      SOUND_SRCS.sneeze.female,
      0.5,
      AUDIO_SETTING.DEFAULT,
    ),
    ['throat-clear-lower']: new AudioSettings(
      SOUND_SRCS.throatClear.male,
      0.2,
      AUDIO_SETTING.DEFAULT,
    ),
    ['throat-clear-higher']: new AudioSettings(
      SOUND_SRCS.throatClear.female,
      0.1,
      AUDIO_SETTING.DEFAULT,
    ),
    ['footsteps-slow']: new AudioSettings(
      SOUND_SRCS.footstep.softSneakers,
      1,
      AUDIO_SETTING.INTERMITTENT,
      700 * 0.9,
      700 * 0.2
    ),
    ['footsteps-fast']: new AudioSettings(
      SOUND_SRCS.footstep.softSneakers,
      1,
      AUDIO_SETTING.INTERMITTENT,
      500 * 0.9,
      500 * 0.2
    ),
    ['door-gentle']: new AudioSettings(
      SOUND_SRCS.door.gentle,
      1,
      AUDIO_SETTING.DEFAULT,
    ),
    ['door-hard']: new AudioSettings(
      SOUND_SRCS.door.slam,
      1,
      AUDIO_SETTING.DEFAULT,
    ),
    ['chair-quick']: new AudioSettings(
      SOUND_SRCS.chair.slideQuick,
      0.4,
      AUDIO_SETTING.DEFAULT,
    ),
    ['chair-slow']: new AudioSettings(
      SOUND_SRCS.chair.slideSlow,
      1,
      AUDIO_SETTING.DEFAULT,
    ),
  };
  singleSoundPlayer = new SoundAvatarGenerator(audioContext, audioProfile);

  for (const playIcon of document.querySelectorAll('.fa-play')) {
    const id = playIcon.previousElementSibling.id;
    playIcon.addEventListener('click', function() {
      const soundId = playIcon.dataset.altsetector
        ? id + '-' + $('input[name="' + playIcon.dataset.altsetector + '"]:checked').val()
        : id;

      console.log(soundId)
      const audioDuration = singleSoundPlayer.audioProfile[soundId].category === AUDIO_SETTING.DEFAULT
        ? singleSoundPlayer.getAudioDuration(soundId)
        : 5;
      
      singleSoundPlayer.play(soundId);
      playIcon.classList.add('text-success');
      setTimeout(() => {
        playIcon.classList.remove('text-success');
        singleSoundPlayer.pause(soundId);
      }, audioDuration * 1000);
    });
  }
}

const setUpSoundAvatarGenerator = () => {
  soundAvatarGenerator = new SoundAvatarGenerator(audioContext, avatarAudioProfile);
}

const updateWorkSounds = () => {
  const workSounds = [];
  const typing = document.querySelector('#type').checked;
  const clicking = document.querySelector('#clicking').checked;
  const reading = document.querySelector('#reading').checked;
  const gainCoefficient = 0.6;
  const avatarPlaying = soundAvatarGenerator.isAvatarPlaying;

  if (avatarPlaying) {
    soundAvatarGenerator.pauseAvatar();
  }
  
  // create work sounds
  if (typing) {
    if ($('input[name="type"]:checked').val() === 'slow') {
      workSounds.push(new AudioGroupWrapper(
        'type', // name
        new AudioSettings(
          SOUND_SRCS.type.slow,
          1 * gainCoefficient,
          AUDIO_SETTING.PARTIAL_PLAY,
          500,
          1000,
          1000,
          2000
        ), // settings
        10, // relative frequency
        5000, // duration
        5000, // random additional duration
      ));
    } else {
      workSounds.push(new AudioGroupWrapper(
        'type', // name
        new AudioSettings(
          SOUND_SRCS.type.fast,
          1 * gainCoefficient,
          AUDIO_SETTING.PARTIAL_PLAY,
          500,
          1000,
          500,
          1000
        ), // settings
        10, // relative frequency
        5000, // duration
        5000, // random additional duration
      ));
    }
  }
  if (clicking) {
    workSounds.push(new AudioGroupWrapper(
      'single-click', // name
      new AudioSettings(
        SOUND_SRCS.click.single,
        1 * gainCoefficient,
        AUDIO_SETTING.INTERMITTENT,
        100,
        5000
      ), // settings
      typing ? 5 : 10, // relative frequency
      1000, // duration
      5000, // random additional duration
    ));
    workSounds.push(new AudioGroupWrapper(
      'double-click', // name
      new AudioSettings(
        SOUND_SRCS.click.double,
        1 * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
      ), // settings
      1, // relative frequency
      1500, // duration
      0, // random additional duration
    ));
  }
  if (reading) {
    workSounds.push(new AudioGroupWrapper(
      'page-flip', // name
      new AudioSettings(
        SOUND_SRCS.pageFlip.single,
        1 * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
      ), // settings
      1, // relative frequency
      2000, // duration
      0, // random additional duration
    ));
  }

  // configure switch task pause for work sounds
  let switchTaskPause = 1000;
  let randAdditionalSwitchTaskPause = 2000;
  if (reading && !typing && !clicking) {
    randAdditionalSwitchTaskPause = 100000;
  }
  if (workSounds.length) {
    avatarAudioProfile[SOUND_GROUP_NAME.WORK] = new AudioGroup(workSounds, switchTaskPause, randAdditionalSwitchTaskPause);
  } else {
    delete avatarAudioProfile[SOUND_GROUP_NAME.WORK];
  }
  soundAvatarGenerator.setAudioProfile(avatarAudioProfile);

  if (avatarPlaying) {
    soundAvatarGenerator.playAvatar();
  }
}

const updateHumanSounds = () => {
  const humanSounds = [];
  const sniffle = document.querySelector('#sniffle').checked;
  const movementOnChair = document.querySelector('#movement-on-chair').checked;
  const cough = document.querySelector('#cough').checked;
  const sneeze = document.querySelector('#sneeze').checked;
  const throatClear = document.querySelector('#throat-clear').checked;

  const nonDisturbingPause = 3000;
  const nonDisturbingRandAdditionalPause = 0;
  const disturbingPause = 5000;
  const disturbingRandAdditionalPause = 10000;

  const gainCoefficient = 0.6;
  const avatarPlaying = soundAvatarGenerator.isAvatarPlaying;

  if (avatarPlaying) {
    soundAvatarGenerator.pauseAvatar();
  }
  
  // create human sounds
  if (sniffle) {
    humanSounds.push(new AudioGroupWrapper(
      'sniffle', // name
      new AudioSettings(
        SOUND_SRCS.sniffle.default,
        1 * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
      ), // settings
      2, // relative frequency
      nonDisturbingPause, // duration
      nonDisturbingRandAdditionalPause, // random additional duration
    ));
    humanSounds.push(new AudioGroupWrapper(
      'sniffle2', // name
      new AudioSettings(
        SOUND_SRCS.sniffle.alt2,
        0.3 * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
      ), // settings
      2, // relative frequency
      nonDisturbingPause, // duration
      nonDisturbingRandAdditionalPause, // random additional duration
    ));
  }
  if (movementOnChair) {
    humanSounds.push(new AudioGroupWrapper(
      'movement-on-chair', // name
      new AudioSettings(
        SOUND_SRCS.chair.movingCreak,
        1,
        AUDIO_SETTING.DEFAULT,
      ), // settings
      1, // relative frequency
      4000, // duration
      10000, // random additional duration
    ));
  }
  if (cough) {
    let source, source2;
    let gain, gain2;
    if ($('input[name="pitch"]:checked').val() === 'lower') {
      source = SOUND_SRCS.cough.male;
      source2 = SOUND_SRCS.cough.male2;
      gain = 0.5;
      gain2 = 0.5;
    } else if ($('input[name="pitch"]:checked').val() === 'higher') {
      source = SOUND_SRCS.cough.female;
      source2 = SOUND_SRCS.cough.female2;
      gain = 0.2;
      gain2 = 0.3;
    }
    humanSounds.push(new AudioGroupWrapper(
      'cough', // name
      new AudioSettings(
        source,
        gain * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
        disturbingPause,
        disturbingRandAdditionalPause
      ), // settings
      1, // relative frequency
      disturbingPause, // duration
      disturbingRandAdditionalPause, // random additional duration
    ));
    humanSounds.push(new AudioGroupWrapper(
      'cough2', // name
      new AudioSettings(
        source2,
        gain2 * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
        disturbingPause,
        disturbingRandAdditionalPause
      ), // settings
      1, // relative frequency
      disturbingPause, // duration
      disturbingRandAdditionalPause, // random additional duration
    ));
  }
  if (sneeze) {
    let source, source2;
    let gain, gain2;
    if ($('input[name="pitch"]:checked').val() === 'lower') {
      source = SOUND_SRCS.sneeze.male;
      source2 = SOUND_SRCS.sneeze.male2;
      gain = 0.2;
      gain2 = 0.3;
    } else if ($('input[name="pitch"]:checked').val() === 'higher') {
      source = SOUND_SRCS.sneeze.female;
      source2 = SOUND_SRCS.sneeze.female2;
      gain = 0.6;
      gain2 = 0.5;
    }
    humanSounds.push(new AudioGroupWrapper(
      'sneeze', // name
      new AudioSettings(
        source,
        gain * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
        disturbingPause,
        disturbingRandAdditionalPause
      ), // settings
      1, // relative frequency
      disturbingPause, // duration
      disturbingRandAdditionalPause, // random additional duration
    ));
    humanSounds.push(new AudioGroupWrapper(
      'sneeze2', // name
      new AudioSettings(
        source2,
        gain2 * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
        disturbingPause,
        disturbingRandAdditionalPause
      ), // settings
      1, // relative frequency
      disturbingPause, // duration
      disturbingRandAdditionalPause, // random additional duration
    ));
  }
  if (throatClear) {
    let source, source2;
    let gain, gain2;
    if ($('input[name="pitch"]:checked').val() === 'lower') {
      source = SOUND_SRCS.throatClear.male;
      source2 = SOUND_SRCS.throatClear.male2;
      gain = 0.2;
      gain2 = 0.2;
    } else if ($('input[name="pitch"]:checked').val() === 'higher') {
      source = SOUND_SRCS.throatClear.female;
      source2 = SOUND_SRCS.throatClear.female2;
      gain = 0.1;
      gain2 = 0.1;
    }
    humanSounds.push(new AudioGroupWrapper(
      'throatClear', // name
      new AudioSettings(
        source,
        gain * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
        disturbingPause,
        disturbingRandAdditionalPause
      ), // settings
      1, // relative frequency
      disturbingPause, // duration
      disturbingRandAdditionalPause, // random additional duration
    ));
    humanSounds.push(new AudioGroupWrapper(
      'throatClear2', // name
      new AudioSettings(
        source2,
        gain2 * gainCoefficient,
        AUDIO_SETTING.DEFAULT,
        disturbingPause,
        disturbingRandAdditionalPause
      ), // settings
      1, // relative frequency
      disturbingPause, // duration
      disturbingRandAdditionalPause, // random additional duration
    ));
  }

  if (humanSounds.length) {
    avatarAudioProfile[SOUND_GROUP_NAME.HUMAN] = new AudioGroup(humanSounds, 0, 5000);
  } else {
    delete avatarAudioProfile[SOUND_GROUP_NAME.HUMAN];
  }
  soundAvatarGenerator.setAudioProfile(avatarAudioProfile);

  if (avatarPlaying) {
    soundAvatarGenerator.playAvatar();
  }
}

function playPauseAvatarSound() {
  if (this.classList.contains('fa-play-circle')) {
    // play
    this.classList.replace('fa-play-circle', 'fa-pause-circle');
    this.classList.add('text-success');
    soundAvatarGenerator.playAvatar();
  } else {
    // pause
    this.classList.replace('fa-pause-circle', 'fa-play-circle');
    this.classList.remove('text-success');
    soundAvatarGenerator.pauseAvatar();
  }
}

const otherSoundsReady = () => {
  setUpSingleSoundPlayer();
  setUpSoundAvatarGenerator();
  const nextPgBtn = document.querySelector('#pg-1-next-btn');
  nextPgBtn.disabled = false;
  nextPgBtn.querySelector('.spinner-border').style.display = 'none';
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

window.onload = () => {
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

  // initilize sound, if not initialized, so that async sounds could play on the next page
  if (document.querySelector('.sound-switch').dataset.status === 'muted') {
    playBackgroundSound(initialSelectedBackgroundSound);
    pauseBackgroundSound();
  }
};

document.querySelector('#pg-2-back-btn').onclick = () => {
  changePage(pages.landing);
};

document.querySelector('#listen-to-avatar-btn').addEventListener('click', playPauseAvatarSound);

document.querySelectorAll('.work-sound-toggle').forEach(toggle => {
  toggle.addEventListener('change', () => {
    updateWorkSounds();
  })
})

document.querySelectorAll('.human-sound-toggle').forEach(toggle => {
  toggle.addEventListener('change', () => {
    updateHumanSounds();
  })
})

function setUpLandingPage() {
  //unMuteBackgroundSound();
}

function setUpSetupPage() {

}

function setUpRoomPage() {

}

function exitLandingPage() {
  //muteBackgroundSound();
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
