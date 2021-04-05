var audioContext = new (window.AudioContext || window.webkitAudioContext);
let canvasControl;
let audioScene;
let audioContextAndScene;
let listenerStatus;
let listenerInRoom = false;
var listener;
var listenerAudioSettings = {};
var personMap = {};
var chairList = [];
var doorElement;
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
        icon: new PersonIcon('#666', '#999', getRandomUpperLetter() + getRandomUpperLetter()),
        personSettings: {
          workSound: {
            type: PERSON_SETTING.WORK_SOUND.TYPE.slow,
            click: PERSON_SETTING.WORK_SOUND.CLICK.default,
          },
          otherSound: { // otherSound,
            zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
            footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast,
            sniffle: PERSON_SETTING.GENERAL_SOUND.SNIFFLE.default,
            sneeze: PERSON_SETTING.GENERAL_SOUND.SNEEZE.male,
          },
          habbits: { // habbits
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.quick,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.hard,
            moveOnChair: false,
          }
        },
        isListener: false
      },
      ['p2']: {
        locationIndex: 1,
        id: 'p2',
        icon: new PersonIcon('#666', '#999', getRandomUpperLetter() + getRandomUpperLetter()),
        personSettings: {
          workSound: {
            type: PERSON_SETTING.WORK_SOUND.TYPE.fast,
          },
          otherSound: { // otherSound,
            zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
            footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.slow,
            throatClear: PERSON_SETTING.GENERAL_SOUND.THROAT_CLEAR.female
          },
          habbits: { // habbits
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.quick,
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
    personSettingsForClusterMap: {
      ['p3']: {
        locationIndex: 1,
        id: 'p3',
        icon: new PersonIcon('#666', '#999', getRandomUpperLetter() + getRandomUpperLetter()),
        personSettings: {
          workSound: {
            pageFlip: PERSON_SETTING.WORK_SOUND.PAGE_FLIP.default,
          },
          otherSound: { // otherSound,
            zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
            footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.slow,
            cough: PERSON_SETTING.GENERAL_SOUND.COUGH.female,
          },
          habbits: { // habbits
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.slow,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
            moveOnChair: false,
          }
        },
        isListener: false
      }
    }
  },
  c3: {
    position: {x: 1150, y: 750},
    tableType: 'round',
    chairNum: 3,
    rotation: 0,
    personSettingsForClusterMap: {
      ['p4']: {
        locationIndex: 1,
        id: 'p4',
        icon: new PersonIcon('#666', '#999', getRandomUpperLetter() + getRandomUpperLetter()),
        personSettings: {
          workSound: {
            type: PERSON_SETTING.WORK_SOUND.TYPE.slow,
            click: PERSON_SETTING.WORK_SOUND.CLICK.default,
          },
          otherSound: { // otherSound,
            zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
            footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.slow,
          },
          habbits: { // habbits
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.slow,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
            moveOnChair: false,
          }
        },
        isListener: false
      },
      ['p5']: {
        locationIndex: 2,
        id: 'p5',
        icon: new PersonIcon('#666', '#999', getRandomUpperLetter() + getRandomUpperLetter()),
        personSettings: {
          workSound: {
            type: PERSON_SETTING.WORK_SOUND.TYPE.fast,
          },
          otherSound: { // otherSound,
            zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
            footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast,
            throatClear: PERSON_SETTING.GENERAL_SOUND.THROAT_CLEAR.male
          },
          habbits: { // habbits
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.quick,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.hard,
            moveOnChair: false,
          }
        },
        isListener: false
      }
    }
  },
  c4: {
    position: {x: 1350, y: 250},
    tableType: 'square',
    chairNum: 2,
    rotation: 90,
    personSettingsForClusterMap: {
      ['p6']: {
        locationIndex: 1,
        id: 'p6',
        icon: new PersonIcon('#666', '#999', getRandomUpperLetter() + getRandomUpperLetter()),
        personSettings: {
          workSound: {
            type: PERSON_SETTING.WORK_SOUND.TYPE.slow,
          },
          otherSound: { // otherSound,
            zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
            footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.slow,
            sneeze: PERSON_SETTING.GENERAL_SOUND.SNEEZE.female,
          },
          habbits: { // habbits
            chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.slow,
            doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
            moveOnChair: true,
          }
        },
        isListener: false
      }
    }
  }
};
var generatedIdCount = 0;

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

  listener = null;
  personMap = {}; // clear map of all persons and recreate
  chairList = [];

  // otherwise generate the listener in the get cluster function
  doorElement = audioContextAndScene.getNewDoor(ELEMENT_STATE.AVAILABLE, {...DOOR_LOCATION, z: 1}, 0);
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
      canvasControl.enterDoor(listener, doorElement);
    }
  }, 300);
}

