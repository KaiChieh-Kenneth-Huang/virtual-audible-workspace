let audioContext;
let canvasControl;
let audioScene;
let audioContextAndScene;
let audioElements = [];
let audioElementSources = [];
let soundSources = [];
let sourceIds = ['sourceAButton', 'sourceBButton', 'sourceCButton', 'sourceDIcon'];
let sourceIconIdsAndFile = {
  sourceAIcon: 'resources/sounds/cube-sound.wav',
  sourceBIcon: 'resources/sounds/speech-sample.wav',
  sourceCIcon: 'resources/sounds/music.wav',
  sourceDIcon: 'resources/sounds/speech-sample.wav',
};

let audioReady = false;

/**
 * @private
 */
function selectRoomProperties() {
  if (!audioReady)
    return;
  audioScene.setRoomProperties(ROOM_DIMENSIONS, ROOM_MATERIALS);
  canvasControl.invokeCallback();
}

/**
 * @param {Object} elements
 * @private
 */
function updatePositions(elements) {
  if (!audioReady)
    return;
  // check element.constructor.name to see if set position needed
  for (const element of elements) {
    // for sounds, coordinates (0, 0, 0) is the center of the room
    // for canvas, coordinates (0, 0, 0) is the top left
    if (element.isSoundSource) {
      let x = (element.position.x - MAX_CANVAS_WIDTH / 2) / MAX_CANVAS_WIDTH * ROOM_DIMENSIONS.width;
      let y = (element.position.z - ROOM_DIMENSIONS.height / 2);
      let z = (element.position.y - MAX_CANVAS_HEIGHT / 2) / MAX_CANVAS_HEIGHT * ROOM_DIMENSIONS.depth;
      if (element.isListener) {
        element.audioScene.setListenerPosition(x, y, z);
      }
      element.resonanceAudioSrc.setPosition(x, y, z);
    }
  }
}

/**
 * @private
 */
function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext);

  // Initialize scene and create Source(s).
  audioScene = new ResonanceAudio(audioContext, {
    ambisonicOrder: 1,
  });

  audioScene.output.connect(audioContext.destination);
  audioReady = true;
}



const enterRoom = () => {
  if (!audioReady) {
    initAudio();
  }

  audioContextAndScene = new AudioContextAndScene(
    audioContext,
    audioScene
  );
  
  let canvas = document.getElementById('canvas');
  let listener = audioContextAndScene.getNewPerson(
    ELEMENT_STATE.IDLE,
    new PersonIcon('#666', '#3a3', 'ME'), // image
    {x: 400, y: 250, z: 1}, // position
    {
      [SOUND_NAME.FOOT_STEP]: new AudioSettings(
        'resources/sounds/environment related human sounds/single_footstep_boots.wav',
        AUDIO_SETTING.INTERMITTENT,
        600,
        0
      ),
    },
    true // isListener
  );

  canvasControl = new CanvasControl(canvas, listener, updatePositions);

  const newElements = [
    audioContextAndScene.getNewChair(ELEMENT_STATE.AVAILABLE, {x: 450, y: 100, z: 0.5}, 45),
    audioContextAndScene.getNewChair(ELEMENT_STATE.AVAILABLE, {x: 550, y: 100, z: 0.5}, -45),
    audioContextAndScene.getNewChair(ELEMENT_STATE.AVAILABLE, {x: 500, y: 30, z: 0.5}, 180),
    audioContextAndScene.getNewPerson(
      ELEMENT_STATE.WORKING,
      new PersonIcon('#666', '#a88', 'JD'), // image
      {x: 200, y: 150, z: 1}, // position
      {
        [SOUND_GROUP_NAME.WORK]: new AudioGroup(
          [
            new AudioGroupWrapper(
              'fast-type-1', // name
              new AudioSettings(
                'resources/sounds/work sounds/fast_typ1.mp3',
                AUDIO_SETTING.PARTIAL_PLAY,
                500,
                1000,
                500,
                1000
              ), // settings
              10, // relative frequency
              5000, // duration
              5000, // random additional duration
            ),
            new AudioGroupWrapper(
              'page-flip', // name
              new AudioSettings(
                'resources/sounds/work sounds/single_page_flip.mp3',
                AUDIO_SETTING.DEFAULT,
              ), // settings
              1, // relative frequency
              2000, // duration
              0, // random additional duration
            ),
            new AudioGroupWrapper(
              'single-click', // name
              new AudioSettings(
                'resources/sounds/work sounds/single_click.mp3',
                AUDIO_SETTING.INTERMITTENT,
                100,
                5000
              ), // settings
              5, // relative frequency
              100, // duration
              5000, // random additional duration
            ),
          ],
          1000, // switch task pause duration
          2000 // random additional task switch pause
        ),
        'clear-throat': new AudioSettings(
          'resources/sounds/intrinsic human sounds/male_throat_clear.mp3',
          AUDIO_SETTING.INTERMITTENT,
          1000,
          60000
        ),
        'sniffle': new AudioSettings(
          'resources/sounds/intrinsic human sounds/sniffle.mp3',
          AUDIO_SETTING.INTERMITTENT,
          1000,
          30000
        ),
        [SOUND_NAME.FOOT_STEP]: new AudioSettings(
          'resources/sounds/environment related human sounds/single_footstep_boots.wav',
          AUDIO_SETTING.DEFAULT,
          200,
          0
        ),
      }, // audio profile
    ),
  ];
  canvasControl.addElements(newElements);
}

const onLoad = function() {
  // runs when the page loads
};

window.addEventListener('load', onLoad);
document.querySelector('#enter-room-btn').onclick = enterRoom;

