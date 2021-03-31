var audioContext = new (window.AudioContext || window.webkitAudioContext);
let canvasControl;
let audioScene;
let audioContextAndScene;
let listenerStatus;
let listenerInRoom = false;
var listener;
var listenerAudioSettings = {};
var personMap = {};
var clusters = {
  c1: {
    position: {x: 350, y: 750},
    tableType: 'round',
    chairNum: 3,
    rotation: 0,
    personSettingsForClusterMap: {
      ['p1']: {
        locationIndex: 0,
        id: 'p1',
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
          habbits: { // habbits
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.slow,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
            moveOnChair: true,
          }
        },
        isListener: false
      },
      ['p2']: {
        locationIndex: 1,
        id: 'p2',
        icon: new PersonIcon('#666', '#999', '2'),
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
          habbits: { // habbits
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.fast,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
            moveOnChair: true,
          }
        },
        isListener: false
      }
    }
  },
  c2: {
    position: {x: 750, y: 250},
    tableType: 'round',
    chairNum: 3,
    rotation: 180,
    personSettingsForClusterMap: {}
  },
  c3: {
    position: {x: 1150, y: 750},
    tableType: 'round',
    chairNum: 3,
    rotation: 0,
    personSettingsForClusterMap: {}
  },
  c4: {
    position: {x: 1350, y: 250},
    tableType: 'square',
    chairNum: 2,
    rotation: 90,
    personSettingsForClusterMap: {}
  }
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

function newAudio() {
  audioScene.output.disconnect();
  audioScene = new ResonanceAudio(audioContext, {
    ambisonicOrder: 1,
  });

  audioScene.output.connect(audioContext.destination);
  audioReady = true;
}

const enterRoom = () => {
  if (
    !document.querySelector('#type').checked
    && !document.querySelector('#clicking').checked
    && !document.querySelector('#reading').checked
  ) {
    showAlert('You must switch on at least one work sound.');
    return;
  }
  changePage(pages.room);

  if (!audioReady) {
    initAudio();
  }

  audioContextAndScene = new AudioContextAndScene(
    audioContext,
    audioScene
  );
  
  let canvas = document.createElement('canvas');
  document.querySelector('#canvas-container').appendChild(canvas);
  updateWorkSounds();
  updateOtherSounds();

  // todo: assign object in use (use the seat generation function below for it...) (difficult because item in use was destroyed...)
  const useSavedStatus = (!!listenerStatus && listenerInRoom)
  // if listener not in seat create new listener here
  listener = null;

  // otherwise generate the listener in the get cluster function
  const doorElement = audioContextAndScene.getNewDoor(ELEMENT_STATE.AVAILABLE, {...DOOR_LOCATION, z: 1}, 0);
  // setup initial scene
  const newElements = [
    doorElement,
  ];

  for (const id in clusters) {
    const c = clusters[id];
    const elementList = audioContextAndScene.getCluster(id, c.position, c.tableType, c.chairNum, c.rotation, c.personSettingsForClusterMap) 
    elementList.forEach((element) => {
      newElements.push(element);
    });
  }
  personMap = {}; // clear map of all persons and recreate
  // if listener is in seat, it will be assigned in the getCluster function above
  if (!listener) {
    listener = audioContextAndScene.makeNewPersonWithSettings(
      'listener',
      useSavedStatus ? listenerStatus.state : ELEMENT_STATE.IDLE,
      new PersonIcon('#666', '#3a3', document.querySelector('#initials').value),
      useSavedStatus ? listenerStatus.position : {x: DOOR_LOCATION.x + PERSON_SIZE, y: DOOR_LOCATION.y, z: 1},
      useSavedStatus ? listenerStatus.orientation : 90, // orientation; up is 0
      listenerAudioSettings,
      true // is listener
    );
  } 

  canvasControl = new CanvasControl(canvas, listener, updatePositions);
  canvasControl.addElements(newElements);

  setTimeout(() => { // selectRoomProperties can't be run right away otherwise it won't be applied
    selectRoomProperties();
    if (!listenerInRoom) {
      canvasControl.useElement(doorElement);
    }
  }, 300);
}

const getListenerAudioSettings = () => {

}

const onLoad = function() {
  // runs when the page loads
};

window.addEventListener('load', onLoad);
document.querySelector('#enter-room-btn').onclick = enterRoom;

