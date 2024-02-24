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

const witchImage = new gameify.Image("images/witch_portrait.png");
const womanImage = new gameify.Image("images/player_woman_portrait.png");
const manImage = new gameify.Image("images/player_man_portrait.png");
let playerImage = womanImage;
const currentCharSprite = new gameify.Sprite(630, 445, dlBoxImage);
currentCharSprite.scale = 0.25;

export const dialogue = {
    setScreen: (_screen) => {
        screen = _screen;
        screen.add(dlBox);
        screen.add(dlText);
        screen.add(dlContinueText);
        screen.add(currentCharSprite);
    },
    setPlayerImage: (img) => {
        if (img === 'man') {
            playerImage = manImage;
        } else {
            playerImage = womanImage;
        }
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
            if (currentScene !== line) {
                message.showText('Complete the current dialogue\nbefore doing this!');
            }
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
            if (dialogue.lines[currentScene][curScenePos + 1] && dialogue.lines[currentScene][curScenePos - 1]) {
                // forwards and back
                dlContinueText.string = `[SPACE to continue, X to go back]`
            } else if (!dialogue.lines[currentScene][curScenePos + 1]) {
                // on the last 'slide'
                dlContinueText.string = `[SPACE to close]`
            } else if (!!dialogue.lines[currentScene][curScenePos - 1]) {
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

        dlBox.draw();

        if (dialogue.lines[currentScene]) {
            dlText.string = dialogue.lines[currentScene][curScenePos].text || dialogue.lines[currentScene][curScenePos];

            if (dialogue.lines[currentScene][curScenePos].portrait) {
                currentCharSprite.image = dialogue.lines[currentScene][curScenePos].portrait;
                currentCharSprite.draw();
            }
        }

        dlText.draw();
        dlContinueText.draw();
    },
    lines: {
        tutorial: [
            {
                text: '*Heavy Panting* Finally we are safe!\n\n - Use the W A S & D keys to move around\n - Hold SHIFT while moving to run',
                portrait: playerImage
            },
            /* ---- */
            {
                text: `Eventually we will build a great city here,
but first, we must get resources to survive by ourselves.

 - Enter gathering mode using the pickaxe (gather) button
 - Walk near a tree or rock, then left click to gather it`, portrait: playerImage
            },
            /* ---- */
            {
                text: `Now we must build ourselves a place to live.

 - Open the build menu by clicking the hammer (top left)
 - Use the resources you've gathered to build a house and
    forager's hut for your villagers to live in`, portrait: playerImage
            },
            /* ---- */
            {
                text: `We must also have food and water. We don't want to starve, of course!

 - Build a water tank to store water
 - The forager's hut you built will provide food
 - As your village expands, you'll need to build more
`, portrait: playerImage
            },
            /* ---- */
            {
                text: `Yay! Now we have a small settlement built!

 - Select the clipboard to view your progress.
 - As your settlement expands, you'll advance through
   levels and explore more places!`, portrait: playerImage
            },
        ],
        witch_desert: [
            {
                text: `Hello! I am Hazel, the magical witch from the north.
I happen to have overheard that you would like to travel
to the desert.`, portrait: witchImage
            },
            /* ---- */
            {
                text: `Exploring the desert will help you immensely in your quest.
Resources in the desert are plentiful, and gold is everywhere.
Some even claim it's so magic you can get twice the wood from
chopping the same sized tree.`, portrait: witchImage
            },
            /* ---- */
            {
                text: `Lucky for you, I am very experienced in the ways of water
and the desert. I have crafted a magical container, known to
the people of the desert as an "endless flask". It holds an
infinite amount of water, and with it you will never be thirsty.`, portrait: witchImage
            },
            '(You can now explore the desert without limitation)'
        ],
        witch_desert_2: [
            {
                text: `Have you visited the desert yet?
Read the signs and follow the path to the north to find it!`, portrait: witchImage
            },
            {
                text: `Exploring the desert will help you immensely in your quest.
Resources in the desert are plentiful, and gold is everywhere.
Some even claim it's so magic you can get twice the wood from
chopping the same sized tree.`, portrait: witchImage
            }
        ],
        witch_tundra_1: [
            {
                text: `What do you mean you want to visit the tundra?
You just got equipment to travel to the desert!`, portrait: witchImage
            },
            /* ---- */
            {
                text: `Well, you can go there, but you'll have to go back to the
desert first. The cactus in the desert grow a berry that I
can use to make a temperature-resistant coat for you.`, portrait: witchImage
            },
            /* ---- */
            {
                text: `Bring me back 10 gold, and 10 berries, and I'll
make you the coat.

(Gather cactus from the desert to obtain gold and
berries, then bring them back to the witch)`, portrait: witchImage
            }
        ],
        witch_tundra_cost: [
            {
                text: `Bring me back 10 gold and 10 berries, and I'll make you
the coat so that you can explore the tundra.`, portrait: witchImage
            },
            {
                text: `(Gather cactus from the desert to obtain gold and
berries, then bring them back to the witch)`, portrait: witchImage
            }
        ],
        witch_tundra_coat: [
            {
                text: `Ah! you're back!
Just give me one second to craft your coat.`, portrait: witchImage
            },
            {
                text: '...', portrait: witchImage
            },
            {
                text: `Here is your coat!
The berries give it magical thermal power, so you will never
be cold.`, portrait: witchImage
            },
            '(You can now explore the tundra without limitation)'
        ],
        dehydration: [
            {
                text: `Phew! It's hot and dry here. I wouldn't want to be out
here for long without proper supplies!`,
                portrait: playerImage
            },
            {
                text: `I better turn back before I die of thirst.
I'll come back once I have a way to stay hydrated.

(Complete the goals in the progress menu to
 advance in the game)`,
                portrait: playerImage
            }
        ],
        hypothermia: [
            {
                text: `Ah! It's colder than I thought here.
I'd freeze to death in a matter of minutes!`,
                portrait: playerImage
            },
            {
                text: `Of course, it looks interesting out here, so I'll come
back once I have a good coat, of course.

(Complete the goals in the progress menu to
 advance in the game)`,
                portrait: playerImage
            },
        ]
    }
}
