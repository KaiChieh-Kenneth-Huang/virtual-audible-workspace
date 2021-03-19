const SOUNDS_PATH = 'resources/sounds/';
const ENVIRONMENT_PATH = 'environment related human sounds/'
const INTRINSIC_PATH = 'intrinsic human sounds/'
const WORK_PATH = 'work sounds/'
const SOUND_SRCS = {
  chair: {
    slideQuick: SOUNDS_PATH + ENVIRONMENT_PATH + 'chair_slide_quick.mp3',
    slideSlow: SOUNDS_PATH + ENVIRONMENT_PATH + 'chair_slide_slow.mp3',
    slideSlowSqueaky: SOUNDS_PATH + ENVIRONMENT_PATH + 'chair_slide_slow_squeaky.mp3',
    movingCreak: SOUNDS_PATH + ENVIRONMENT_PATH + 'moving_creak.wav',
    sittingCreak: SOUNDS_PATH + ENVIRONMENT_PATH + 'sitting_creak.wav',
  },
  door: {
    gentle: SOUNDS_PATH + ENVIRONMENT_PATH + 'door_gentle.mp3',
    slam: SOUNDS_PATH + ENVIRONMENT_PATH + 'door_slam.mp3',
    noSqueak: SOUNDS_PATH + ENVIRONMENT_PATH + 'door_no_squeak.mp3',
    squeak1: SOUNDS_PATH + ENVIRONMENT_PATH + 'door_squeak_1.mp3',
    squeak2: SOUNDS_PATH + ENVIRONMENT_PATH + 'door_squeak_2.mp3',
  },
  footstep: {
    boots: SOUNDS_PATH + ENVIRONMENT_PATH + 'single_footstep_boots.wav',
    softSneakers: SOUNDS_PATH + ENVIRONMENT_PATH + 'single_footstep_fd.mp3'
  },
  preparation: {
    zip: SOUNDS_PATH + ENVIRONMENT_PATH + 'zipping.mp3',
    unzip: SOUNDS_PATH + ENVIRONMENT_PATH + 'unzipping.mp3',
    placeLaptop: SOUNDS_PATH + ENVIRONMENT_PATH + 'place_laptop.mp3',
    placeBook: SOUNDS_PATH + ENVIRONMENT_PATH + 'place_book.wav',
  },
  sniffle: {
    default: SOUNDS_PATH + INTRINSIC_PATH + 'sniffle.mp3'
  },
  throatClear: {
    default: SOUNDS_PATH + INTRINSIC_PATH + 'male_throat_clear.mp3',
    male: SOUNDS_PATH + INTRINSIC_PATH + 'male_throat_clear.mp3',
    female: SOUNDS_PATH + INTRINSIC_PATH + 'female_throat_clear.wav',
  },
  cough: {
    default: SOUNDS_PATH + INTRINSIC_PATH + 'male_cough.mp3',
    male: SOUNDS_PATH + INTRINSIC_PATH + 'male_cough.mp3',
    female: SOUNDS_PATH + INTRINSIC_PATH + 'female_cough.wav',
  },
  sneeze: {
    default: SOUNDS_PATH + INTRINSIC_PATH + 'male_sneeze.wav',
    male: SOUNDS_PATH + INTRINSIC_PATH + 'male_sneeze.wav',
    female: SOUNDS_PATH + INTRINSIC_PATH + 'female_sneeze.mp3',
  },
  type: {
    default: SOUNDS_PATH + WORK_PATH + 'fast_typ1.mp3',
    fast: SOUNDS_PATH + WORK_PATH + 'fast_typ1.mp3',
    slow: SOUNDS_PATH + WORK_PATH + 'slow_typ.mp3',
  },
  click: {
    single: SOUNDS_PATH + WORK_PATH + 'single_click.mp3',
    double: SOUNDS_PATH + WORK_PATH + 'double_click.mp3',
  },
  pageFlip: {
    single: SOUNDS_PATH + WORK_PATH + 'single_page_flip.mp3',
    multiple: SOUNDS_PATH + WORK_PATH + 'page_flips.mp3',
  }
}

