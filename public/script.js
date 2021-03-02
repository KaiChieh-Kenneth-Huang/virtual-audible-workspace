
let audioContext;


let resonanceAudioScene;

// Define room dimensions.
// By default, room dimensions are undefined (0m x 0m x 0m).
let roomDimensions = {
  width: 10,
  height: 3,
  depth: 10,
};

// Define materials for each of the room’s six surfaces.
// Room materials have different acoustic reflectivity.
let roomMaterials = {
  // Room wall materials
  left: 'concrete-block-painted',
  right: 'concrete-block-painted',
  front: 'concrete-block-painted',
  back: 'concrete-block-painted',
  down: 'concrete-block-painted',
  up: 'acoustic-ceiling-tiles',
};

document.querySelector('#test').onclick = () => {
  const numOfTypers = 3;
  const typerAudioElements = [];
  
  audioContext = new AudioContext(); // Create an AudioContext
  // Create a (first-order Ambisonic) Resonance Audio scene and pass it
  // the AudioContext.
  resonanceAudioScene = new ResonanceAudio(audioContext);
  // Connect the scene’s binaural output to stereo out.
  resonanceAudioScene.output.connect(audioContext.destination);
  // Add the room definition to the scene.
  resonanceAudioScene.setRoomProperties(roomDimensions, roomMaterials);
  resonanceAudioScene.setListenerPosition(0, 0, 0);
  
  // for (let i = 0; i < numOfTypers; i++) {
  //   let audioElement = document.createElement('audio'); // Create an AudioElement.
  //   audioElement.src = 'resources/typing.mp3'; // Load an audio file into the AudioElement. Use the console to reveal the file on Glitch
  //   let audioElementSource = audioContext.createMediaElementSource(audioElement); // Generate a MediaElementSource from the AudioElement.
  //   let source = resonanceAudioScene.createSource(); // Add the MediaElementSource to the scene as an audio input source.
  //   audioElementSource.connect(source.input);
  //   source.setPosition(2, 2, 0); // Set the source position relative to the room center (source default position).
  //   typerAudioElements.push(audioElement);
  // }
    let audioElement = document.createElement('audio'); // Create an AudioElement.
    audioElement.src = 'resources/typing.mp3'; // Load an audio file into the AudioElement. Use the console to reveal the file on Glitch
    let audioElementSource = audioContext.createMediaElementSource(audioElement); // Generate a MediaElementSource from the AudioElement.
    let source = resonanceAudioScene.createSource(); // Add the MediaElementSource to the scene as an audio input source.
    audioElementSource.connect(source.input);
    source.setPosition(2, 2, 0); // Set the source position relative to the room center (source default position).
    //audioElementSource.disconnect(source.input);
  // Play the audio.
  audioElement.loop = 'true'
  audioElement.play();
}

// client-side js, loaded by index.html
// run by the browser each time the page is loaded

// console.log("hello world :o");

// // define variables that reference elements on our page
// const dreamsList = document.getElementById("dreams");
// const dreamsForm = document.querySelector("form");

// // a helper function that creates a list item for a given dream
// function appendNewDream(dream) {
//   const newListItem = document.createElement("li");
//   newListItem.innerText = dream;
//   dreamsList.appendChild(newListItem);
// }

// // fetch the initial list of dreams
// fetch("/dreams")
//   .then(response => response.json()) // parse the JSON from the server
//   .then(dreams => {
//     // remove the loading text
//     dreamsList.firstElementChild.remove();
  
//     // iterate through every dream and add it to our page
//     dreams.forEach(appendNewDream);
  
//     // listen for the form to be submitted and add a new dream when it is
//     dreamsForm.addEventListener("submit", event => {
//       // stop our form submission from refreshing the page
//       event.preventDefault();

//       // get dream value and add it to the list
//       let newDream = dreamsForm.elements.dream.value;
//       dreams.push(newDream);
//       appendNewDream(newDream);

//       // reset form
//       dreamsForm.reset();
//       dreamsForm.elements.dream.focus();
//     });
//   });
