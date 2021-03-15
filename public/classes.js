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
    this.state = null;
    this.setState(state);
  }
  
  addAudioGroup(key, group) {
    this.audioGroups[key] = group;
  }

  addAudioElement(key, audioSettings) {
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
    if (this.audioElements[key].source) {
      this.audioElements[key].source.stop();
    }
    this.audioElements[key].source = newSource;
    if (loop !== undefined) {
      newSource.loop = loop;
    }
    newSource.buffer = this.audioElements[key].buffer;
    newSource.connect(this.resonanceAudioSrc.input);
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
  constructor(state, icon, position, audioContext, audioScene, audioProfile, habbits, isListener) {
    const alpha = isListener ? 1 : 0.7;
    const layer = isListener ? 11 : 10;
    super(state, icon, position, 0, PERSON_SIZE, PERSON_SIZE, alpha, false, layer, audioContext, audioScene, audioProfile, isListener);
    this.habbits = habbits;
    this.itemInUse = null;
  }

  get stateChangeDelay() {
    return this.state === ELEMENT_STATE.WORKING ? this.getZippingDelay() : 0;
  }

  _endPrevState(state, prevState) {
    if (prevState === ELEMENT_STATE.WALKING) {
      this.pause(SOUND_NAME.FOOT_STEP);
    } else if (prevState === ELEMENT_STATE.WORKING) {
      this.pause(SOUND_GROUP_NAME.WORK);
    } else if (prevState === ELEMENT_STATE.PREPARING_WORK) {

    }
  }

  _initState(state, prevState) {
    if (state === ELEMENT_STATE.WALKING) {
      this.play(SOUND_NAME.FOOT_STEP);
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
      CHAIR_WIDTH,
      CHAIR_LENGTH,
      1,
      true,
      1,
      audioContext,
      audioScene,
      {
        [SOUND_NAME.CHAIR_SLIDE_QUICK]: new AudioSettings(
          'resources/sounds/environment related human sounds/chair_slide_quick.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.CHAIR_SLIDE_SLOW]: new AudioSettings(
          'resources/sounds/environment related human sounds/chair_slide_slow.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.CHAIR_SLIDE_SLOW_SQUEAKY]: new AudioSettings(
          'resources/sounds/environment related human sounds/chair_slide_slow_squeaky.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.CHAIR_MOVING_CREAK]: new AudioSettings(
          'resources/sounds/environment related human sounds/moving_creak.wav',
          AUDIO_SETTING.INTERMITTENT,
          5000,
          200000
        ),
        [SOUND_NAME.CHAIR_SITTING_CREAK]: new AudioSettings(
          'resources/sounds/environment related human sounds/sitting_creak.wav',
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
      const sittingCreakSound =  chooseOneRandomlyFromList([null, SOUND_NAME.CHAIR_SITTING_CREAK]);
      this.play(this.selectedSlideSound);
      this.alpha = 1;
      this.clickable = false;
      console.log(sittingCreakSound)
      if (sittingCreakSound) {
        setTimeout(() => {
          this.play(sittingCreakSound);
        }, this.getAudioDuration(this.selectedSlideSound) * 1000 + 750);
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
      DOOR_WIDTH,
      DOOR_HEIGHT,
      1,
      true,
      1,
      audioContext,
      audioScene,
      {
        [SOUND_NAME.DOOR_GENTLE]: new AudioSettings(
          'resources/sounds/environment related human sounds/door_gentle.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.DOOR_SLAM]: new AudioSettings(
          'resources/sounds/environment related human sounds/door_slam.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.DOOR_NO_SQUEAK]: new AudioSettings(
          'resources/sounds/environment related human sounds/door_no_squeak.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.DOOR_SQUEAK_1]: new AudioSettings(
          'resources/sounds/environment related human sounds/door_squeak_1.mp3',
          AUDIO_SETTING.DEFAULT,
        ),
        [SOUND_NAME.DOOR_SQUEAK_2]: new AudioSettings(
          'resources/sounds/environment related human sounds/door_squeak_2.mp3',
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
  getNewPerson(state, icon, position, audioProfile, habbits, isListener) {
    return new Person(state, icon, position, this.audioContext, this.audioScene, audioProfile, habbits, isListener);
  }

  makeNewPersonWithSettings(
    state,
    icon,
    position,
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
          AUDIO_SETTING.INTERMITTENT,
          100,
          5000
        ), // settings
        1, // relative frequency
        200, // duration
        3000, // random additional duration
      ));
    }

    let switchTaskPause = 1000;
    let randAdditionalSwitchTaskPause = 2000;
    if (workSound.pageFlip && !workSound.type && !workSound.click) {
      randAdditionalSwitchTaskPause = 100000;
    }

    audioProfile[SOUND_GROUP_NAME.WORK] = new AudioGroup(workSounds);

    return this.getNewPerson(
      state,
      icon, // image
      position, // position
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
        clusterElements.push(
          this.makeNewPersonWithSettings(
            ELEMENT_STATE.WORKING,
            personSettings.icon,
            {...chairCoordinates[personSettings.locationIndex], z: 1},
            personSettings.personSettings,
            personSettings.isListener
          )
        );
      }
    }

    return clusterElements;

    function rotateCoordinates({x, y}, rotation) {
      const sin = Math.sin(rotation / 180 * Math.PI);
      const cos = Math.cos(rotation / 180 * Math.PI);
      return {x: x * cos - y * sin, y: x * sin + y * cos}
    }
  }
}