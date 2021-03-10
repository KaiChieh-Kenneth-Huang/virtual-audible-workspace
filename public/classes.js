class CanvasElement {
  constructor (icon, {x, y, z}, rotation, width, height, alpha, clickable, layer) {
    this.icon = icon;
    this.position = {x, y, z};
    this.rotation = rotation;
    this.width = width;
    this.height = height;
    this.alpha = alpha;
    this.clickable = clickable;
    this.layer = layer || 1;
    this.occupiedChair = null;
  }
}
class SoundSource extends CanvasElement {
  constructor (icon, position, rotation, width, height, alpha, clickable, layer, audioContext, audioScene, audioProfile, isListener) {
    super(icon, position, rotation, width, height, alpha, clickable, layer);
    this.audioContext = audioContext;
    this.audioScene = audioScene;
    this.audioElements = {};
    this.resonanceAudioSrc = audioScene.createSource();
    this.audioProfile = audioProfile;
    this.isListener = isListener === undefined ? false : isListener;

    for (const [name, audioSetting] of Object.entries(audioProfile)) {
      this.addAudioElement(name, audioSetting.source);

      if (audioSetting.category === AUDIO_SETTING.INTERMITTENT) { //name, source, category, pauseDuration, randAdditionalPause
        if (audioSetting.pauseDuration) {
          this.playIntermittentSound(name);
        }
      }
    }
  }
  
  // append a sound to the SoundSource object
  addAudioElement (key, src) {
    // set up the basic audio element
    const newAudioElement = document.createElement('audio');
    newAudioElement.src = src;
    newAudioElement.crossOrigin = 'anonymous';
    newAudioElement.load();
    newAudioElement.loop = false;
    
    // create audioContext element
    const audioContextSrc = this.audioContext.createMediaElementSource(newAudioElement);

    // connect with the ResonanceAudio element
    audioContextSrc.connect(this.resonanceAudioSrc.input);
    
    // store the element and sources
    this.audioElements[key] = {
      basic: newAudioElement,
      audioContext: audioContextSrc,
    }
  }

  playSound (key) {
    this.audioElements[key].basic.play();
  }

  playIntermittentSound (key) {
    const playSoundIntermittently = () => {
      const pauseLength = this.audioProfile[key].pauseDuration + Math.random() * this.audioProfile[key].randAdditionalPause;
      setTimeout(() => {
        this.playSound(key);
        if (this.audioProfile[key].pauseDuration && this.audioProfile[key].isPlaying) {
          playSoundIntermittently();
        }
      }, pauseLength);
    }

    this.audioProfile[key].play();
    playSoundIntermittently();
  }

  stopIntermittentSound (key) {
    this.audioProfile[key].stop();
  }
}

// name, source
// category: default; intermittent; partial-play (plays parts of the sound track intermittently)
// For intermittent
// -> randomization: pauseDuration, randAdditionalPause (note: pause duration should be longer than audio length)
// -> partial play: playDuration? ...check play usage then decide on how to implement this
// todo: parse audio length for min pause duration
class AudioSettings {
  constructor(source, category, pauseDuration, randAdditionalPause) {
    this.source = source;
    this.category = category;
    this.pauseDuration = pauseDuration;
    this.randAdditionalPause = randAdditionalPause;
    this._play = false;
  }

  get isPlaying() {
    return this._play;
  }

  play() {
    this._play = true;
  }

  stop() {
    this._play = false;
  }
}
