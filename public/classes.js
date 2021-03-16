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
  constructor(source, gain, category, pauseDuration, randAdditionalPause, playDuration, randAdditionalPlay) {
    super();
    this.source = source;
    this.gain = gain;
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
    this.soundPlaying = null;

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
      this._endPrevState(state, this.state);
      this._initState(state, this.state);
      this.state = state;
    }
  }

  // action should be defined by CanvasElement descendants
  _endPrevState(state, prevState) {}
  _initState(state, prevState) {}

}

class SquareTable extends CanvasElement {
  constructor ({x, y, z}, rotation) {
    super(null, icons['square-table'], {x, y, z}, rotation, TABLE_WIDTH, TABLE_LENGTH, 1, false, 2);
  }
}

class RoundTable extends CanvasElement {
  constructor ({x, y, z}) {
    super(null, icons['round-table'], {x, y, z}, 0, ROUND_TABLE_SIZE, ROUND_TABLE_SIZE, 1, false, 2);
  }
}
class SoundSource extends CanvasElement {
  constructor (state, icon, position, rotation, orientation, width, height, alpha, clickable, layer, audioContext, audioScene, audioProfile, isListener) {
    // state is set with setState to trigger change state action
    super(null, icon, position, rotation, width, height, alpha, clickable, layer);
    this.orientation = orientation;
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

      } else if (item.constructor.name === 'AudioGroup') {
        const audioGroup = item;
        this.addAudioGroup(name, audioGroup);

        // load sounds
        audioGroup.audioGroupWrappers.forEach((item) => {
          const audioSetting = item.audioSettings;
          this.addAudioElement(item.name, audioSetting);
        });
      }
    }

    // trigger state change to start playing sounds
    this.setState(state);
  }
  
  addAudioGroup(key, group) {
    this.audioGroups[key] = group;
  }

  addAudioElement(key, audioSettings) {
    if (preloadedAudioBuffer[audioSettings.source]) {
      this.audioElements[key] = {
        source: null, // source created when sound is played
        buffer: preloadedAudioBuffer[audioSettings.source],
        audioSettings: audioSettings
      }
    } else {
      console.log('loaded: ' + audioSettings.source);
      const audioCtx = this.audioContext;
      const myRequest = new Request(audioSettings.source);
    
      fetch(myRequest).then((response) => {
        return response.arrayBuffer();
      }).then((buffer) => {
        audioCtx.decodeAudioData(buffer, (decodedData) => {
          // store the buffer for future AudioSource instances
          this.audioElements[key] = {
            source: null, // source created when sound is played
            buffer: decodedData,
            audioSettings: audioSettings
          }
        });
      });
    }
  }

  hasAudioElement(key) {
    return !!this.audioElements[key];
  }

  play(key) {
    if (this.audioElements[key] && this.audioElements[key].audioSettings.category === AUDIO_SETTING.INTERMITTENT) {
      this.playIntermittentSound(key);
    } else if (this.audioElements[key] && this.audioElements[key].audioSettings.category === AUDIO_SETTING.PARTIAL_PLAY) {
      this.playPartialSound(key);
    } else if (this.audioElements[key] && this.audioElements[key].audioSettings.category === AUDIO_SETTING.DEFAULT) {
      this.playSound(key);
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

  playSound(key, loop, startTime) {
    const newSource = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.audioElements[key].audioSettings.gain;

    if (this.audioElements[key].source) {
      this.audioElements[key].source.stop();
    }
    this.audioElements[key].source = newSource;
    if (loop !== undefined) {
      newSource.loop = loop;
    }
    newSource.buffer = this.audioElements[key].buffer;
    newSource.connect(gainNode);
    gainNode.connect(this.resonanceAudioSrc.input);
    newSource.start(0, startTime);
  }

  pauseSound(key) {
    if (this.audioElements[key].source) {
      this.audioElements[key].source.stop();
      this.audioElements[key].source = null;
    }
  }

  getAudioDuration(key) {
    return this.audioElements[key].buffer.duration;
  }

  setAudioStartTime(key, time) {
    this.audioElements[key].basic.loopStart = time;
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
        if (group.isPlaying) {
          group.soundPlaying = soundToPlay.name;
          this.play(soundToPlay.name);
          setTimeout(() => {
            this.pause(soundToPlay.name);
            if (group.isPlaying) {
              playMemberSound();
            }
          }, playLength);
        }
      }, pauseLength);
    }

    group.play();
    playMemberSound();
  }

  pauseAudioGroup(groupName) {
    this.audioGroups[groupName].pause();
    if (this.audioGroups[groupName].soundPlaying) {
      this.pause(this.audioGroups[groupName].soundPlaying);
    }
  }

  playIntermittentSound(key) {
    const playSoundIntermittently = () => {
      const pauseLength = this.audioElements[key].audioSettings.pauseDuration + Math.random() * this.audioElements[key].audioSettings.randAdditionalPause;
      setTimeout(() => {
        if (this.audioElements[key].audioSettings.isPlaying) {
          this.playSound(key);
          playSoundIntermittently();
        }
      }, pauseLength);
    }

    this.audioElements[key].audioSettings.play();
    playSoundIntermittently();
  }

  pauseIntermittentSound(key) {
    this.audioElements[key].audioSettings.pause();
    this.pauseSound(key);
  }

  playPartialSound(key) {
    const playPartialSoundIntermittently = () => {
      const pauseLength = this.audioElements[key].audioSettings.pauseDuration + Math.random() * this.audioElements[key].audioSettings.randAdditionalPause;
      const playLength = this.audioElements[key].audioSettings.playDuration + Math.random() * this.audioElements[key].audioSettings.randAdditionalPlay;
      const audioLength = this.getAudioDuration(key) || 0;

      setTimeout(() => {
        if (this.audioElements[key].audioSettings.playDuration && this.audioElements[key].audioSettings.isPlaying) {
          this.playSound(key, true, audioLength * Math.random()); // randomize start audio location
          setTimeout(() => {
            this.pauseSound(key);
            if (this.audioElements[key].audioSettings.playDuration && this.audioElements[key].audioSettings.isPlaying) {
              playPartialSoundIntermittently();
            }
          }, playLength);
        }
      }, pauseLength);
    }

    this.audioElements[key].audioSettings.play();
    playPartialSoundIntermittently();
  }

  pausePartialSound (key) {
    this.audioElements[key].audioSettings.pause();
    this.pauseSound(key);
  }
}

