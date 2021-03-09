class CanvasElement {
  constructor (audio, audioContext, audioScene, {x, y, z}) {
    this.icon = icon;
    
  }
}

  canvasControl.addElement({
      icon: id,
      x: 0.1,
      y: 0.1,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
  });

class SoundSource {
  constructor (audio, audioContext, audioScene, {x, y, z}) {
    this.audioContext = audioContext;
    this.audioScene = audioScene;
    this.position = {x, y, z};
    this.audioElements = {};
    this.audioElementSources
  }
  
  // helper methods
  createAudioElement (key, src) {
    // set up the basic audio element
    const newAudioElement = document.createElement('audio');
    newAudioElement.src = src;
    newAudioElement.crossOrigin = 'anonymous';
    newAudioElement.load();
    newAudioElement.loop = false;
    
    // create audioContext element
    const audioContextSrc = this.audioContext.createMediaElementSource(newAudioElement);
    // create ResonanceAudio element
    const resonanceAudioSrc = this.audioScene.createSource();
    // connect the two
    audioContextSrc.connect(resonanceAudioSrc.input);
    
    // store the element and sources
    this.audioElements[key] = {
      basic: newAudioElement,
      audioContext: audioContextSrc,
      resonanceAudio: resonanceAudioSrc
    }
  }
}

// play audio once
//this.audioElements[key].basic.play();


// run this once when user enters the room
//if (!audioReady) {
//  initAudio();
//}
//selectRoomProperties();
