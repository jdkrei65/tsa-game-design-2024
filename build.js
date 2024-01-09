import { gameify } from './gameify/gameify.js';

let buildModeActive = false;
let currentlyBuilding = false;

const buildingTileset = new gameify.Tileset("images/placeholder5.png", 32, 32);
const buildingMap = new gameify.Tilemap(64, 64);
buildingMap.setTileset(buildingTileset);
const buildButtonImages = {
    build:          buildingTileset.getTile(0, 0),
    buildActive:    buildingTileset.getTile(1, 0),
    "House":          buildingTileset.getTile(2, 0),
    "Gatherer's Hut":      buildingTileset.getTile(0, 1),
    "Water Tank":      buildingTileset.getTile(1, 1),
}

const buildings = {
    "House":      {
        image: buildingTileset.getTile(2, 1),
        cost: { wood: 10, stone: 10 },
        placed: []
    },
    "Gatherer's Hut":  {
        image: buildingTileset.getTile(0, 2),
        cost: { wood: 15 },
        placed: []
    },
    "Water Tank":  {
        image: buildingTileset.getTile(1, 2),
        cost: { wood: 5, stone: 5 },
        placed: []
    }
}

const resourceCostImage = new gameify.Image("images/bulidCostBox.png");
resourceCostImage.opacity = 0;
const resourceCostSprite = new gameify.Sprite(10, 68, resourceCostImage);
const resourceCostTextStyle = new gameify.TextStyle('Arial', 16, 'black');
resourceCostTextStyle.opacity = 0;
resourceCostTextStyle.lineHeight = 1.25;
const resourceCostText = new gameify.Text('Resource Cost', 20, 78, resourceCostTextStyle);
resourceCostSprite.scale = 1.5;
const previewBuildSprite = new gameify.Sprite(0, 0, buildings["House"].image);
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
const getMissingResources = (building, resources) => {
    const missing = [];
    for (const res in building.cost) {
        if (resources[res] < building.cost[res]) {
            missing.push(res);
        }
    }
    return missing;
}
const placeBuilding = (building, position, resources) => {
    // Check if we have enough resources
    if (getMissingResources(building, resources).length !== 0) {
        return;
    }

    // Then, actually deduct the cost
    for (const res in building.cost) {
        resources[res] -= building.cost[res];
    }

    // Place the tile
    building.placed.push(position);
    const tile = building.image.tileData;

    buildingMap.place(
        tile.position.x, tile.position.y, // source position
        position.x, position.y, // destination position
        0, // rotation
        tile.size.x, tile.size.y // size (how many tiles tall/wide)
    );
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
        screen.add(resourceCostSprite);
        screen.add(resourceCostText);
    },
    update: (deltaTime, screen, resources) => {
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
                buttonHovered = bt;
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
            const mouseWorldPosition = screen.camera.screenToWorld(screen.mouse.getPosition());
            const mouseMapPosition = buildingMap.screenToMap(mouseWorldPosition);
        
            previewBuildSprite.position = mouseMapPosition.multiply(buildingMap.twidth);

            if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
                if (!buildingMap.get(mouseMapPosition.x, mouseMapPosition.y)) {

                    placeBuilding(buildings[currentlyBuilding], mouseMapPosition, resources);

                } else {
                    console.warn('Already placed at ' + mouseMapPosition);
                }
            }
        }

        // Draw cost if build mode is enabled,
        // AND if the player is either building something,
        // or just hovering a button
        if (buildModeActive && (currentlyBuilding || buttonHovered)) {
            let building = buildings[buttonHovered];
            let buildingName = buttonHovered;
            if (!building) {
                building = buildings[currentlyBuilding];
                buildingName = currentlyBuilding;
            }
            if (building) {
                const opacity = Math.min(1, resourceCostText.style.opacity + deltaTime / 200);
                resourceCostText.style.opacity = opacity;
                resourceCostSprite.image.opacity = opacity;

                const missing = getMissingResources(building, resources);
                const cost = building.cost;
// Indentation matters for text strings
                resourceCostText.string = `Cost of ${buildingName}:
    ${cost.wood  || 0} wood  ${missing.includes('wood') ? '(missing)' : ''}
    ${cost.stone || 0} stone ${missing.includes('stone') ? '(missing)' : ''}
    ${cost.gold  || 0} gold  ${missing.includes('gold') ? '(missing)' : ''}`;
            }
        } else {
            // fade the box out
            const opacity = Math.max(0.01, resourceCostText.style.opacity - deltaTime / 200);
            resourceCostText.style.opacity = opacity;
            resourceCostSprite.image.opacity = opacity;
        }

    },
    draw: () => {
        buildingMap.draw();
        if (currentlyBuilding && !buttonHovered) {
            previewBuildSprite.image.opacity = 0.5;
            previewBuildSprite.draw();
            // reset the opacity, since the image is used for other things
            previewBuildSprite.image.opacity = 1;
        }

    },
    drawUI: (screen) => {
        for (const bt in buildButtons) {
            const button = buildButtons[bt];
            if (!button.active) continue;
            button.sprite.draw();
        }

        resourceCostSprite.draw();
        resourceCostText.draw();
    }
}