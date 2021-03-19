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
  // let listener = audioContextAndScene.makeNewPersonWithSettings(
  //   ELEMENT_STATE.IDLE,
  //   new PersonIcon('#666', '#3a3', 'ME'),
  //   {x: DOOR_LOCATION.x + PERSON_SIZE, y: DOOR_LOCATION.y, z: 1},
  //   90, // orientation; up is 0
  //   { // person settings
  //     workSound: {
  //       type: PERSON_SETTING.WORK_SOUND.TYPE.slow,
  //       pageFlip: PERSON_SETTING.WORK_SOUND.PAGE_FLIP.default,
  //       click: PERSON_SETTING.WORK_SOUND.CLICK.default,
  //     },
  //     otherSound: { // otherSound,
  //       zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
  //       footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast,
  //       sniffle: PERSON_SETTING.GENERAL_SOUND.SNIFFLE.default,
  //       throatClear: PERSON_SETTING.GENERAL_SOUND.THROAT_CLEAR.female,
  //       cough: PERSON_SETTING.GENERAL_SOUND.COUGH.female,
  //       sneeze: PERSON_SETTING.GENERAL_SOUND.SNEEZE.female,
  //     },
  //     habbit: { // habbit
  //       chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.fast,
  //       doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
  //       moveOnChair: true,
  //     }
  //   },
  //   true // is listener
  // );

  let listener = audioContextAndScene.makeNewPersonWithSettings(
    ELEMENT_STATE.IDLE,
    new PersonIcon('#666', '#3a3', 'ME'),
    {x: DOOR_LOCATION.x + PERSON_SIZE, y: DOOR_LOCATION.y, z: 1},
    90, // orientation; up is 0
    {
      workSound: {
        // type: PERSON_SETTING.WORK_SOUND.TYPE.slow,
        // pageFlip: PERSON_SETTING.WORK_SOUND.PAGE_FLIP.default,
        // click: PERSON_SETTING.WORK_SOUND.CLICK.default,
      },
      otherSound: { // otherSound,
        zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
        footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast,
        sniffle: PERSON_SETTING.GENERAL_SOUND.SNIFFLE.default,
        throatClear: PERSON_SETTING.GENERAL_SOUND.THROAT_CLEAR.female,
        cough: PERSON_SETTING.GENERAL_SOUND.COUGH.female,
        sneeze: PERSON_SETTING.GENERAL_SOUND.SNEEZE.female,
      },
      habbit: { // habbit
        chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.fast,
        doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
        moveOnChair: true,
      }
    },
    true // is listener
  );

  canvasControl = new CanvasControl(canvas, listener, updatePositions);
  const doorElement = audioContextAndScene.getNewDoor(ELEMENT_STATE.AVAILABLE, {...DOOR_LOCATION, z: 1}, 0);
  // setup initial scene
  const newElements = [
    ...audioContextAndScene.getCluster({x: 350, y: 750}, 'round', 3, 0, [
      {
        locationIndex: 0,
        icon: new PersonIcon('#666', '#999', 'JD'),
        personSettings: {
          workSound: {
            type: PERSON_SETTING.WORK_SOUND.TYPE.fast,
            pageFlip: PERSON_SETTING.WORK_SOUND.PAGE_FLIP.default,
            click: PERSON_SETTING.WORK_SOUND.CLICK.default,
          },
          otherSound: { // otherSound,
            zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
            footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast,
            sniffle: PERSON_SETTING.GENERAL_SOUND.SNIFFLE.default,
            throatClear: PERSON_SETTING.GENERAL_SOUND.THROAT_CLEAR.male,
            cough: PERSON_SETTING.GENERAL_SOUND.COUGH.male,
            sneeze: PERSON_SETTING.GENERAL_SOUND.SNEEZE.male,
          },
          habbit: { // habbit
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.slow,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
            moveOnChair: true,
          }
        },
        isListener: false
      },
      {
        locationIndex: 1,
        icon: new PersonIcon('#666', '#999', 'JE'),
        personSettings: {
          workSound: {
            type: PERSON_SETTING.WORK_SOUND.TYPE.slow,
            pageFlip: PERSON_SETTING.WORK_SOUND.PAGE_FLIP.default,
            click: PERSON_SETTING.WORK_SOUND.CLICK.default,
          },
          otherSound: { // otherSound,
            zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
            footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast,
            sniffle: PERSON_SETTING.GENERAL_SOUND.SNIFFLE.default,
            throatClear: PERSON_SETTING.GENERAL_SOUND.THROAT_CLEAR.female,
            cough: PERSON_SETTING.GENERAL_SOUND.COUGH.female,
            sneeze: PERSON_SETTING.GENERAL_SOUND.SNEEZE.female,
          },
          habbit: { // habbit
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.fast,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
            moveOnChair: true,
          }
        },
        isListener: false
      },
    ]),
    ...audioContextAndScene.getCluster({x: 750, y: 250}, 'round', 3, 180),
    ...audioContextAndScene.getCluster({x: 1150, y: 750}, 'round', 3, 0),
    ...audioContextAndScene.getCluster({x: 1350, y: 250}, 'square', 2, 90),

    doorElement,
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

