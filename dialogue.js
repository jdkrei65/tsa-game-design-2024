import { gameify } from './gameify/gameify.js';

const dlBoxImage = new gameify.Image("images/dialoguebox.png");
const dlBox = new gameify.Sprite(0, 0, dlBoxImage);
dlBox.position = new gameify.Vector2d(10, 400);
dlBox.scale = 6

const dlTextStyle = new gameify.TextStyle('Arial', 18, 'black', 'red', 2);
const dlText = new gameify.Text("...", 40, 435, dlTextStyle);
const dlContinueText = new gameify.Text("[SPACE to continue]", 40, 545, dlTextStyle);

let screen = undefined;
let currentScene = undefined;
let curScenePos = 0;
let dlIsOpen = false;

export const dialogue = {
    setScreen: (_screen) => {
        screen = _screen;
        screen.add(dlBox);
        screen.add(dlText);
        screen.add(dlContinueText);
    },
    setText: (text) => {
        dlIsOpen = true;
        currentScene = undefined;
        dlText.string = text;
    },
    setScene: (line, num = 0) => {
        dlIsOpen = true;
        currentScene = line;
        curScenePos = num;
    },
    updateBox: () => {
        if (currentScene && screen.keyboard.keyWasJustPressed('Space')) {
            curScenePos++;
            if (!dialogue.lines[currentScene][curScenePos]) {
                dlIsOpen = false;
            }
        }
    },
    getCurPos: () => curScenePos,
    drawBox: () => {
        if (!dlIsOpen) {
            return;
        }

        if (dialogue.lines[currentScene]) {
            dlText.string = dialogue.lines[currentScene][curScenePos];
        } else if (currentScene) {
            console.warn('No dialogue for scene: ' + currentScene);
            currentScene = undefined;
        }

        dlBox.draw();
        dlText.draw();
        dlContinueText.draw();
    },
    lines: {
        tutorial: [
            'Welcome to (game name)! Where you build a city or something!',
            'You and friend have been traveling to blah blah fantasy something',
            'Go to tree and chop down, now you have wood!',
            'First, build houses! Select the "hammer" button in the screen',
            'Build two houses for you, a gather hut, and a water tower.'
        ]
    }
}