class Person extends SoundSource {
  constructor(state, icon, position, orientation, audioContext, audioScene, audioProfile, habbits, isListener) {
    const alpha = isListener ? 1 : 0.7;
    const layer = isListener ? 11 : 10;
    super(state, icon, position, 0, orientation, PERSON_SIZE, PERSON_SIZE, alpha, false, layer, audioContext, audioScene, audioProfile, isListener);
    this.habbits = habbits;
    this.itemInUse = null;
  }

  get stateChangeDelay() {
    return this.state === ELEMENT_STATE.WORKING ? this.getZippingDelay() : 0;
  }

  _endPrevState(state, prevState) {
    if (prevState === ELEMENT_STATE.WALKING) {
      this.pause(SOUND_NAME.FOOTSTEP);
    } else if (prevState === ELEMENT_STATE.WORKING) {
      this.pause(SOUND_GROUP_NAME.WORK);
    } else if (prevState === ELEMENT_STATE.PREPARING_WORK) {

    }
  }

  _initState(state, prevState) {
    // this should only run once on initialization
    if (prevState === null && state) {
      this.play(SOUND_NAME.SNIFFLE);
      this.play(SOUND_NAME.THROAT_CLEAR);
      this.play(SOUND_NAME.COUGH);
      this.play(SOUND_NAME.SNEEZE);
    }

    if (state === ELEMENT_STATE.WALKING) {
      this.play(SOUND_NAME.FOOTSTEP);
    } else if (state === ELEMENT_STATE.PREPARING_WORK) {
      const timeToSitDown = 3500;
      setTimeout(() => {
        let unzipTime = 0;
        if (this.hasAudioElement(SOUND_NAME.UNZIP)) {
          this.play(SOUND_NAME.UNZIP);
          unzipTime = this.getAudioDuration(SOUND_NAME.UNZIP) * 1000;
        }
        setTimeout(() => {
          let placeBookTime = 0;
          if (this.hasAudioElement(SOUND_NAME.PLACE_BOOK)) {
            this.play(SOUND_NAME.PLACE_BOOK);
            placeBookTime = this.getAudioDuration(SOUND_NAME.PLACE_BOOK) * 1000;
          }
          setTimeout(() => {
            let placeLaptopTime = 0;
            if (this.hasAudioElement(SOUND_NAME.PLACE_LAPTOP)) {
              this.play(SOUND_NAME.PLACE_LAPTOP);
              placeLaptopTime = this.getAudioDuration(SOUND_NAME.PLACE_LAPTOP) * 1000;
            }
            setTimeout(() => {
              this.setState(ELEMENT_STATE.WORKING);
            }, placeLaptopTime);
          }, placeBookTime);
        }, unzipTime + 750);
      }, timeToSitDown);
    } else if (state === ELEMENT_STATE.WORKING) {
      this.play(SOUND_GROUP_NAME.WORK);
    } else if (state === ELEMENT_STATE.PREPARING_TO_GO) {
      const itemInUse = this.itemInUse;
      setTimeout(() => {
        let zipTime = 0;
        if (this.hasAudioElement(SOUND_NAME.ZIP)) {
          this.play(SOUND_NAME.ZIP);
          zipTime = this.getAudioDuration(SOUND_NAME.ZIP) * 1000;
        }
        setTimeout(() => {
          itemInUse.setState(ELEMENT_STATE.AVAILABLE);
        }, zipTime + 500);
      }, 1000)
    } 
  }

