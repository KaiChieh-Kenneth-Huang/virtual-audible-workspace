class AudioPlayControl {
  constructor() {
    this._play = false;
  }

  get isPlaying() {
    return this._play;
  }

  play() {
    this._play = true;
  }

  pause() {
    this._play = false;
  }
}
// name, source
// category: default; intermittent; partial-play (plays parts of the sound track intermittently)
// For intermittent
// -> randomization: pauseDuration, randAdditionalPause (note: pause duration should be longer than audio length)
// -> partial play: playDuration? ...check play usage then decide on how to implement this
// todo: parse audio length for min pause duration
class AudioSettings extends AudioPlayControl {
  constructor(source, category, pauseDuration, randAdditionalPause, playDuration, randAdditionalPlay) {
    super();
    this.source = source;
    this.category = category;
    this.pauseDuration = pauseDuration;
    this.randAdditionalPause = randAdditionalPause;
    this.playDuration = playDuration;
    this.randAdditionalPlay = randAdditionalPlay;
  }
}

// only one sound in the audio group will be played at any given time
class AudioGroup extends AudioPlayControl {
  constructor(audioGroupWrappers, switchPauseDuration, randAdditionalSwitchPauseDuration) {
    super();
    this.audioGroupWrappers = audioGroupWrappers;
    this.switchPauseDuration = switchPauseDuration;
    this.randAdditionalSwitchPauseDuration = randAdditionalSwitchPauseDuration;
    this.totalFrequency = 0;

    audioGroupWrappers.forEach((item) => {
      this.totalFrequency += item.relFrequency;
    });
  }
}
// how often each sound is played, the duration for each, pause in between sound switch
class AudioGroupWrapper {
  constructor(name, audioSettings, relFrequency, duration, randAdditionalDuration) {
    this.name = name;
    this.audioSettings = audioSettings;
    this.relFrequency = relFrequency;
    this.duration = duration;
    this.randAdditionalDuration = randAdditionalDuration;
  }
}

class PersonIcon {
  constructor(outlineColor, fillColor, text) {
    this.outlineColor = outlineColor;
    this.fillColor = fillColor;
    this.text = text;
  }
}

class CanvasElement {
  constructor (state, icon, {x, y, z}, rotation, width, height, alpha, clickable, layer) {
    this.state = state;
    this.icon = icon;
    this.position = {x, y, z};
    this.rotation = rotation;
    this.width = width;
    this.height = height;
    this.alpha = alpha;
    this.clickable = clickable;
    this.layer = layer || 1;
  }

  setState(state) {
    if (state !== this.state) {
      console.log(state)
      this._endPrevState(state, this.state);
      this._initState(state, this.state);
      this.state = state;
    }
  }

  // action should be defined by CanvasElement descendants
  _endPrevState(state, prevState) {}
  _initState(state, prevState) {}

}
class SoundSource extends CanvasElement {
  constructor (state, icon, position, rotation, width, height, alpha, clickable, layer, audioContext, audioScene, audioProfile, isListener) {
    super(state, icon, position, rotation, width, height, alpha, clickable, layer);
    this.audioContext = audioContext;
    this.audioScene = audioScene;
    this.audioElements = {};
    this.audioGroups = {};
    this.resonanceAudioSrc = audioScene.createSource();
    this.audioProfile = audioProfile;
    this.isListener = isListener === undefined ? false : isListener;
    this.isSoundSource = true;

    for (const [name, item] of Object.entries(audioProfile)) {
      if (item.constructor.name === 'AudioSettings') {
        const audioSetting = item;
        this.addAudioElement(name, audioSetting);

        if (audioSetting.category === AUDIO_SETTING.INTERMITTENT) { //name, source, category, pauseDuration, randAdditionalPause
          if (audioSetting.pauseDuration) {
            //this.play(name);
          }
        } else if (audioSetting.category === AUDIO_SETTING.PARTIAL_PLAY) {
          this.audioElements[name].basic.loop = true;
          //this.play(name);
        }
      } else if (item.constructor.name === 'AudioGroup') {
        const audioGroup = item;
        this.addAudioGroup(name, audioGroup);

        // load sounds
        audioGroup.audioGroupWrappers.forEach((item) => {
          const audioSetting = item.audioSettings;
          this.addAudioElement(item.name, audioSetting);
        });
        //console.log(this.audioElements);
        
        // play sound group
        // todo: play only when seated, not here
        //this.play(name);
      }
    }

    // trigger state change to start playing sounds
    this.state = null;
    this.setState(state);
  }
  
