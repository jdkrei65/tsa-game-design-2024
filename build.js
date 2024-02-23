import { gameify } from './gameify/gameify.js';
import { message } from './message.js';
import { villagers } from './villagers.js';
import { manageModes } from './manageModes.js';
import { levelProgress } from './levelProgress.js';
import { StaticSpacialHashArray } from './spacialHash.js';

let buildModeActive = false;
let currentlyBuilding = false;

const buildingTileset = new gameify.Tileset("images/builditembuttons.png", 32, 32);
const buildingMap = new gameify.Tilemap(64, 64);
buildingMap.setTileset(buildingTileset);
villagers.addNavObstacleMap(buildingMap);
const buildButtonImages = {
    build:              buildingTileset.getTile(0, 0),
    buildActive:        buildingTileset.getTile(1, 0),
    "house":            buildingTileset.getTile(2, 0),
    "forager's hut":    buildingTileset.getTile(0, 1),
    "water tank":       buildingTileset.getTile(1, 1),
    "witch hut":        buildingTileset.getTile(0, 6),
    "farm":             buildingTileset.getTile(1, 7),
    "barn":             buildingTileset.getTile(1, 6),
    "bakery":           buildingTileset.getTile(1, 8),
    "stable":           buildingTileset.getTile(2, 8),
    "tailor":           buildingTileset.getTile(0, 9),
    "__":               buildingTileset.getTile(0, 0),
    demolishBuilding:   buildingTileset.getTile(1, 3),
}

// 2d array [x][y]
const placedBuildings = [];
const collisionTileMaps = [];

