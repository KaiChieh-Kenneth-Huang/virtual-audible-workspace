let audioContext;
let canvasControl;
let scene;
let audioElements = [];
let audioElementSources = [];
let soundSources = [];
let sourceIds = ['sourceAButton', 'sourceBButton', 'sourceCButton'];
let sourceIconIdsAndFile = {
  sourceAIcon: 'resources/cube-sound.wav',
  sourceBIcon: 'resources/speech-sample.wav',
  sourceCIcon: 'resources/music.wav',
};
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
    width: 20, height: 10, depth: 20,
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
  scene.setRoomProperties(dimensions[dimensionSelection],
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

  for (let i = 0; i < elements.length; i++) {
    // for sounds, coordinates (0, 0, 0) is the center of the room
    // for canvas, coordinates (0, 0, 0) is the top left
    let x = (elements[i].x - 0.5) * dimensions[dimensionSelection].width / 2;
    let y = 0.6;
    let z = (elements[i].y - 0.5) * dimensions[dimensionSelection].depth / 2;
    if (i !== 0) {
      soundSources[i-1].setPosition(x, y, z);
    } else {
      scene.setListenerPosition(x, 1.2, z);
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
  scene = new ResonanceAudio(audioContext, {
    ambisonicOrder: 1,
  });
  // for (let i = 0; i < audioSources.length; i++) {
  //   soundSources[i] = scene.createSource();
  //   audioElementSources[i].connect(soundSources[i].input);
  // }
  scene.output.connect(audioContext.destination);

  audioReady = true;
}

let onLoad = function() {
  // Initialize play button functionality.
  // for (let i = 0; i < sourceIds.length; i++) {
  //   let button = document.getElementById(sourceIds[i]);
  //   button.addEventListener('click', function(event) {
  //     switch (event.target.textContent) {
  //       case 'Play': {
  //         if (!audioReady) {
  //           initAudio();
  //         }
  //         event.target.textContent = 'Pause';
  //         for(const audioElement of audioElements) {
  //           audioElement.play();
  //         }
  //         //audioElements[i].play();
  //       }
  //       break;
  //       case 'Pause': {
  //         event.target.textContent = 'Play';
  //         for(const audioElement of audioElements) {
  //           audioElement.pause();
  //         }
  //         //audioElements[i].pause();
  //       }
  //       break;
  //     }
  //   });
  // }

  document.getElementById('roomDimensionsSelect').addEventListener(
    'change', function(event) {
      selectRoomProperties();
  });

  document.getElementById('roomMaterialsSelect').addEventListener(
    'change', function(event) {
      selectRoomProperties();
  });

  let canvas = document.getElementById('canvas');
  let elements = [
    {
      icon: 'listenerIcon',
      x: 0.5,
      y: 0.5,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
    },
    // {
    //   icon: 'sourceAIcon',
    //   x: 0.25,
    //   y: 0.25,
    //   radius: 0.04,
    //   alpha: 0.75,
    //   clickable: true,
    // },
    // {
    //   icon: 'sourceBIcon',
    //   x: 0.75,
    //   y: 0.25,
    //   radius: 0.04,
    //   alpha: 0.75,
    //   clickable: true,
    // },
    // {
    //   icon: 'sourceCIcon',
    //   x: 0.25,
    //   y: 0.75,
    //   radius: 0.04,
    //   alpha: 0.75,
    //   clickable: true,
    // },
  ];

  canvasControl = new CanvasControl(canvas, elements, updatePositions);

  selectRoomProperties();
};

let addElement = function(id) {
  if (!audioReady) {
    initAudio();
  }
  selectRoomProperties();

  audioElements.push(document.createElement('audio'));
  const newAudioElement = audioElements[audioElements.length - 1];
  newAudioElement.src = sourceIconIdsAndFile[id]; // todo
  newAudioElement.crossOrigin = 'anonymous';
  newAudioElement.load();
  newAudioElement.loop = true;
  newAudioElement.play();
  audioElementSources.push(audioContext.createMediaElementSource(newAudioElement));

  soundSources.push(scene.createSource());
  audioElementSources[audioElementSources.length - 1].connect(soundSources[soundSources.length - 1].input);
  
  //scene.output.connect(audioContext.destination);
  
  canvasControl.addElement({
      icon: id,
      x: 0.1,
      y: 0.1,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
  });
};

window.addEventListener('load', onLoad);

for (const id in sourceIconIdsAndFile) {
  document.querySelector('#' + id).addEventListener('click', () => {addElement(id);});
}

