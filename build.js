import { gameify } from './gameify/gameify.js';
import { message } from './message.js';
import { manageModes } from './manageModes.js';

let buildModeActive = false;
let currentlyBuilding = false;

const buildingTileset = new gameify.Tileset("images/builditembuttons.png", 32, 32);
const buildingMap = new gameify.Tilemap(64, 64);
buildingMap.setTileset(buildingTileset);
const buildButtonImages = {
    build:            buildingTileset.getTile(0, 0),
    buildActive:      buildingTileset.getTile(1, 0),
    "house":          buildingTileset.getTile(2, 0),
    "forager's hut":  buildingTileset.getTile(0, 1),
    "water tank":     buildingTileset.getTile(1, 1),
    demolishBuilding: buildingTileset.getTile(1, 3),
}

// 2d array [x][y]
const placedBuildings = [];
const collisionTileMaps = [];

const buildings = {
    "house":      {
        image: buildingTileset.getTile(2, 1),
        cost: { wood: 10, stone: 10 }
    },
    "forager's hut":  {
        image: buildingTileset.getTile(0, 2),
        cost: { wood: 15 }
    },
    "water tank":  {
        image: buildingTileset.getTile(1, 2),
        cost: { wood: 5, stone: 5 }
    },
    demolishBuilding: {
        image: buildingTileset.getTile(1, 3),
        cost: {}
    }
}

// Resource cost display
const resourceCostImage = new gameify.Image("images/bulidCostBox.png");
resourceCostImage.opacity = 0;
const resourceCostSprite = new gameify.Sprite(68, 68, resourceCostImage);
const resourceCostTextStyle = new gameify.TextStyle('DefaultFont', 16, 'black');
resourceCostTextStyle.opacity = 0;
resourceCostTextStyle.lineHeight = 1.25;
const resourceCostText = new gameify.Text('Resource Cost', 58+24, 78, resourceCostTextStyle);
resourceCostSprite.scale = 1.5;
const previewBuildSprite = new gameify.Sprite(0, 0, buildings["house"].image);
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
manageModes.addMode('build', enterBuildMode, exitBuildMode);

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

    if (building === buildings.demolishBuilding) {
        if (!placedBuildings[position.y] || !placedBuildings[position.y][position.x]) {
            console.warn('Nothing to demolish at ' + position);
            return;
        }

        // refund the cost of the building
        for (const res in placedBuildings[position.y][position.x].cost) {
            resources[res] += placedBuildings[position.y][position.x].cost[res];
        }

        placedBuildings[position.y][position.x] = undefined;
        buildingMap.remove(position.x, position.y);
        return;
    }

    if (placedBuildings[position.y] && placedBuildings[position.y][position.x]) {
        message.showText(`Cannot place building! There\nis already a buliding here.`);
        return;
    }

    for (const map of collisionTileMaps) {
        if (map.get(position.x, position.y)) {
            message.showText(`Cannot place building!\nThere is an obstacle here.`);
            return;
        }
    }

    // Check if we have enough resources
    const missing = getMissingResources(building, resources);
    if (missing.length !== 0) {
        message.showText(`Cannot place building!\nNot enough resouces.`);
        return;
    }

    // Then, actually deduct the cost
    for (const res in building.cost) {
        resources[res] -= building.cost[res];
    }

    // Place the tile
    placedBuildings[position.y] = placedBuildings[position.y] || [];
    placedBuildings[position.y][position.x] = building;
    const tile = building.image.tileData;

    buildingMap.place(
        tile.position.x, tile.position.y, // source position
        position.x, position.y, // destination position
        0, // rotation
        tile.size.x, tile.size.y // size (how many tiles tall/wide)
    );
}

buildButtons['build'].click = () => {
    manageModes.enterMode('build');
}
buildButtons['buildActive'].click = () => {
    exitBuildMode();
}

let buttonHovered = false;

export const build = {
    collideWithMap: (tileMap) => {
        collisionTileMaps.push(tileMap);
    },
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
                placeBuilding(buildings[currentlyBuilding], mouseMapPosition, resources);
            }
        }

        // Draw cost if build mode is enabled,
        // AND if the player is either building something,
        // or just hovering a button
        let currentBuilding = buildings[buttonHovered];
        let buildingName = buttonHovered;
        if (!currentBuilding) {
            currentBuilding = buildings[currentlyBuilding];
            buildingName = currentlyBuilding;
        }
        if (buildModeActive && currentBuilding) {
            
            if (currentBuilding) {
                const opacity = Math.min(1, resourceCostText.style.opacity + deltaTime / 200);
                resourceCostText.style.opacity = opacity;
                resourceCostSprite.image.opacity = opacity;

                const missing = getMissingResources(currentBuilding, resources);
                const cost = currentBuilding.cost;
// Indentation matters for text strings
                resourceCostText.string = `Build ${buildingName}:
   ${cost.wood  || 0} wood  ${missing.includes('wood') ? '(missing)' : ''}
   ${cost.stone || 0} stone ${missing.includes('stone') ? '(missing)' : ''}
   ${cost.gold  || 0} gold  ${missing.includes('gold') ? '(missing)' : ''}`;
                if (currentBuilding === buildings.demolishBuilding) {
                    resourceCostText.string = `Demolish buliding
      (refunds entire
      cost of building)`;
                }
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
    drawUI: () => {
        for (const bt in buildButtons) {
            const button = buildButtons[bt];
            if (!button.active) continue;
            button.sprite.draw();
        }

        resourceCostSprite.draw();
        resourceCostText.draw();
    }
}