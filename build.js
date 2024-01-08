import { gameify } from './gameify/gameify.js';

let buildModeActive = false;

const buildingTileset = new gameify.Tileset("images/placeholder5.png", 32, 32);
const buildButtonImages = {
    build:          buildingTileset.getTile(0, 0),
    buildActive:    buildingTileset.getTile(1, 0),
    buildHouse:     buildingTileset.getTile(2, 0),
    buildHut:       buildingTileset.getTile(0, 1),
    buildWaterTank: buildingTileset.getTile(1, 1),
}

const buildButtons = [];
let curBtnPosition = 10;
for (const bt in buildButtonImages) {
    const pos = new gameify.Vector2d(curBtnPosition, 10)
    const img = buildButtonImages[bt]
    buildButtons[bt] = {
        sprite: new gameify.Sprite(pos.x, pos.y, img),
        active: (bt === 'build'),
    }
    buildButtons[bt].sprite.scale = 1.5;

    if (bt !== 'build') {
        // First two buttons are in the same place
        curBtnPosition += 58;
    }
}

const enterBuildMode = () => {
    for (const bt in buildButtons) {
        const button = buildButtons[bt];
        button.active = true;
    }
    buildModeActive = true;
    buildButtons['build'].active = false;
}
const exitBuildMode = () => {
    for (const bt in buildButtons) {
        const button = buildButtons[bt];
        button.active = false;
    }
    buildModeActive = false;
    buildButtons['build'].active = true;
}

buildButtons['build'].click = () => {
    console.log('entering build mode');
    enterBuildMode();
}
buildButtons['buildActive'].click = () => {
    exitBuildMode();
}

const buildings = {
    house:      {
        image: buildingTileset.getTile(2, 1),
        placed: []
    },
    waterTank:  {
        image: buildingTileset.getTile(0, 2),
        placed: []
    },
    gatherHut:  {
        image: buildingTileset.getTile(1, 2),
        placed: []
    }
}

export const build = {
    setScreen: (screen) => {
        for (const bt in buildButtons) {
            const button = buildButtons[bt];
            screen.add(button.sprite);
        }
    },
    update: (screen) => {
        const mousePos = screen.mouse.getPosition();

        screen.element.style.cursor = '';

        for (const bt in buildButtons) {
            const button = buildButtons[bt];
            if (!button.active) continue;
            const sprite = button.sprite;
            
            if (mousePos.x > sprite.position.x
                && mousePos.y > sprite.position.y
                && mousePos.x < sprite.position.x + sprite.getSize().x
                && mousePos.y < sprite.position.y + sprite.getSize().y
            ) {
                screen.element.style.cursor = 'pointer';
                if (screen.mouse.eventJustHappened('left', true)) {
                    if (button.click) {
                        button.click();
                    }
                }
            }
        }

    },
    draw: () => {

    },
    drawUI: () => {
        for (const bt in buildButtons) {
            const button = buildButtons[bt];
            if (!button.active) continue;
            button.sprite.draw();
        }
    }
}