const PERSON_SETTING = {
  WORK_SOUND: {
    TYPE: {
      fast: 'fast',
      slow: 'slow',
    },
    PAGE_FLIP: {
      default: 'default'
    },
    CLICK: {
      default: 'default'
    }
  },
  GENERAL_SOUND: {
    SNIFFLE: {
      default: 'default'
    },
    THROAT_CLEAR: {
      male: 'male',
      female: 'female',
    },
    COUGH: {
      male: 'male',
      female: 'female',
    },
    SNEEZE: {
      male: 'male',
      female: 'female',
    },
  },
  SPECIAL_SOUND: {
    ZIP_UNZIP: {
      default: 'default'
    },
    FOOTSTEP: {
      fast: 'fast',
      slow: 'slow',
    },
  },
  HABBIT: {
    CHAIR_SLIDE_SOUND: {
      quick: 'quick',
      slow: 'slow',
      slow_squeaky: 'slow-squeaky',
    },
    DOOR_OPEN_CLOSE_SOUND: {
      gentle: 'gentle',
      slam: 'slam',
    },
  },
}

const MAX_CANVAS_WIDTH = 1600;
const MAX_CANVAS_HEIGHT = 1000;

const DOOR_WIDTH = 20;
const DOOR_HEIGHT = 100;
const DOOR_LOCATION = {x: DOOR_WIDTH / 2 , y: MAX_CANVAS_HEIGHT / 3}

const CHAIR_WIDTH = 120;
const CHAIR_LENGTH = 120;
const CHAIR_HEIGHT = 0.5;
const ROUND_TABLE_SIZE = 250;
const TABLE_WIDTH = 250;
const TABLE_LENGTH = 250;
const TABLE_HEIGHT = 0.5;

const PERSON_SIZE = 60;

const ROOM_DIMENSIONS = {
  width: 40, height: 3, depth: 20,
}

const MATERIALS = {
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
  space: {
    left: 'transparent', right: 'transparent',
    up: 'transparent', down: 'transparent',
    front: 'transparent', back: 'transparent',
  },
};

const ROOM_MATERIALS = MATERIALS.space;

const AUDIO_SETTING = {
  DEFAULT: 0,
  INTERMITTENT: 1,
  PARTIAL_PLAY: 2
}

const COLORS = {

}

const PRIMARY_FONT = 'Lato';
const PERSON_ICON_TEXT_COLOR = '#fff';

const ELEMENT_STATE = {
  IN_USE: 0,
  RESERVED: 1,
  AVAILABLE: 2,
  WALKING: 3,
  PREPARING_WORK: 4,
  PREPARING_TO_GO: 5,
  WORKING: 6,
  IDLE: 7
}

const SOUND_NAME = {
  FOOTSTEP: 'footstep',
  CHAIR_SLIDE_QUICK: 'chair-slide-quick',
  CHAIR_SLIDE_SLOW: 'chair-slide-slow',
  CHAIR_SLIDE_SLOW_SQUEAKY: 'chair-slide-slow-squeaky',
  CHAIR_MOVING_CREAK: 'chair-moving-creak',
  CHAIR_SITTING_CREAK: 'chair-sitting-creak',
  ZIP: 'zip',
  UNZIP: 'unzip',
  PLACE_BOOK: 'place-book',
  PLACE_LAPTOP: 'place-laptop',
  DOOR_GENTLE: 'door-gentle',
  DOOR_SLAM: 'door-slam',
  DOOR_NO_SQUEAK: 'door-no-squeak',
  DOOR_SQUEAK_1: 'door-squeak-1',
  DOOR_SQUEAK_2: 'door-squeak-2',
  SNIFFLE: 'sniffle',
  THROAT_CLEAR: 'throat-clear',
  COUGH: 'cough',
  SNEEZE: 'sneeze',
}

const SOUND_GROUP_NAME = {
  WORK: 'work-sounds'
}