  getZippingDelay() {
    return this.getAudioDuration(SOUND_NAME.ZIP) * 1000 || 0;
  }
}
class Chair extends SoundSource {
  constructor(state, position, rotation, audioContext, audioScene) {
    super(
      state,
      icons['chair'],
      position,
      rotation,
      rotation, // orientation up is 0; chair icon is facing up
      CHAIR_WIDTH,
      CHAIR_LENGTH,
      1,
      true,
      1,
      audioContext,
      audioScene,
      {
        [SOUND_NAME.CHAIR_SLIDE_QUICK]: new AudioSettings(
          SOUND_SRCS.chair.slideQuick,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.CHAIR_SLIDE_SLOW]: new AudioSettings(
          SOUND_SRCS.chair.slideSlow,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.CHAIR_SLIDE_SLOW_SQUEAKY]: new AudioSettings(
          SOUND_SRCS.chair.slideSlowSqueaky,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.CHAIR_MOVING_CREAK]: new AudioSettings(
          SOUND_SRCS.chair.movingCreak,
          1,
          AUDIO_SETTING.INTERMITTENT,
          5000,
          200000
        ),
        [SOUND_NAME.CHAIR_SITTING_CREAK]: new AudioSettings(
          SOUND_SRCS.chair.sittingCreak,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
      },
    );
    this.selectedSlideSound = SOUND_NAME.CHAIR_SLIDE_QUICK; // set a sound as default in case none was selected
    this.movingCreakEnabled = false;
  }

  get stateChangeDelay() {
    return this.state === ELEMENT_STATE.IN_USE ? this.getSlidingDelay() + 1500 : 0;
  }

  _endPrevState(state, prevState) {
    if (prevState === ELEMENT_STATE.IN_USE) {
      this.play(this.selectedSlideSound);
      if (this.movingCreakEnabled) {
        this.movingCreakEnabled = false;
        this.pause(SOUND_NAME.CHAIR_MOVING_CREAK);
      }
    }
  }

  _initState(state, prevState) {
    if (state === ELEMENT_STATE.IN_USE) {
      if (prevState === ELEMENT_STATE.RESERVED) {
        const sittingCreakSound = chooseOneRandomlyFromList([null, SOUND_NAME.CHAIR_SITTING_CREAK]);
        this.play(this.selectedSlideSound);
        this.alpha = 1;
        this.clickable = false;
        if (sittingCreakSound) {
          setTimeout(() => {
            this.play(sittingCreakSound);
          }, this.getAudioDuration(this.selectedSlideSound) * 1000 + 750);
        }
      }
    } else if (state === ELEMENT_STATE.RESERVED) {
      this.alpha = 0.5;
      this.clickable = false;
    } else if (state === ELEMENT_STATE.AVAILABLE) {
      this.alpha = 1;
      this.clickable = true;
    }
  }

  enableMovingCreak() {
    this.movingCreakEnabled = true;
    this.play(SOUND_NAME.CHAIR_MOVING_CREAK);
  }

  getSlidingDelay() {
    return this.getAudioDuration(this.selectedSlideSound) * 1000 || 0;
  }
}

class Door extends SoundSource {
  constructor(state, position, rotation, audioContext, audioScene) {
    super(
      state,
      icons['door'],
      position,
      rotation,
      -90,
      DOOR_WIDTH,
      DOOR_HEIGHT,
      1,
      true,
      1,
      audioContext,
      audioScene,
      {
        [SOUND_NAME.DOOR_GENTLE]: new AudioSettings(
          SOUND_SRCS.door.gentle,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.DOOR_SLAM]: new AudioSettings(
          SOUND_SRCS.door.slam,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.DOOR_NO_SQUEAK]: new AudioSettings(
          SOUND_SRCS.door.noSqueak,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.DOOR_SQUEAK_1]: new AudioSettings(
          SOUND_SRCS.door.squeak1,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.DOOR_SQUEAK_2]: new AudioSettings(
          SOUND_SRCS.door.squeak2,
          1,
          AUDIO_SETTING.DEFAULT,
        ),
      },
    );
    this.selectedDoorSound = SOUND_NAME.DOOR_GENTLE; // set a sound as default in case none was selected
  }

