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
    plains: {
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
        }
    },
    desert: {
        cactus: {
            collisionShape: gameify.shapes.Rectangle,
            collisionArgs: [21, 40, 22, 25],
            sources: [
                [4, 3],
                [0, 4],
                [0, 5]
            ], // position on tilemap
            resources: {
                gold: 3,
                berries: 4,
            }
        },
        tree: {
            collisionShape: gameify.shapes.Rectangle,
            collisionArgs: [15, 40, 34, 25],
            sources: [
                [3, 4],
                [4, 4],
            ], // position on tilemap
            resources: {
                wood: 12,
                gold: 2
            }
        },
        rock: {
            collisionShape: gameify.shapes.Rectangle,
            collisionArgs: [10, 40, 44, 25],
            sources: [
                [1, 4],
                [2, 4]
            ], // position on tilemap
            resources: {
                stone: 14,
                gold: 7,
            }
        },
    },
    tundra: {
        tree: {
            collisionShape: gameify.shapes.Rectangle,
            collisionArgs: [15, 40, 34, 25],
            sources: [
                [5, 0],
                [0, 1],
            ], // position on tilemap
            resources: {
                wood: 18
            }
        },
        rock: {
            collisionShape: gameify.shapes.Rectangle,
            collisionArgs: [8, 0, 48, 56],
            static: true, // can't be gathered
            sources: [
                [1, 1],
                [2, 1],
                [3, 1],
                [4, 1],
                [5, 1],
                [0, 2],
            ], // position on tilemap
            resources: { /* not gatherable */ }
        },
        cliffLeft: {
            collisionShape: gameify.shapes.Rectangle,
            collisionArgs: [8, 8, 4, 48],
            static: true, // can't be gathered
            sources: [
                [4, 2],
                [5, 2],
                [0, 3],
                [2, 3],
            ], // position on tilemap
            resources: { /* not gatherable */ }
        },
        cliffRight: {
            collisionShape: gameify.shapes.Rectangle,
            collisionArgs: [52, 8, 4, 48],
            static: true, // can't be gathered
            sources: [
                [5, 3],
                [4, 3],
                [3, 3],
            ], // position on tilemap
            resources: { /* not gatherable */ }
        },
        grass: {
            sources: [
                [4, 0]
            ],
            resources: { gold: 1 }
        }
    }
}
let collisionShapes = undefined; // defined in setScreen (b/c that's after window.OPTION variables are set)

const gatherItem = (position, player, mapName) => {
    const resourceMap = resourceMaps[mapName];
    const tile = resourceMap.get(position.x, position.y);
    let gatheredItem = false;
    // check each gatherable item
    gatherableLoop:
    for (const type in gatherables[mapName]) {
        const item = gatherables[mapName][type];
        // don't gather static items;
        if (item.static) continue;
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

let resourceMaps = {};
// do something for all res maps
// callback(resMaps[map], map)
const forAllResMaps = (callback) => {
    for (const map in resourceMaps) {
        callback(resourceMaps[map], map)
    }
}
// Get the first res map
// (for things like screenToMap that are the same for all maps)
// DO NOT ASSUME THIS GIVES ANY SPECIFIC MAP
const firstResMap = () => {
    for (const map in resourceMaps) {
        return resourceMaps[map];
    }
}

export const gather = {
    setScreen: (screen) => {
        screen.add(gatherButton);
        screen.add(previewGatherSprite);
        collisionShapes = new StaticSpacialHashArray(window.SPACIAL_HASH_SIZE);
    },
    addMap: (name, map) => {
        if (resourceMaps[name]){
            console.warn('map ' + name + ' already added to gather. skipping.', name);
            return;
        }
        resourceMaps[name] = map;
        if (!gatherables[name]) {
            console.warn('map ' + name + ' has no gather entries. not using.', name);
        }
        map.listTiles().forEach(tile => {
            for (const type in gatherables[name]) {
                const item = gatherables[name][type];
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
        const playerMapPosition = firstResMap().screenToMap(playerCenterPosition);
        const targetMapPosition = firstResMap().screenToMap(mouseWorldPosition);

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

        previewGatherSprite.position = targetMapPosition.multiply(firstResMap().twidth);

        if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
            forAllResMaps((map, name) => {
                if (map.get(targetMapPosition.x, targetMapPosition.y)) {
                    gatherItem(targetMapPosition, player, name);
                }
            });
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