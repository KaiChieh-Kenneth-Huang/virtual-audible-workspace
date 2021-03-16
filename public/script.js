// preload audio
var preloadedAudioBuffer = {};
preloadAudioElements();
function preloadAudioElements() {
  const sources = flattenObjectToUniqueStringArray(SOUND_SRCS);
  const startTime = Date.now();
  console.log('Begin preloading audio...');
  for (const src of sources) {
    preloadAudioElement(src);
  }
  const checkLoadComplete = setInterval(() => {
    if (sources.length === Object.keys(preloadedAudioBuffer).length) {
      const timeElapsed = (Date.now() - startTime) / 1000;
      document.querySelector('#enter-room-btn').disabled = false;
      console.log('Audio preloaded in ' + timeElapsed + 's.');
      clearInterval(checkLoadComplete);
    }
  }, 500);
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
    return Object.keys(set);
}
