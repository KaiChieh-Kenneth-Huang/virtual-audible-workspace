let audioContext;
let canvasControl;
let audioScene;
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
// todo: programically add icons new element not put into DOM
let dimensions = {
  small: {
    width: 1.5, height: 2.4, depth: 1.3,
  },
  medium: {
    width: 4, height: 3.2, depth: 3.9,
  },
  large: {
    width: 8, height: 3.4, depth: 9,
  },
  huge: {
    width: 20, height: 3, depth: 10,
  },
};
let materials = {
  brick: {
    left: 'brick-bare', right: 'brick-bare',
    up: 'brick-bare', down: 'wood-panel',
    front: 'brick-bare', back: 'brick-bare',
  },
  curtains: {
    left: 'curtain-heavy', right: 'curtain-heavy',
    up: 'wood-panel', down: 'wood-panel',
    front: 'curtain-heavy', back: 'curtain-heavy',
  },
  marble: {
    left: 'marble', right: 'marble',
    up: 'marble', down: 'marble',
    front: 'marble', back: 'marble',
  },
  outside: {
    left: 'transparent', right: 'transparent',
    up: 'transparent', down: 'grass',
    front: 'transparent', back: 'transparent',
  },
};
let dimensionSelection = 'small';
let materialSelection = 'brick';
let audioReady = false;

/**
 * @private
 */
function selectRoomProperties() {
  if (!audioReady)
    return;

  dimensionSelection =
    document.getElementById('roomDimensionsSelect').value;
  materialSelection =
    document.getElementById('roomMaterialsSelect').value;
  audioScene.setRoomProperties(dimensions[dimensionSelection],
    materials[materialSelection]);
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
    if (element.constructor.name === 'SoundSource') {
      let x = (element.position.x - MAX_CANVAS_WIDTH / 2) / MAX_CANVAS_WIDTH * dimensions[dimensionSelection].width;
      let y = (element.position.z - dimensions[dimensionSelection].height / 2);
      let z = (element.position.y - MAX_CANVAS_HEIGHT / 2) / MAX_CANVAS_HEIGHT * dimensions[dimensionSelection].depth;
    
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
  let audioSources = [
    'resources/cube-sound.wav',
    'resources/speech-sample.wav',
    'resources/music.wav',
  ];
  // for (let i = 0; i < audioSources.length; i++) {
  //   audioElements[i] = document.createElement('audio');
  //   audioElements[i].src = audioSources[i];
  //   audioElements[i].crossOrigin = 'anonymous';
  //   audioElements[i].load();
  //   audioElements[i].loop = true;
  //   audioElementSources[i] =
  //     audioContext.createMediaElementSource(audioElements[i]);
  // }

  // Initialize scene and create Source(s).
  audioScene = new ResonanceAudio(audioContext, {
    ambisonicOrder: 1,
  });
  // for (let i = 0; i < audioSources.length; i++) {
  //   soundSources[i] = scene.createSource();
  //   audioElementSources[i].connect(soundSources[i].input);
  // }
  audioScene.output.connect(audioContext.destination);
  audioReady = true;
}

let onLoad = function() {
  document.getElementById('roomDimensionsSelect').addEventListener(
    'change', function(event) {
      selectRoomProperties();
  });

  document.getElementById('roomMaterialsSelect').addEventListener(
    'change', function(event) {
      selectRoomProperties();
  });
};

const enterRoom = () => {
  if (!audioReady) {
    initAudio();
  }
  
  let canvas = document.getElementById('canvas');
  let listener = new SoundSource(
    new PersonIcon('#666', '#3a3', 'ME'), // image
    true, // is person
    {x: 400, y: 250, z: 1}, // position
    0, // clock-wise rotation
    40, // width (relative to max canvas width)
    40, // height (relative to max canvas height)
    0.9, // alpha
    false, // clickable
    10, // layer (make sure listener is on top)
    audioContext,
    audioScene,
    {
      'foot-step': new AudioSettings(
        'resources/sounds/environment related human sounds/single_footstep_boots.wav',
        AUDIO_SETTING.DEFALUT,
        200,
        0
      ),
    },
    true // isListener
  );

  canvasControl = new CanvasControl(canvas, listener, updatePositions);
  selectRoomProperties();

  const newElements = [
    new Chair({x: 450, y: 100, z: 0.5}, 45, audioContext, audioScene),
    new Chair({x: 550, y: 100, z: 0.5}, -45, audioContext, audioScene),
    new Chair({x: 500, y: 30, z: 0.5}, 180, audioContext, audioScene),
    new SoundSource(
      new PersonIcon('#666', '#a88', 'JD'), // image
      true, // is person
      {x: 200, y: 150, z: 1}, // position
      0, // clock-wise rotation
      40, // width (relative to max canvas width)
      40, // height (relative to max canvas height)
      0.75, // alpha
      true, // clickable
      1,
      audioContext,
      audioScene,
      {
        'working-sounds': new AudioGroup(
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
        'foot-step': new AudioSettings(
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

class Chair extends SoundSource {
  constructor(position, rotation, audioContext, audioScene) {
    super(
      icons['chair'],
      false, // is person
      position,
      rotation,
      60,
      60,
      1,
      true,
      1,
      audioContext,
      audioScene,
      {
        'chair-slide': new AudioSettings(
          'resources/sounds/environment related human sounds/chair_slide.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        'moving-creak': new AudioSettings(
          'resources/sounds/environment related human sounds/moving_creak.wav',
          AUDIO_SETTING.DEFAULT,
        ),
        'sitting-creak': new AudioSettings(
          'resources/sounds/environment related human sounds/sitting_creak.wav',
          AUDIO_SETTING.DEFAULT,
        ),
      },
    );
  }
}

window.addEventListener('load', onLoad);
document.querySelector('#enter-room-btn').onclick = enterRoom;