  addAudioGroup(key, group) {
    this.audioGroups[key] = group;
  }
  // append a sound to the SoundSource object
  addAudioElement(key, audioSettings) {
    const src = audioSettings.source;
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
      audioSettings: audioSettings
    }
  }

  play(key) {
    if (this.audioElements[key] && this.audioElements[key].audioSettings.category === AUDIO_SETTING.INTERMITTENT) {
      this.playIntermittentSound(key);
    } else if (this.audioElements[key] && this.audioElements[key].audioSettings.category === AUDIO_SETTING.PARTIAL_PLAY) {
      this.playPartialSound(key);
    } else if (this.audioElements[key] && this.audioElements[key].audioSettings.category === AUDIO_SETTING.DEFAULT) {
      this.playSound(key);
      console.log(key);
    } else if (this.audioGroups[key]) {
      this.playAudioGroup(key);
    }
  }

  pause(key) {
    if (this.audioElements[key] && this.audioElements[key].audioSettings.category === AUDIO_SETTING.INTERMITTENT) {
      this.pauseIntermittentSound(key);
    } else if (this.audioElements[key] && this.audioElements[key].audioSettings.category === AUDIO_SETTING.PARTIAL_PLAY) {
      this.pausePartialSound(key);
    } else if (this.audioGroups[key]) {
      this.pauseAudioGroup(key);
    }
  }

  playSound(key) {
    this.audioElements[key].basic.play();
  }

  pauseSound(key) {
    this.audioElements[key].basic.pause();
  }

  getAudioDuration(key) {
    return this.audioElements[key].basic.duration;
  }

  setAudioStartTime(key, time) {
    this.audioElements[key].basic.currentTime = time;
  }

  playAudioGroup(groupName) {
    // Audio group: audioGroupWrappers, switchPauseDuration, randAdditionalSwitchPauseDuration, total frequency
    // Audio wrapper: name, audioSettings, relFrequency, duration, randAdditionalDuration
    const group = this.audioGroups[groupName];
    const playMemberSound = () => {
      let soundToPlay;
      // randomly choose one to member sound to play
      let sum = 0;
      const chosen = group.totalFrequency * Math.random();
      for (const audioGroupWrapper of group.audioGroupWrappers) {
        sum += audioGroupWrapper.relFrequency;
        if (chosen < sum) { // member sound selected
          soundToPlay = audioGroupWrapper;
          break;
        }
      }

      const pauseLength = group.switchPauseDuration + Math.random() * group.randAdditionalSwitchPauseDuration;
      const playLength = (soundToPlay.duration + Math.random() * soundToPlay.randAdditionalDuration);

      setTimeout(() => {
        this.play(soundToPlay.name);
        setTimeout(() => {
          this.pause(soundToPlay.name);
          if (group.isPlaying) {
            playMemberSound();
          }
        }, playLength);
      }, pauseLength);
    }

    group.play();
    playMemberSound();
  }

  pauseAudioGroup(groupName) {
    this.audioGroups[groupName].pause();
  }

  playIntermittentSound(key) {
    const playSoundIntermittently = () => {
      const pauseLength = this.audioElements[key].audioSettings.pauseDuration + Math.random() * this.audioElements[key].audioSettings.randAdditionalPause;
      setTimeout(() => {
        this.playSound(key);
        if (this.audioElements[key].audioSettings.isPlaying) {
          playSoundIntermittently();
        }
      }, pauseLength);
    }

    this.audioElements[key].audioSettings.play();
    playSoundIntermittently();
  }

  pauseIntermittentSound(key) {
    this.audioElements[key].audioSettings.pause();
  }

  playPartialSound(key) {
    const playPartialSoundIntermittently = () => {
      const pauseLength = this.audioElements[key].audioSettings.pauseDuration + Math.random() * this.audioElements[key].audioSettings.randAdditionalPause;
      const playLength = this.audioElements[key].audioSettings.playDuration + Math.random() * this.audioElements[key].audioSettings.randAdditionalPlay;
      const audioLength = this.getAudioDuration(key);
      
      // randomize start audio location
      if (audioLength) {
        this.setAudioStartTime(key, audioLength * Math.random());
      }

      setTimeout(() => {
        this.playSound(key);
        setTimeout(() => {
          this.pauseSound(key);
          if (this.audioElements[key].audioSettings.playDuration && this.audioElements[key].audioSettings.isPlaying) {
            playPartialSoundIntermittently();
          }
        }, playLength);
      }, pauseLength);
    }

    this.audioElements[key].audioSettings.play();
    playPartialSoundIntermittently();
  }

  pausePartialSound (key) {
    this.audioElements[key].audioSettings.pause();
  }
}

