import { gameify } from './gameify/gameify.js';
import { levelProgress } from './levelProgress.js';
import { message } from './message.js';

const dlBoxImage = new gameify.Image("images/scroll.png");
const dlBox = new gameify.Sprite(0, 0, dlBoxImage);
dlBox.position = new gameify.Vector2d(10, 400);
dlBox.scale = 2

const dlTextStyle = new gameify.TextStyle('DefaultFont', 16, 'black');
const dlText = new gameify.Text("...", 80, 435, dlTextStyle);
dlText.style.lineHeight = 1.3;
const dlContinueText = new gameify.Text(`[SPACE to continue]`, 80, 545, dlTextStyle);

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
    /** Set the dialogue text
     * @param {string} text - the text
     * @param {boolean|string} [overwrite=false] - force the text even if a scene is active
     * (if it's a string, only overwrite if currentScene.startsWith(overwrite))
     * @param {string} [identifier=undefined] - treat the dialogue like a scene, and use this name
     * @param {string} [actionText=undefined] - display [X to (action)] text
     * @return true if text is displayed, false if not
     */
    setText: (text, overwrite = false, identifier = undefined, actionText = undefined) => {
        if (overwrite !== true && !currentScene?.startsWith(overwrite) && currentScene) {
            message.showText('Complete the current dialogue\nbefore doing this!');
            return false;
        }
        dlIsOpen = true;
        currentScene = identifier;
        dlText.string = text;

        if (actionText) {
            dlContinueText.string = `[SPACE to close, X to ${actionText}]`;
        } else {
            dlContinueText.string = '[SPACE to close]';
        }

        return true;
    },
    closeIfActive: (identifier) => {
        if (currentScene === identifier) {
            dialogue.forceClose()
        }
    },
    forceClose: () => {
        currentScene = undefined;
        dlIsOpen = false;
    },
    setScene: (line, num = 0, force = true) => {
        if (!force && dlIsOpen) {
            message.showText('Complete the current dialogue\nbefore doing this!');
            return false;
        }
        dlContinueText.string = `[SPACE to continue]`;
        dlIsOpen = true;
        currentScene = line;
        curScenePos = num;
        return true;
    },
    updateBox: () => {
        const spacePressed = screen.keyboard.keyWasJustPressed('Space');
        const backPressed = screen.keyboard.keyWasJustPressed('X');
        if (dialogue.lines[currentScene] && spacePressed) {
            // go to next
            curScenePos++;
            if (!dialogue.lines[currentScene][curScenePos]) {
                // complete the dialogue scene if there is no next
                levelProgress.completeGoal('dialogue', currentScene);
                dialogue.forceClose();
            }
        } else if (dialogue.lines[currentScene] && backPressed) {
            // go back
            curScenePos--;
            if (!dialogue.lines[currentScene][curScenePos]) {
                // undo go back if there is no back
                curScenePos++;
            }
        } else if (dlIsOpen && spacePressed) {
            dialogue.forceClose();
        }

        if (dlIsOpen && dialogue.lines[currentScene]) {
            if (dialogue.lines[currentScene][curScenePos+1] && dialogue.lines[currentScene][curScenePos-1]) {
                // forwards and back
                dlContinueText.string = `[SPACE to continue, X to go back]`
            } else if (!dialogue.lines[currentScene][curScenePos+1]) {
                // on the last 'slide'
                dlContinueText.string = `[SPACE to close]`
            } else if (!!dialogue.lines[currentScene][curScenePos-1]) {
                // on the first 'slide'
                dlContinueText.string = `[SPACE to continue]`
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
        }

        dlBox.draw();
        dlText.draw();
        dlContinueText.draw();
    },
    lines: {
        tutorial: [
'*Heavy Panting* Finally we are safe!\n\n - Use the W A S & D keys to move around',
/* ---- */
`Eventually we will build a great city here,
but first, we must get resources to survive by ourselves.

 - Enter gathering mode by clicking the pickaxe button (top left)
 - Walk near a tree or rock, then left click to gather it`,
/* ---- */
`Now we must build ourselves a place to live.

 - Open the build menu by clicking the hammer (top left)
 - Use the resources you've gathered to build a house and forager's hut
    for your villagers to live in`,
/* ---- */
`We must also have food and water. We don't want to starve, of course!

 - Build a water tank to store water
 - The forager's hut you built will provide food
 - As your village expands, you'll need to build more
`,
/* ---- */
`Yay! Now we have a small settlement built!

 - Select the clipboard (near the top left) to view your progress.
 - As your settlement expands, you'll advance through levels
   and explore more places!`,
        ],
        v1_temp: [
            'hi i am a witch, i do magic.\nI hear you want to go to desert',
            'here have a magic water bottle.\nIt helps you not die of dehydration.',
            '(you have gained a magic water bottle,\nit helps you not die of dehydration)'
        ]
    }
}