const buildings = {
    "house":      {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [12, 12, 40, 46],
        image: buildingTileset.getTile(2, 1),
        cost: { wood: 10, stone: 5 },
        unlocked: true,
    },
    "forager's hut":  {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [10, 8, 46, 46],
        image: buildingTileset.getTile(0, 2),
        cost: { wood: 15 },
        unlocked: true,
    },
    "water tank":  {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [14, 16, 36, 38],
        image: buildingTileset.getTile(1, 2),
        cost: { wood: 5, stone: 5 },
        unlocked: true,
    },
    "farm":  {
        image: buildingTileset.getTile(1, 5, 2, 1),
        cost: { wood: 5, stone: 15, gold: 5 },
        unlocked: false,
    },
    "witch hut":  {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [9, 16, 46, 40],
        image: buildingTileset.getTile(0, 7),
        cost: { wood: 15, stone: 5 },
        unlocked: false,
        onPlace: (position) => {
            villagers.addWitchVillager(position.multiply(buildingMap.twidth));
        }
    },
    "barn":  {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [6, 18, 54, 40],
        image: buildingTileset.getTile(2, 6),
        cost: { wood: 20, stone: 5 },
        unlocked: false,
    },
    "bakery":  {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [6, 18, 54, 40],
        image: buildingTileset.getTile(1, 8),
        cost: { wood: 15, stone: 25 },
        unlocked: false,
    },
    "stable":  {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [6, 18, 54, 40],
        image: buildingTileset.getTile(2, 8),
        cost: { wood: 40, stone: 5, gold: 2 },
        unlocked: false,
    },
    "tailor":  {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [6, 18, 54, 40],
        image: buildingTileset.getTile(0, 9),
        cost: { wood: 10, stone: 10, gold: 10 },
        unlocked: false,
    },
    "__": {
        // dummy building, never unlocked
        image: buildingTileset.getTile(0, 0),
        cost: {},
        unlocked: false,
    },
    demolishBuilding: {
        image: buildingTileset.getTile(1, 3),
        cost: {},
        unlocked: true,
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
const placeBuilding = (buildingName, building, position, player) => {
    const resources = player.resources;

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
        collisionShapes.removeItem(position.multiply(buildingMap.twidth));
        return;
    }

    if (placedBuildings[position.y] && placedBuildings[position.y][position.x]) {
        message.showText(`Cannot place building! There\nis already a buliding here.`);
        return;
    }

    for (const entry of collisionTileMaps) {
        const map = entry.map
        if (map.get(position.x, position.y)) {
            message.showText(entry.message || `Cannot place building!\nThere is an obstacle here.`);
            return;
        }
    }

    // Check if we have enough resources
    const missing = getMissingResources(building, resources);
    if (missing.length !== 0) {
        message.showText(`Cannot place building!\nNot enough resouces.`);
        return;
    }

    let newShape;
    if (building.collisionShape) {
        newShape = new building.collisionShape(...building.collisionArgs)
        newShape.position.x += position.x * buildingMap.twidth;
        newShape.position.y += position.y * buildingMap.twidth;

        if (player.sprite.shape.collidesWith(newShape)) {
            message.showText(`Cannot place building!\nThe player is in the way!`);
            return;
        }

        collisionShapes.addItem(position.multiply(buildingMap.twidth), newShape);
    }
    // call the onPlace function
    if (building.onPlace) building.onPlace(position);

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

    // Mark goals as completed
    levelProgress.completeGoal('build', buildingName);
}

buildButtons['build'].click = () => {
    manageModes.enterMode('build');
}
buildButtons['buildActive'].click = () => {
    exitBuildMode();
}

let buttonHovered = false;
let collisionShapes = undefined; // defined in setScreen (b/c that's after window.OPTION variables are set)

export const build = {
    buildings,
    addBuildObstacleMap: (tileMap, message) => {
        collisionTileMaps.push({map: tileMap, message: message});
    },
    collidesWithMap: (shape) => {
        shape.fillColor = '#00f3';
        return collisionShapes.forEachNearby(shape.position, (result) => {
            const colShape = result.item;
            if (shape.collidesWith(colShape)) {
                shape.fillColor = '#f008';
                colShape.fillColor = '#ff08';
                return true;
            }
        }, true);
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
        collisionShapes = new StaticSpacialHashArray(window.SPACIAL_HASH_SIZE);
    },
    updateUI: (deltaTime, screen, player) => {
        buttonHovered = false;
        buildButtons.demolishBuilding.moved = false;
        const mousePos = screen.mouse.getPosition();

        for (const bt in buildButtons) {
            const button = buildButtons[bt];

            if (!button.active) continue;
            if (buildings[bt]?.unlocked === false) {
                if (!buildButtons.demolishBuilding.moved) {
                    buildButtons.demolishBuilding.moved = true;
                    buildButtons.demolishBuilding.sprite.position.x = buildButtons[bt].sprite.position.x;
                }
                continue;
            }

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

                const missing = getMissingResources(currentBuilding, player.resources);
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
    update: (deltaTime, screen, player) => {
        if (!currentlyBuilding) return;

        const mouseWorldPosition = screen.camera.screenToWorld(screen.mouse.getPosition());
        const mouseMapPosition = buildingMap.screenToMap(mouseWorldPosition);
    
        previewBuildSprite.position = mouseMapPosition.multiply(buildingMap.twidth);

        if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
            placeBuilding(currentlyBuilding, buildings[currentlyBuilding], mouseMapPosition, player);
        }
    },
    draw: (screen, player) => {
        buildingMap.draw();
        if (currentlyBuilding && !buttonHovered) {
            previewBuildSprite.image.opacity = 0.5;
            previewBuildSprite.draw();
            // reset the opacity, since the image is used for other things
            previewBuildSprite.image.opacity = 1;
        }

        if (window.DRAW_SHAPES) collisionShapes.forEachNearby(player.sprite.shape.position, (result) => {
            result.item.draw(screen.context);
        });
    },
    drawUI: () => {
        for (const bt in buildButtons) {
            const button = buildButtons[bt];
            if (!button.active) continue;
            if (buildings[bt]?.unlocked === false) continue;
            button.sprite.draw();
        }

        resourceCostSprite.draw();
        resourceCostText.draw();
    }
}