  _endPrevState(state, prevState) {
  }

  _initState(state, prevState) {
    if (state === ELEMENT_STATE.IN_USE) {
      const doorTurnSound = chooseOneRandomlyFromList([
        SOUND_NAME.DOOR_NO_SQUEAK,
        SOUND_NAME.DOOR_SQUEAK_1,
        SOUND_NAME.DOOR_SQUEAK_2
      ]);
      this.play(doorTurnSound);
      setTimeout(() => {
        this.play(this.selectedDoorSound);
        setTimeout(() => {
          this.setState(ELEMENT_STATE.AVAILABLE);
        }, this.getAudioDuration(this.selectedDoorSound) * 1000);
      }, this.getAudioDuration(doorTurnSound) * 1000);
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
  getNewPerson(state, icon, position, orientation, audioProfile, habbits, isListener) {
    return new Person(state, icon, position, orientation, this.audioContext, this.audioScene, audioProfile, habbits, isListener);
  }

  makeNewPersonWithSettings(
    state,
    icon,
    position,
    orientation,
    {
      workSound,
      otherSound,
      habbit
    },
    isListener
  ) {
    const workSounds = [];
    const audioProfile = {};
    const habbits = {};

    // create work sounds
    const workSoundConsts = PERSON_SETTING.WORK_SOUND;
    if (workSound.type === workSoundConsts.TYPE.fast) {
      workSounds.push(new AudioGroupWrapper(
        'type', // name
        new AudioSettings(
          SOUND_SRCS.type.fast,
          1,
          AUDIO_SETTING.PARTIAL_PLAY,
          500,
          1000,
          500,
          1000
        ), // settings
        10, // relative frequency
        5000, // duration
        5000, // random additional duration
      ));
    } else if (workSound.type === workSoundConsts.TYPE.slow) {
      workSounds.push(new AudioGroupWrapper(
        'type', // name
        new AudioSettings(
          SOUND_SRCS.type.slow,
          1,
          AUDIO_SETTING.PARTIAL_PLAY,
          500,
          1000,
          1000,
          2000
        ), // settings
        10, // relative frequency
        5000, // duration
        5000, // random additional duration
      ));
    }
    if (workSound.pageFlip === workSoundConsts.PAGE_FLIP.default) {
      workSounds.push(new AudioGroupWrapper(
        'page-flip', // name
        new AudioSettings(
          SOUND_SRCS.pageFlip.single,
          1,
          AUDIO_SETTING.DEFAULT,
        ), // settings
        1, // relative frequency
        2000, // duration
        0, // random additional duration
      ));
    }
    if (workSound.click === workSoundConsts.CLICK.default) {
      workSounds.push(new AudioGroupWrapper(
        'single-click', // name
        new AudioSettings(
          SOUND_SRCS.click.single,
          1,
          AUDIO_SETTING.INTERMITTENT,
          100,
          5000
        ), // settings
        workSound.type ? 5 : 10, // relative frequency
        100, // duration
        5000, // random additional duration
      ));
      workSounds.push(new AudioGroupWrapper(
        'double-click', // name
        new AudioSettings(
          SOUND_SRCS.click.double,
          1,
          AUDIO_SETTING.INTERMITTENT,
          100,
          5000
        ), // settings
        1, // relative frequency
        200, // duration
        3000, // random additional duration
      ));
    }
    // configure switch task pause for work sounds
    let switchTaskPause = 1000;
    let randAdditionalSwitchTaskPause = 2000;
    if (workSound.pageFlip && !workSound.type && !workSound.click) {
      randAdditionalSwitchTaskPause = 100000;
    }
    audioProfile[SOUND_GROUP_NAME.WORK] = new AudioGroup(workSounds, switchTaskPause, randAdditionalSwitchTaskPause);
    
    // create preparation sounds related to work
    if (workSound.type || workSound.click) {
      // add put laptop on table sound on start work
      audioProfile[SOUND_NAME.PLACE_LAPTOP] = new AudioSettings(
        SOUND_SRCS.preparation.placeLaptop,
        1,
        AUDIO_SETTING.DEFAULT
      )
    }
    if (workSound.pageFlip) {
      audioProfile[SOUND_NAME.PLACE_BOOK] = new AudioSettings(
        SOUND_SRCS.preparation.placeBook,
        1,
        AUDIO_SETTING.DEFAULT
      )
    }
    
    if (otherSound) {
      // create other preparation sounds
      if (otherSound.zipUnzip === PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default) {
        audioProfile[SOUND_NAME.ZIP] = new AudioSettings(
          SOUND_SRCS.preparation.zip,
          1,
          AUDIO_SETTING.DEFAULT,
        );
        audioProfile[SOUND_NAME.UNZIP] = new AudioSettings(
          SOUND_SRCS.preparation.unzip,
          1,
          AUDIO_SETTING.DEFAULT,
        );
      }
      // create movement sounds
      let footstepPeriod = 500;
      if (otherSound.footstep === PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast) {
        footstepPeriod = 500;
      } else if (otherSound.footstep === PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.slow) {
        footstepPeriod = 700;
      }
      audioProfile[SOUND_NAME.FOOTSTEP] = new AudioSettings(
        SOUND_SRCS.footstep.boots,
        1,
        AUDIO_SETTING.INTERMITTENT,
        footstepPeriod * 0.9,
        footstepPeriod * 0.2
      );
      // create general sounds
      if (otherSound.sniffle === PERSON_SETTING.GENERAL_SOUND.SNIFFLE.default) {
        audioProfile[SOUND_NAME.SNIFFLE] = new AudioSettings(
          SOUND_SRCS.sniffle.default,
          1,
          AUDIO_SETTING.INTERMITTENT,
          1000,
          60000
        );
      }
      if (otherSound.throatClear) {
        const pause = 2000;
        const additionalRandomPause = 100000;
        let source;
        let gain;
        if (otherSound.throatClear === PERSON_SETTING.GENERAL_SOUND.THROAT_CLEAR.male) {
          source = SOUND_SRCS.throatClear.male;
          gain = 1;
        } else if (otherSound.throatClear === PERSON_SETTING.GENERAL_SOUND.THROAT_CLEAR.female) {
          source = SOUND_SRCS.throatClear.female;
          gain = 1;
        }
        audioProfile[SOUND_NAME.THROAT_CLEAR] = new AudioSettings(
          source,
          gain,
          AUDIO_SETTING.INTERMITTENT,
          pause,
          additionalRandomPause
        );
      }
      if (otherSound.cough) {
        const pause = 30000;
        const additionalRandomPause = 180000;
        let source;
        let gain;
        if (otherSound.cough === PERSON_SETTING.GENERAL_SOUND.COUGH.male) {
          source = SOUND_SRCS.cough.male;
          gain = 1;
        } else if (otherSound.cough === PERSON_SETTING.GENERAL_SOUND.COUGH.female) {
          source = SOUND_SRCS.cough.female;
          gain = 1;
        }
        audioProfile[SOUND_NAME.COUGH] = new AudioSettings(
          source,
          gain,
          AUDIO_SETTING.INTERMITTENT,
          pause,
          additionalRandomPause
        );
      }
      if (otherSound.sneeze) {
        const pause = 30000;
        const additionalRandomPause = 180000;
        let source;
        let gain;
        if (otherSound.sneeze === PERSON_SETTING.GENERAL_SOUND.SNEEZE.male) {
          source = SOUND_SRCS.sneeze.male;
          gain = 1;
        } else if (otherSound.sneeze === PERSON_SETTING.GENERAL_SOUND.SNEEZE.female) {
          source = SOUND_SRCS.sneeze.female;
          gain = 1;
        }
        audioProfile[SOUND_NAME.SNEEZE] = new AudioSettings(
          source,
          gain,
          AUDIO_SETTING.INTERMITTENT,
          pause,
          additionalRandomPause
        );
      }
    }

    // set habbits
    let chairSlideSound = SOUND_NAME.CHAIR_SLIDE_SLOW; // default chair slide sound
    let doorOpenCloseSound = SOUND_NAME.DOOR_GENTLE; // default door open/close sound
    let moveOnChair = false; // default move on chair setting
    if (habbit) {
      if (habbit.chairSlideSound === PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.slow) {
        chairSlideSound = SOUND_NAME.CHAIR_SLIDE_SLOW;
      } else if (habbit.chairSlideSound === PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.quick) {
        chairSlideSound = SOUND_NAME.CHAIR_SLIDE_QUICK;
      }

      if (habbit.doorOpenCloseSound === PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle) {
        doorOpenCloseSound = SOUND_NAME.DOOR_GENTLE;
      } else if (habbit.doorOpenCloseSound === PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.slam) {
        doorOpenCloseSound = SOUND_NAME.DOOR_SLAM;
      }

      if (habbit.moveOnChair !== undefined) {
        moveOnChair = habbit.moveOnChair;
      }
    }
    habbits.chairSlideSound = chairSlideSound;
    habbits.doorOpenCloseSound = doorOpenCloseSound;
    habbits.moveOnChair = moveOnChair;

    return this.getNewPerson(
      state,
      icon, // image
      position, // position
      orientation,
      audioProfile,
      habbits,
      isListener
    )
  }

  getNewChair(state, position, rotation) {
    return new Chair(state, position, rotation, this.audioContext, this.audioScene);
  }

  getNewDoor(state, position, rotation) {
    return new Door(state, position, rotation, this.audioContext, this.audioScene);
  }

  getCluster({x, y}, tableType, chairNum, rotation, personSettingsList) {
    const clusterElements = [];
    const chairCoordinates = [];
    let radius;

    if (tableType === 'round') {
      radius = ROUND_TABLE_SIZE / 2;
      clusterElements.push(new RoundTable({x: x, y: y, z: TABLE_HEIGHT}));
    } else if (tableType === 'square') {
      radius = TABLE_WIDTH / 2;
      clusterElements.push(new SquareTable({x: x, y: y, z: TABLE_HEIGHT}, rotation));
    }

    if (chairNum === 3) {
      const unitLen = {x: radius + CHAIR_LENGTH * 0.4, y: 0};
      // top chair
      const topChairCoordinates = rotateCoordinates(unitLen, -90 + rotation);
      chairCoordinates.push({
        x: topChairCoordinates.x + x,
        y: topChairCoordinates.y + y,
      });
      clusterElements.push(this.getNewChair(
        ELEMENT_STATE.AVAILABLE,
        {
          x: topChairCoordinates.x + x,
          y: topChairCoordinates.y + y,
          z: CHAIR_HEIGHT
        },
        180 + rotation
      ));
      // bottom left chair
      const botLeftChairCoordinates = rotateCoordinates(unitLen, 150 + rotation);
      chairCoordinates.push({
        x: botLeftChairCoordinates.x + x,
        y: botLeftChairCoordinates.y + y,
      });
      clusterElements.push(this.getNewChair(
        ELEMENT_STATE.AVAILABLE,
        {
          x: botLeftChairCoordinates.x + x,
          y: botLeftChairCoordinates.y + y,
          z: CHAIR_HEIGHT
        },
        60 + rotation
      ));
      // bottom right chair
      const botRightChairCoordinates = rotateCoordinates(unitLen, 30 + rotation);
      chairCoordinates.push({
        x: botRightChairCoordinates.x + x,
        y: botRightChairCoordinates.y + y,
      });
      clusterElements.push(this.getNewChair(
        ELEMENT_STATE.AVAILABLE,
        {
          x: botRightChairCoordinates.x + x,
          y: botRightChairCoordinates.y + y,
          z: CHAIR_HEIGHT
        },
        -60 + rotation
      ));
    } else if (chairNum === 2) {
      const unitLen = {x: radius + CHAIR_LENGTH * 0.4, y: 0};
      // top chair
      const topChairCoordinates = rotateCoordinates(unitLen, -90 + rotation);
      chairCoordinates.push({
        x: topChairCoordinates.x + x,
        y: topChairCoordinates.y + y,
      });
      clusterElements.push(this.getNewChair(
        ELEMENT_STATE.AVAILABLE,
        {
          x: topChairCoordinates.x + x,
          y: topChairCoordinates.y + y,
          z: CHAIR_HEIGHT
        },
        180 + rotation
      ));
      // bottom chair
      const botChairCoordinates = rotateCoordinates(unitLen, 90 + rotation);
      chairCoordinates.push({
        x: botChairCoordinates.x + x,
        y: botChairCoordinates.y + y,
      });
      clusterElements.push(this.getNewChair(
        ELEMENT_STATE.AVAILABLE,
        {
          x: botChairCoordinates.x + x,
          y: botChairCoordinates.y + y,
          z: CHAIR_HEIGHT
        },
        rotation
      ));
    }

    // populate chairs with people according to the index given and settings of the person
    if (personSettingsList && personSettingsList.length) {
      for (const personSettings of personSettingsList) {
        const chair = clusterElements[personSettings.locationIndex + 1]; // first one is the table
        const newPerson = this.makeNewPersonWithSettings(
          ELEMENT_STATE.WORKING,
          personSettings.icon,
          {...chairCoordinates[personSettings.locationIndex], z: 1},
          chair.orientation,
          personSettings.personSettings,
          personSettings.isListener
        );
        newPerson.itemInUse = chair;
        newPerson.itemInUse.setState(ELEMENT_STATE.IN_USE);
        if (newPerson.habbits.moveOnChair) {
          newPerson.itemInUse.enableMovingCreak();
        }
        clusterElements.push(newPerson);
      }
    }

    return clusterElements;
  }
}