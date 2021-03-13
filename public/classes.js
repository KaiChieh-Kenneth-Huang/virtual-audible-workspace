class CanvasElement {
  constructor (icon, isPerson, {x, y, z}, rotation, width, height, alpha, clickable, layer) {
    this.icon = icon;
    this.isPerson = isPerson;
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
  constructor (icon, isPerson, position, rotation, width, height, alpha, clickable, layer, audioContext, audioScene, audioProfile, isListener) {
    super(icon, isPerson, position, rotation, width, height, alpha, clickable, layer);
    this.audioContext = audioContext;
    this.audioScene = audioScene;
    this.audioElements = {};
    this.audioGroups = {};
    this.resonanceAudioSrc = audioScene.createSource();
    this.audioProfile = audioProfile;
    this.isListener = isListener === undefined ? false : isListener;

    for (const [name, item] of Object.entries(audioProfile)) {
      if (item.constructor.name === 'AudioSettings') {
        const audioSetting = item;
        this.addAudioElement(name, audioSetting);

        if (audioSetting.category === AUDIO_SETTING.INTERMITTENT) { //name, source, category, pauseDuration, randAdditionalPause
          if (audioSetting.pauseDuration) {
            this.play(name);
          }
        } else if (audioSetting.category === AUDIO_SETTING.PARTIAL_PLAY) {
          this.audioElements[name].basic.loop = true;
          this.play(name);
        }
      } else if (item.constructor.name === 'AudioGroup') {
        const audioGroup = item;
        this.addAudioGroup(name, audioGroup);

        // load sounds
        audioGroup.audioGroupWrappers.forEach((item) => {
          const audioSetting = item.audioSettings;
          this.addAudioElement(item.name, audioSetting);
        });
        console.log(this.audioElements);
        
        // play sound group
        // todo: play only when seated, not here
        this.play(name);
      }
    }
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
      if (this.audioElements[key].audioSettings.pauseDuration) {
        this.playIntermittentSound(key);
      }
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
        if (this.audioElements[key].audioSettings.pauseDuration && this.audioElements[key].audioSettings.isPlaying) {
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