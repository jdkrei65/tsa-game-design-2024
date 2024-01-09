import { gameify } from './gameify/gameify.js';

let buildModeActive = false;
let currentlyBuilding = false;

const buildingTileset = new gameify.Tileset("images/placeholder5.png", 32, 32);
const buildingMap = new gameify.Tilemap(64, 64);
buildingMap.setTileset(buildingTileset);
const buildButtonImages = {
    build:          buildingTileset.getTile(0, 0),
    buildActive:    buildingTileset.getTile(1, 0),
    house:          buildingTileset.getTile(2, 0),
    gatherHut:      buildingTileset.getTile(0, 1),
    waterTank:      buildingTileset.getTile(1, 1),
}

const buildings = {
    house:      {
        image: buildingTileset.getTile(2, 1),
        placed: []
    },
    gatherHut:  {
        image: buildingTileset.getTile(0, 2),
        placed: []
    },
    waterTank:  {
        image: buildingTileset.getTile(1, 2),
        placed: []
    }
}

const previewBuildSprite = new gameify.Sprite(0, 0, buildings.house.image);
previewBuildSprite.scale = 2;

const buildButtons = [];
let curBtnPosition = 10;
for (const bt in buildButtonImages) {
    const pos = new gameify.Vector2d(curBtnPosition, 10)
    const img = buildButtonImages[bt]
    buildButtons[bt] = {
        sprite: new gameify.Sprite(pos.x, pos.y, img),
        active: (bt === 'build'), // Only set the 'build' (enter build mode) button as active by default
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
    currentlyBuilding = false;
    buildButtons['build'].active = true;
}

buildButtons['build'].click = () => {
    enterBuildMode();
}
buildButtons['buildActive'].click = () => {
    exitBuildMode();
}

let buttonHovered = false;

export const build = {
    setScreen: (screen) => {
        for (const bt in buildButtons) {
            const button = buildButtons[bt];
            screen.add(button.sprite);
        }
        screen.add(previewBuildSprite);
        screen.add(buildingMap);
    },
    update: (screen) => {
        buttonHovered = false;
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
                buttonHovered = true;
                screen.element.style.cursor = 'pointer';
                if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
                    if (button.click) {
                        // It's a different button
                        button.click();
                    } else {
                        // Start building
                        previewBuildSprite.image = buildings[bt].image;
                        currentlyBuilding = bt;
                    }
                }
            }
        }

        if (currentlyBuilding) {
            const mouseWorldPosition = screen.mouse.getPosition();
            const mouseMapPosition = buildingMap.screenToMap(mouseWorldPosition);
        
            previewBuildSprite.position = mouseMapPosition.multiply(buildingMap.twidth);

            if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
                if (!buildingMap.get(mouseMapPosition.x, mouseMapPosition.y)) {
                    // Place the tile
                    buildings[currentlyBuilding].placed.push(mouseMapPosition);
                    const tile = buildings[currentlyBuilding].image.tileData;

                    buildingMap.place(
                        tile.position.x, tile.position.y, // source position
                        mouseMapPosition.x, mouseMapPosition.y, // destination position
                        0, // rotation
                        tile.size.x, tile.size.y // size (how many tiles tall/wide)
                    );

                } else {
                    console.warn('Already placed at ' + mouseMapPosition);
                }
            }
        }

    },
    draw: () => {

    },
    drawUI: (screen) => {
        for (const bt in buildButtons) {
            const button = buildButtons[bt];
            if (!button.active) continue;
            button.sprite.draw();
        }
        buildingMap.draw();
        if (currentlyBuilding && !buttonHovered) {
            screen.context.globalAlpha = 0.5;
            previewBuildSprite.draw();
            screen.context.globalAlpha = 1;
        }
    }
}