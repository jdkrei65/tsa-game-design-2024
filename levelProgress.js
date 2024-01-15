import { dialogue } from './dialogue.js';
import { gameify } from './gameify/gameify.js';
import { manageModes } from './manageModes.js';

const buildingTileset = new gameify.Tileset("images/builditembuttons.png", 32, 32);
const clipboardButtonImage = buildingTileset.getTile(1, 4);
const clipboardButtonActiveImage = buildingTileset.getTile(2, 4);
const clipboardButton = new gameify.Sprite(10, 126, clipboardButtonImage);
clipboardButton.scale = 1.5;

const clipboardImage = new gameify.Image("images/clipboard.png");
const clipboardSprite = new gameify.Sprite(68, 10, clipboardImage);
clipboardSprite.scale = 2;
const clipboardTextStyle = new gameify.TextStyle('DefaultFont', 16, '#ddd');
clipboardTextStyle.lineHeight = 1.25;
const clipboardText = new gameify.Text(
    'Level Progress:',
    58+24, 40, clipboardTextStyle
);

const levelUpImage = new gameify.Image("images/levelUpScreen.png");
const levelUpSprite = new gameify.Sprite(0, 0, levelUpImage);
levelUpSprite.scale = 2;

const levelUpTextStyle = new gameify.TextStyle('DefaultFont', 16, 'black');
const levelUpText = new gameify.Text('You leveled up!', 200, 200, levelUpTextStyle)
levelUpTextStyle.lineHeight = 1.5;


// {n} replaced with the number of times the goal need's to be completed
// {c} how many times the goal has been completed
// {g} the name of the goal
// {s} 's' if {n} !== 1
// {x} 'x' if the goal is completed

// goals also have name, type, and completed
// properties (added by code) which give the goal's name
// the goal's type, and how many times the goal was
// completed this level (see below for more info)
const goals = {
    build: {
        text: '{c}/{n} {g}s built',
        "house": { },
        "forager's hut": { },
        "water tank": { },
        "witch hut": { },
        "farm": { }
    },
    dialogue: {
        text: '[{x}] Read {g}',
        "tutorial": {
            text: "[{x}] Read the tutorial"
        }
    }
};

// Add additional properties to goals
// goals.build["house"].type === goals.build
// goals.build["house"].name === "house"
// goals.build["house"].completed === 0
for (const type in goals) {
    for (const goal in goals[type]) {
        if (typeof goals[type][goal] !== 'object') continue;
        goals[type][goal].type = goals[type];
        goals[type][goal].name = goal;
        goals[type][goal].completed = goals[type][goal].completed || 0;
    }
}

const levels = [{
    name: 'tutorial',
    requirements: [{
        goal: goals.dialogue["tutorial"],
        num: 1
    },{
        goal: goals.build["house"],
        num: 1
    },{
        goal: goals.build["forager's hut"],
        num: 1
    },{
        goal: goals.build["water tank"],
        num: 1
    }]
}, {
    name: 'small settlement',
    villagers: 4,
    buildings: ["farm", "barn", "witch hut"],
    mapAreas: ["outer plains"],
    requirements: [{
        goal: goals.build["house"],
        num: 4
    },{
        goal: goals.build["water tank"],
        num: 2
    },{
        goal: goals.build["farm"],
        num: 1
    },{
        goal: goals.build["witch hut"],
        num: 1
    }]
}, {
    name: 'placeholder',
    villagers: 99999,
    requirements: [{
        goal: goals.build["house"],
        num: 9999
    },{
        goal: goals.build["forager's hut"],
        num: 99
    },{
        goal: goals.build["water tank"],
        num: 999
    }]
}];

let currentLevel = 0;

const getGoalText = (goal, num) => {
    let text = goal.text || goal.type.text;

    return text.replaceAll('{n}', num)
               .replaceAll('{g}', goal.name)
               .replaceAll('{c}', goal.completed)
               .replaceAll('{s}', num === 1 ? '' : 's')
               .replaceAll('{x}', num > goal.completed ? '' : 'x')
}

const getLevelText = (levelNum) => {
    const level = levels[levelNum];

    if (!level) return 'No more goals!\n\nJust explore and build\nhowever you want!';

    let allDone = true;

    let text = `Level ${levelNum+1} progress:\n(${level.name})\n`;
    for (const req of level.requirements) {
        text += '\n' + getGoalText(req.goal, req.num);

        // (If this goal isn't completed)
        if (req.num > req.goal.completed) {
            allDone = false;
        }
    }

    if (allDone && !levelUpModeActive) {
        manageModes.exitAll();
        levelUp();
    }

    return text;
}

let clipboardModeActive = false;
let levelUpModeActive = false;

const enterClipboardMode = () => {
    clipboardModeActive = true;
    clipboardButton.image = clipboardButtonActiveImage;
}
const exitClipboardMode = () => {
    clipboardModeActive = false;
    clipboardButton.image = clipboardButtonImage;
}
const levelUp = () => {
    currentLevel += 1;

    for (const type in goals) {
        for (const goal in goals[type]) {
            if (typeof goals[type][goal] !== 'object') continue;

            // reset goal counters
            goals[type][goal].completed = 0;
        }
    }

    const level = levels[currentLevel];

    levelUpText.string = `Congratulations! You've built enough
to become a ${level.name.toUpperCase()}!

- ${level.villagers} new villagers have arrived!
- You've unlocked new buildings:
    ${level.buildings.map(a=>a.toUpperCase()).join(", ")}
- You can travel to the ${level.mapAreas.map(a=>a.toUpperCase()).join(" and ")}


`;

    levelUpModeActive = true;
}
const exitLevelUpMode = () => {
    levelUpModeActive = false;
    manageModes.enterMode('clipboard');
}

manageModes.addMode('clipboard', enterClipboardMode, exitClipboardMode);
manageModes.addMode('levelup', ()=>false, ()=>levelUpModeActive=false);

export const levelProgress = {
    setScreen: (screen) => {
        screen.add(clipboardButton);
        screen.add(clipboardSprite);
        screen.add(clipboardText);
        screen.add(levelUpSprite);
        screen.add(levelUpText);
    },
    completeGoal: (type, goal) => {
        if (goals[type] && goals[type][goal]) {
            goals[type][goal].completed += 1;
        } else {
            console.warn('Goal not found: ', type, goal);
        }
    },
    updateUI: (deltaTime, screen, player) => {
        const mousePos = screen.mouse.getPosition();
        if (mousePos.x > clipboardButton.position.x
            && mousePos.y > clipboardButton.position.y
            && mousePos.x < clipboardButton.position.x + clipboardButton.getSize().x
            && mousePos.y < clipboardButton.position.y + clipboardButton.getSize().y
        ) {
            screen.element.style.cursor = 'pointer';

            if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
                if (clipboardModeActive) exitClipboardMode();
                else manageModes.enterMode('clipboard');
            }
        }

        // Yay! button on level up screen
        if (levelUpModeActive
            && mousePos.x > 290 && mousePos.y > 420
            && mousePos.x < 473 && mousePos.y < 481
        ) {
            screen.element.style.cursor = 'pointer';

            if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
                exitLevelUpMode();
            }
        }

        clipboardText.string = getLevelText(currentLevel);
    },
    drawUI: () => {
        clipboardButton.draw();

        if (clipboardModeActive) {
            clipboardSprite.draw();
            clipboardText.draw();
        }

        if (levelUpModeActive) {
            levelUpSprite.draw();
            levelUpText.draw();
        }
    }
};