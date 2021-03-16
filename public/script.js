// preload audio
var preloadedAudioBuffer = {};
document.querySelector('#start').onclick = preloadAudioElements;
function preloadAudioElements() {
    for (const src of flattenObjectToStringArray(SOUND_SRCS)) {
        preloadAudioElement(src);
    }
    console.log('preloaded');
}

function preloadAudioElement(src) {
    const myRequest = new Request(src);
  
    fetch(myRequest).then((response) => {
      return response.arrayBuffer();
    }).then((buffer) => {
      audioContext.decodeAudioData(buffer, (decodedData) => {
        // store the buffer for future use
        preloadedAudioBuffer[src] = decodedData;
      });
    });
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

function flattenObjectToStringArray(obj) {
    const arr = [];
    const processObj = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          arr.push(obj[key]);
        } else if (typeof obj[key] === 'object') {
          processObj(obj[key]);
        }
      }
    }
    processObj(obj);
    return arr;
}