class Person extends SoundSource {
  constructor(state, icon, position, audioContext, audioScene, audioProfile, isListener) {
    const alpha = isListener ? 1 : 0.7;
    const layer = isListener ? 11 : 10;
    super(state, icon, position, 0, 50, 50, alpha, false, layer, audioContext, audioScene, audioProfile, isListener);
    this.itemInUse = null;
  }

  _endPrevState(state, prevState) {
    if (prevState === ELEMENT_STATE.WALKING) {
      this.pause(SOUND_NAME.FOOT_STEP);
    } else if (prevState === ELEMENT_STATE.WORKING) {
      this.pause(SOUND_GROUP_NAME.WORK);
    } 
  }

  _initState(state, prevState) {
    if (state === ELEMENT_STATE.WALKING) {
      this.play(SOUND_NAME.FOOT_STEP);
    } else if (state === ELEMENT_STATE.WORKING) {
      this.play(SOUND_GROUP_NAME.WORK);
    } 
  }
}
class Chair extends SoundSource {
  constructor(state, position, rotation, audioContext, audioScene) {
    super(
      state,
      icons['chair'],
      position,
      rotation,
      60,
      60,
      1,
      true,
      1,
      audioContext,
      audioScene,
      {
        [SOUND_NAME.CHAIR_SLIDE]: new AudioSettings(
          'resources/sounds/environment related human sounds/chair_slide.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        'moving-creak': new AudioSettings(
          'resources/sounds/environment related human sounds/moving_creak.wav',
          AUDIO_SETTING.DEFAULT,
        ),
        'sitting-creak': new AudioSettings(
          'resources/sounds/environment related human sounds/sitting_creak.wav',
          AUDIO_SETTING.DEFAULT,
        ),
      },
    );
  }

  get stateChangeDelay() {
    return this.state === ELEMENT_STATE.IN_USE ? 1500 : 0;
  }

  _endPrevState(state, prevState) {
    if (prevState === ELEMENT_STATE.IN_USE) {
      this.play(SOUND_NAME.CHAIR_SLIDE);
    }
  }

  _initState(state, prevState) {
    if (state === ELEMENT_STATE.IN_USE) {
      this.play(SOUND_NAME.CHAIR_SLIDE);
    }
  }
}

// utility class for creating new elements
class AudioContextAndScene {
  constructor(audioContext, audioScene) {
    this.audioContext = audioContext;
    this.audioScene = audioScene;
  }
  
  // methods for adding elements to room
  getNewPerson(state, icon, position, audioProfile, isListener) {
    return new Person(state, icon, position, this.audioContext, this.audioScene, audioProfile, isListener);
  }

  getNewChair(state, position, rotation) {
    return new Chair(state, position, rotation, this.audioContext, this.audioScene);
  }
}