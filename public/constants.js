const SOUNDS_PATH = 'resources/sounds/';
const SOUND_SRCS = {
  mySound: SOUNDS_PATH + 'fileName.wav',
}

MAX_CANVAS_WIDTH = 1600;
MAX_CANVAS_HEIGHT = 1000;

DOOR_WIDTH = 20;
DOOR_HEIGHT = 100;

CHAIR_WIDTH = 120;
CHAIR_HEIGHT = 120;

PERSON_SIZE = 60;

ROOM_DIMENSIONS = {
  width: 20, height: 3, depth: 10,
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
  outside: {
    left: 'transparent', right: 'transparent',
    up: 'transparent', down: 'grass',
    front: 'transparent', back: 'transparent',
  },
};

ROOM_MATERIALS = MATERIALS.outside;

AUDIO_SETTING = {
  DEFAULT: 0,
  INTERMITTENT: 1,
  PARTIAL_PLAY: 2
}

COLORS = {

}

PRIMARY_FONT = 'Lato';
PERSON_ICON_TEXT_COLOR = '#fff';

ELEMENT_STATE = {
  IN_USE: 0,
  RESERVED: 1,
  AVAILABLE: 2,
  WALKING: 3,
  PREPARING: 4,
  WORKING: 5,
  IDLE: 6
}

SOUND_NAME = {
  FOOT_STEP: 'foot-step',
  CHAIR_SLIDE_QUICK: 'chair-slide-quick',
  CHAIR_SLIDE_SLOW: 'chair-slide-slow',
  CHAIR_SLIDE_SLOW_SQUEAKY: 'chair-slide-slow-squeaky',
  CHAIR_MOVING_CREAK: 'chair-moving-creak',
  CHAIR_SITTING_CREAK: 'chair-sitting-creak',
  BAG_ZIP: 'bag-zip',
  DOOR_GENTLE: 'door-gentle',
  DOOR_SLAM: 'door-slam',
  DOOR_NO_SQUEAK: 'door-no-squeak',
  DOOR_SQUEAK_1: 'door-squeak-1',
  DOOR_SQUEAK_2: 'door-squeak-2',
}

SOUND_GROUP_NAME = {
  WORK: 'work-sounds'
}