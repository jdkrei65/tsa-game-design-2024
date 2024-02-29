import { gameify } from './gameify/gameify.js';

const clickAudio = new gameify.audio.Sound('audio/sfx/hit_2.2.mp3');

const modes = {};

export const manageModes = {
    setScreen: (screen) => {
        screen.audio_sfx.add(clickAudio);
    },
    exitAll: () => {
        for (const m in modes) {
            modes[m].exit();
        }
    },
    enterMode: (name) => {
        manageModes.exitAll();
        modes[name].enter();
        clickAudio.stop();
        clickAudio.play();
    },
    addMode: (name, enterFunction, exitFunction) => {
        modes[name] = {
            enter: enterFunction,
            exit: exitFunction
        }
    }
}