var audioContext = new (window.AudioContext || window.webkitAudioContext);
let canvasControl;
let audioScene;
let audioContextAndScene;

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
        const unitVector = {x: 0, y: 1};
        const {x: rx, y: ry} = rotateCoordinates(unitVector, element.orientation);
        element.audioScene.setListenerPosition(x, y, z);
        element.audioScene.setListenerOrientation(rx, ry, 0, 0, 0, 1); // x is left, y is up (upz = 1)
        element.resonanceAudioSrc.setPosition(x + rx * 0.4, y, z + ry * 0.4); // add some y offset for sound to be in both channels when walking
      } else {
        element.resonanceAudioSrc.setPosition(x, y, z);
      }
    }
  }
}

/**
 * @private
 */
function initAudio() {
  //audioContext = new (window.AudioContext || window.webkitAudioContext);
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
  document.querySelector('#room-page').style.display = 'block';
  document.querySelector('#setup-page').style.display = 'none';

  audioContextAndScene = new AudioContextAndScene(
    audioContext,
    audioScene
  );
  
  let canvas = document.getElementById('canvas');
  let listener = audioContextAndScene.getNewPerson(
    ELEMENT_STATE.IDLE,
    new PersonIcon('#666', '#3a3', 'ME'), // image
    {x: DOOR_LOCATION.x + PERSON_SIZE, y: DOOR_LOCATION.y, z: 1}, // position
    90, // orientation; up is 0
    { // sound profile
      [SOUND_NAME.FOOT_STEP]: new AudioSettings(
        SOUND_SRCS.footStep.boots,
        AUDIO_SETTING.INTERMITTENT,
        600,
        0
      ),
      [SOUND_NAME.ZIP]: new AudioSettings(
        SOUND_SRCS.preparation.zip,
        AUDIO_SETTING.DEFAULT,
      ),
      [SOUND_NAME.UNZIP]: new AudioSettings(
        SOUND_SRCS.preparation.unzip,
        AUDIO_SETTING.DEFAULT,
      ),
      [SOUND_NAME.PLACE_BOOK]: new AudioSettings(
        SOUND_SRCS.preparation.placeBook,
        AUDIO_SETTING.DEFAULT,
      ),
      [SOUND_NAME.PLACE_LAPTOP]: new AudioSettings(
        SOUND_SRCS.preparation.placeLaptop,
        AUDIO_SETTING.DEFAULT,
      ),
    },
    { // habbits
      chairSlideSound: SOUND_NAME.CHAIR_SLIDE_SLOW,
      doorOpenCloseSound: SOUND_NAME.DOOR_SLAM,
      moveOnChair: true,
    },
    true // isListener
  );

  canvasControl = new CanvasControl(canvas, listener, updatePositions);
  const doorElement = audioContextAndScene.getNewDoor(ELEMENT_STATE.AVAILABLE, {...DOOR_LOCATION, z: 1}, 0);
  // setup initial scene
  const newElements = [
    ...audioContextAndScene.getCluster({x: 350, y: 750}, 'round', 3, 0, [
      {
        locationIndex: 0,
        icon: new PersonIcon('#666', '#a88', 'JD'),
        personSettings: {
          workSound: {
            type: PERSON_SETTING.WORK_SOUND.TYPE.fast,
            pageFlip: PERSON_SETTING.WORK_SOUND.PAGE_FLIP.default,
            click: PERSON_SETTING.WORK_SOUND.CLICK.default,
          },
          // otherSound,
          // habbit
        },
        isListener: false
      },
    ]),
    ...audioContextAndScene.getCluster({x: 750, y: 250}, 'round', 3, 180),
    ...audioContextAndScene.getCluster({x: 1150, y: 750}, 'round', 3, 0),
    ...audioContextAndScene.getCluster({x: 1350, y: 250}, 'square', 2, 90),

    doorElement,
    // audioContextAndScene.getNewPerson(
    //   ELEMENT_STATE.WORKING,
    //   new PersonIcon('#666', '#a88', 'JD'), // image
    //   {x: 200, y: 150, z: 1}, // position
    //   {
    //     [SOUND_GROUP_NAME.WORK]: new AudioGroup(
    //       [
    //         new AudioGroupWrapper(
    //           'fast-type-1', // name
    //           new AudioSettings(
    //             'resources/sounds/work sounds/fast_typ1.mp3',
    //             AUDIO_SETTING.PARTIAL_PLAY,
    //             500,
    //             1000,
    //             500,
    //             1000
    //           ), // settings
    //           10, // relative frequency
    //           5000, // duration
    //           5000, // random additional duration
    //         ),
    //         new AudioGroupWrapper(
    //           'page-flip', // name
    //           new AudioSettings(
    //             'resources/sounds/work sounds/single_page_flip.mp3',
    //             AUDIO_SETTING.DEFAULT,
    //           ), // settings
    //           1, // relative frequency
    //           2000, // duration
    //           0, // random additional duration
    //         ),
    //         new AudioGroupWrapper(
    //           'single-click', // name
    //           new AudioSettings(
    //             'resources/sounds/work sounds/single_click.mp3',
    //             AUDIO_SETTING.INTERMITTENT,
    //             100,
    //             5000
    //           ), // settings
    //           5, // relative frequency
    //           100, // duration
    //           5000, // random additional duration
    //         ),
    //       ],
    //       1000, // switch task pause duration
    //       2000 // random additional task switch pause
    //     ),
    //     'clear-throat': new AudioSettings(
    //       'resources/sounds/intrinsic human sounds/male_throat_clear.mp3',
    //       AUDIO_SETTING.INTERMITTENT,
    //       1000,
    //       60000
    //     ),
    //     'sniffle': new AudioSettings(
    //       'resources/sounds/intrinsic human sounds/sniffle.mp3',
    //       AUDIO_SETTING.INTERMITTENT,
    //       1000,
    //       30000
    //     ),
    //     [SOUND_NAME.FOOT_STEP]: new AudioSettings(
    //       'resources/sounds/environment related human sounds/single_footstep_boots.wav',
    //       AUDIO_SETTING.DEFAULT,
    //       200,
    //       0
    //     ),
    //   }, // audio profile
    // ),
  ];
  canvasControl.addElements(newElements);

  setTimeout(() => { // selectRoomProperties can't be run right away otherwise it won't be applied
    selectRoomProperties();
    canvasControl.useElement(doorElement);
  }, 300);
}

const onLoad = function() {
  // runs when the page loads
};

window.addEventListener('load', onLoad);
document.querySelector('#enter-room-btn').onclick = enterRoom;