function checkSequence() {
  if (sequenceTime > generatedSequence[curSequenceIdx].time) {
    runEvent(generatedSequence[curSequenceIdx]);
    curSequenceIdx++
    if (curSequenceIdx >= generatedSequence.length) { // repeat sequence
      curSequenceIdx = 0;
      sequenceTime = 0;
    }
  }
}

const personEnterRoom = (id, icon, audioSettings) => {
  const newPerson = audioContextAndScene.makeNewPersonWithSettings(
    id,
    ELEMENT_STATE.IDLE,
    icon,
    {x: DOOR_LOCATION.x + PERSON_SIZE, y: DOOR_LOCATION.y, z: 1},
    90, // orientation; up is 0
    audioSettings,
    false // is listener
  );
  canvasControl.addElement(newPerson);
  canvasControl.enterDoor(newPerson, doorElement);
  
  return newPerson;
}

const runEvent = (event) => {
  if (event.type === SEQUENCE_EVENT.entryRandOccupy) {
    let id = event.person.id;
    let icon = event.person.icon;
    if (!id) {
      generatedIdCount++;
      id = 'g' + generatedIdCount;
    }
    if (!icon) {
      icon = new PersonIcon('#666', '#999', getRandomUpperLetter() + getRandomUpperLetter());
    }
    const newPerson = personEnterRoom(id, icon, event.person.audioSettings);
    setTimeout(() => {
      const availableChairs = chairList.filter(chair => chair.state === ELEMENT_STATE.AVAILABLE);
      if (availableChairs.length) {
        randomOccupyChair(newPerson);
      } else { // exit if there is no more seats
        canvasControl.moveToAndUseElement(newPerson, doorElement);
      }
    }, 2000 + Math.random() * 5000);
  } else if (event.type === SEQUENCE_EVENT.randSwitch) {
    const workingPersons = Object.values(personMap).filter(person => {
      return person.state === ELEMENT_STATE.WORKING && !person.isListener;
    });
    randomOccupyChair(workingPersons[Math.floor(Math.random() * workingPersons.length)]);
  } else if (event.type === SEQUENCE_EVENT.randExit) {
    const workingPersons = Object.values(personMap).filter(person => {
      return person.state === ELEMENT_STATE.WORKING && !person.isListener;
    });
    canvasControl.moveToAndUseElement(workingPersons[Math.floor(Math.random() * workingPersons.length)], doorElement);
  }

  function randomOccupyChair(person) {
    const availableChairs = chairList.filter(chair => chair.state === ELEMENT_STATE.AVAILABLE);
    if (availableChairs.length) {
      canvasControl.moveToAndUseElement(person, availableChairs[Math.floor(Math.random() * availableChairs.length)]);
    } else {
      console.log('No seats available.')
    }
  }
}

const getListenerAudioSettings = () => {

}

const onLoad = function() {
  // runs when the page loads
};

window.addEventListener('load', onLoad);
document.querySelector('#enter-room-btn').onclick = enterRoom;

