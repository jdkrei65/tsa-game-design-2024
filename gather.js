import { gameify } from './gameify/gameify.js';
import { manageModes } from './manageModes.js';
import { message } from './message.js';

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
        sources: [
            [4, 4]
        ],
        resources: {
            wood: 6,
            apples: 3
        }
    },
    bush: {
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
        sources: [
            [3, 3],
            [4, 3]
        ],
        resources: {
            stone: 5
        }
    },
    largeRock: {
        sources: [
            [5, 3]
        ],
        resources: {
            stone: 10
        }
    },
    grass: {
        sources: [
            [0, 4]
        ],
        resources: { /* Nothing */ }
    },
}

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
    },
    setMap: (map) => {
        resourceMap = map;
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
    draw: () => {
        if (gatherModeActive) {
            previewGatherSprite.draw();
        }
    },
    drawUI: () => {
        gatherButton.draw();
    }
}