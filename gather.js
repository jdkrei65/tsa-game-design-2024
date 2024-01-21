import { gameify } from './gameify/gameify.js';
import { manageModes } from './manageModes.js';
import { message } from './message.js';
import { StaticSpacialHashArray } from './spacialHash.js';

const buildingTileset = new gameify.Tileset("images/builditembuttons.png", 32, 32);

const gatherButtonImage = buildingTileset.getTile(2, 3);
const gatherButtonActiveImage = buildingTileset.getTile(0, 4);
const gatherButton = new gameify.Sprite(10, 68, gatherButtonImage);
gatherButton.scale = 1.5;

const previewGatherSprite = new gameify.Sprite(0, 0, buildingTileset.getTile(2, 3)); // new copy of tile for opacity
previewGatherSprite.image.opacity = 0.5;
previewGatherSprite.scale = 2;

let gatherModeActive = false;

const enterGatherMode = () => {
    gatherButton.setImage(gatherButtonActiveImage);
    gatherModeActive = true;
}
const exitGatherMode = () => {
    gatherButton.setImage(gatherButtonImage);
    gatherModeActive = false;
}
manageModes.addMode('gather', enterGatherMode, exitGatherMode);

const gatherables = {
    tree: {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [15, 40, 34, 25],
        sources: [
            [3, 4],
            [5, 4],
            [0, 5],
        ], // position on tilemap
        resources: {
            wood: 6
        }
    },
    appleTree: {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [15, 40, 34, 25],
        sources: [
            [4, 4]
        ],
        resources: {
            wood: 6,
            apples: 3
        }
    },
    bush: {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [10, 40, 44, 25],
        sources: [
            [1, 4],
            [2, 4]
        ], // position on tilemap
        resources: {
            wood: 3,
            apples: 2
        }
    },
    flower: {
        sources: [
            [1, 3],
            [2, 3]
        ], // position on tilemap
        resources: {
            gold: 2
        }
    },
    rock: {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [8, 42, 48, 20],
        sources: [
            [3, 3],
            [4, 3]
        ],
        resources: {
            stone: 7
        }
    },
    largeRock: {
        collisionShape: gameify.shapes.Rectangle,
        collisionArgs: [10, 40, 44, 25],
        //collisionShape: gameify.shapes.Circle,
        //collisionArgs: [32, 41, 25],
        sources: [
            [5, 3]
        ],
        resources: {
            stone: 14,
            gold: 1
        }
    },
    grass: {
        sources: [
            [0, 4]
        ],
        resources: { /* Nothing */ }
    },
}
let collisionShapes = undefined; // defined in setScreen (b/c that's after window.OPTION variables are set)

const gatherItem = (position, player) => {
    const tile = resourceMap.get(position.x, position.y);
    let gatheredItem = false;
    // check each gatherable item
    gatherableLoop:
    for (const type in gatherables) {
        const item = gatherables[type];
        // Check each possible position
        for (const source of item.sources) {
            if (source[0] === tile.source.x && source[1] === tile.source.y) {
                // Gather this item
                // Add resources
                for (const res in item.resources) {
                    player.resources[res] += item.resources[res];
                }
                // Remove from map
                resourceMap.remove(position.x, position.y);
                collisionShapes.removeItem(position.multiply(resourceMap.twidth));

                gatheredItem = true;
                break gatherableLoop;
            }
        }
    }

    if (!gatheredItem) {
        message.showText(`You can't gather this item!`);
    }
}

let resourceMap;

export const gather = {
    setScreen: (screen) => {
        screen.add(gatherButton);
        screen.add(previewGatherSprite);
        collisionShapes = new StaticSpacialHashArray(window.SPACIAL_HASH_SIZE);
    },
    setMap: (map) => {
        resourceMap = map;
        map.listTiles().forEach(tile => {
            for (const type in gatherables) {
                const item = gatherables[type];
                if (!item.collisionShape) continue;
                // Check each possible position
                for (const source of item.sources) {
                    if (source[0] === tile.source.x && source[1] === tile.source.y) {
                        const newShape = new item.collisionShape(...item.collisionArgs)
                        newShape.position.x += tile.position.x * map.twidth;
                        newShape.position.y += tile.position.y * map.twidth;
                        collisionShapes.addItem(tile.position.multiply(map.twidth), newShape);
                    }
                }
            }
        });
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
    updateUI: (deltaTime, screen, player) => {
        const mousePos = screen.mouse.getPosition();
        if (mousePos.x > gatherButton.position.x
            && mousePos.y > gatherButton.position.y
            && mousePos.x < gatherButton.position.x + gatherButton.getSize().x
            && mousePos.y < gatherButton.position.y + gatherButton.getSize().y
        ) {
            screen.element.style.cursor = 'pointer';

            if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
                if (gatherModeActive) exitGatherMode();
                else manageModes.enterMode('gather');
            }

        }
    },
    update: (deltaTime, screen, player) => {
        if (!gatherModeActive) return;

        const mouseWorldPosition = screen.camera.screenToWorld(screen.mouse.getPosition());
        const playerCenterPosition = player.sprite.position.add(
            player.sprite.getSize().multiply(.5)
        );
        const playerMapPosition = resourceMap.screenToMap(playerCenterPosition);
        const targetMapPosition = resourceMap.screenToMap(mouseWorldPosition);

        // Change this variable to set how far away the
        // player can gather from
        const maxReachDistance = 2;


        // Snap to nearest gatherable tile
        if (playerMapPosition.y - targetMapPosition.y > maxReachDistance) {
            targetMapPosition.y = playerMapPosition.y - maxReachDistance;
        } else if (playerMapPosition.y - targetMapPosition.y < -maxReachDistance) {
            targetMapPosition.y = playerMapPosition.y + maxReachDistance;
        }
        
        if (playerMapPosition.x - targetMapPosition.x > maxReachDistance) {
            targetMapPosition.x = playerMapPosition.x - maxReachDistance;
        } else if (playerMapPosition.x - targetMapPosition.x < -maxReachDistance) {
            targetMapPosition.x = playerMapPosition.x + maxReachDistance;
        }

        previewGatherSprite.position = targetMapPosition.multiply(resourceMap.twidth);

        if (screen.mouse.eventJustHappened('left', /*capture=*/true)
            && resourceMap.get(targetMapPosition.x, targetMapPosition.y)
        ) {
            gatherItem(targetMapPosition, player);
        }
    },
    draw: (screen, player) => {
        if (gatherModeActive) {
            previewGatherSprite.draw();
        }

        if (window.DRAW_SHAPES) collisionShapes.forEachNearby(player.sprite.shape.position, (result) => {
            result.item.draw(screen.context);
        });
    },
    drawUI: () => {
        gatherButton.draw();
    }
}