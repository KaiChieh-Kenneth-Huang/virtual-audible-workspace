const SEQUENCE_EVENT = {
    entry: 'entry',
    randSwitch: 'random-switch',
    entryRandOccupy: 'entry-random-occupy',
    randExit: 'random-exit'
}
const speedMultiplier = 1;
const SECS_IN_MIN = 60 / speedMultiplier;

var curSequenceIdx = 0;
var generatedSequence = [
    {
        time: 4 * SECS_IN_MIN,
        type: SEQUENCE_EVENT.entryRandOccupy,
        person: {
            // id: 'p7', // id randomly generated if not specified
            // icon: new PersonIcon('#666', '#3a3', 'LK'), // icon randomly generated if not specified
            audioSettings: {
                workSound: {
                  type: PERSON_SETTING.WORK_SOUND.TYPE.slow,
                  click: PERSON_SETTING.WORK_SOUND.CLICK.default,
                },
                otherSound: { // otherSound,
                  zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
                  footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast,
                  cough: PERSON_SETTING.GENERAL_SOUND.COUGH.male,
                },
                habbits: { // habbits
                  chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.quick,
                  doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
                  moveOnChair: true,
                }
            },
        }
    },
    {
        time: 7 * SECS_IN_MIN,
        type: SEQUENCE_EVENT.randExit,
    },
    {
        time: 12 * SECS_IN_MIN,
        type: SEQUENCE_EVENT.randSwitch,
    },
    {
        time: 15 * SECS_IN_MIN,
        type: SEQUENCE_EVENT.randExit,
    },
    {
        time: 18 * SECS_IN_MIN,
        type: SEQUENCE_EVENT.entryRandOccupy,
        person: {
            // id: 'p7', // id randomly generated if not specified
            // icon: new PersonIcon('#666', '#3a3', 'LK'), // icon randomly generated if not specified
            audioSettings: {
                workSound: {
                  type: PERSON_SETTING.WORK_SOUND.TYPE.fast,
                },
                otherSound: { // otherSound,
                  zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
                  footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.slow,
                  sniffle: PERSON_SETTING.GENERAL_SOUND.SNIFFLE.default,
                },
                habbits: { // habbits
                  chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.slow,
                  doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
                  moveOnChair: true,
                }
            },
        }
    },
    {
        time: 20 * SECS_IN_MIN,
        type: SEQUENCE_EVENT.randExit,
    },
    {
        time: 26 * SECS_IN_MIN,
        type: SEQUENCE_EVENT.entryRandOccupy,
        person: {
            // id: 'p7', // id randomly generated if not specified
            // icon: new PersonIcon('#666', '#3a3', 'LK'), // icon randomly generated if not specified
            audioSettings: {
                workSound: {
                  type: PERSON_SETTING.WORK_SOUND.TYPE.fast,
                },
                otherSound: { // otherSound,
                  zipUnzip: PERSON_SETTING.SPECIAL_SOUND.ZIP_UNZIP.default,
                  footstep: PERSON_SETTING.SPECIAL_SOUND.FOOTSTEP.fast,
                  cough: PERSON_SETTING.GENERAL_SOUND.COUGH.female,
                },
                habbits: { // habbits
                  chairSlideSound: PERSON_SETTING.HABBIT.CHAIR_SLIDE_SOUND.quick,
                  doorOpenCloseSound: PERSON_SETTING.HABBIT.DOOR_OPEN_CLOSE_SOUND.gentle,
                  moveOnChair: false,
                }
            },
        }
    },
]