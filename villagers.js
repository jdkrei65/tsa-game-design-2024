import { dialogue } from './dialogue.js';
import { gameify } from './gameify/gameify.js';
import { levelProgress } from './levelProgress.js';

const villagerTileset = new gameify.Tileset("images/villagers.png", 32, 32);
const witchImage = villagerTileset.getTile(0, 0);

const popupImage = new gameify.Image('images/e_talk_popup.png');
const popupSprite = new gameify.Sprite(0, 0, popupImage);
popupSprite.scale = 2;

const default_villager_speed = 30;

const worldVillagers = [{
    name: 'witch',
    speed: default_villager_speed,
    active: false,
    onInteract: (self, player) => {
        if (!levelProgress.isCompleted('items', 'endless flask')) {
            // if player hasn't gotten the flask
            // try to talk to the witch, then give the player the flask
            if (dialogue.setScene('witch_desert', 0, false)) {
                levelProgress.completeGoal('items', 'endless flask');
            }
        
        } else if (levelProgress.isCompleted('map', 'desert')
            && !levelProgress.isCompleted('items', 'fur coat')
            && !levelProgress.isCompleted('dialogue', 'witch_tundra_1')
        ) {
            // If the player has already gone to the desert
            // If the player hasn't gotten the coat,
            // and hasn't done this dialogue yet
            dialogue.setScene('witch_tundra_1', 0, false);
        } else if (!levelProgress.isCompleted('items', 'fur coat')
            && levelProgress.isCompleted('dialogue', 'witch_tundra_1')
        ) {
            // Player talked once, but doesn't have the coat
            if (player.resources.gold > 10 && player.resources.berries > 10) {
                if (dialogue.setScene('witch_tundra_coat', 0, false)) {
                    player.resources.gold -= 10;
                    player.resources.berries -= 10;
                    levelProgress.completeGoal('items', 'fur coat');
                }
            } else {
                dialogue.setScene('witch_tundra_cost', 0, false)
            }
        } else if (!levelProgress.isCompleted('map', 'desert')) {
            dialogue.setScene('witch_desert_2', 0, false)
        }
    },
    homeLocation: new gameify.Vector2d(0, 0),
    targetedLocation: false,
    canInteract: true,
    closeToPlayer: false,
    sprite: new gameify.Sprite(0, 0, witchImage)
}];

const navMaps = [];

export const villagers = {
    addNavObstacleMap(map) {
        navMaps.push(map);
    },
    getVillager(name) {
        for (const villager of worldVillagers) {
            if (villager.name === name) return villager;
        }
        return false;
    },
    setScreen(screen) {
        for (const villager of worldVillagers) {
            screen.add(villager.sprite);
        }
        screen.add(popupSprite);
    },
    update(deltaTime, screen, player) {
        for (const villager of worldVillagers) {
            if (!villager.active) continue;

            if (villager.update) villager.update(villager);

            villager.closeToPlayer = false;
            if (villager.canInteract && player.sprite.position.distanceTo(villager.sprite.position) < 64) {
                villager.closeToPlayer = true;
                popupSprite.position = villager.sprite.position.copy();
                popupSprite.position.y -= 38;
                popupSprite.position.x -= 32;
    
                if (screen.keyboard.keyWasJustPressed('E')) {
                    villager.onInteract(villager, player);
                }
            }

            if (!villager.targetedLocation) {
                villager.targetedLocation = villager.sprite.position.copy();
                const dir = Math.floor(Math.random() * (/*max=*/100 + 1)); // 4/100 chance to move
                if (dir === 0) {
                    villager.targetedLocation.y -= 64;
                } else if (dir === 1) {
                    villager.targetedLocation.y += 64;
                } else if (dir === 3) {
                    villager.targetedLocation.x -= 64;
                } else if (dir === 4) {
                    villager.targetedLocation.x += 64;
                }

                let problem = false;
                if (villager.targetedLocation.distanceTo(villager.homeLocation) > 256) {
                    problem = true;
                } else {
                    const pos = navMaps[0].screenToMap(villager.targetedLocation);
                    for (const map of navMaps) {
                        if (map.get(pos.x, pos.y)) {
                            // can't go there
                            problem = true;
                            break;
                        }
                    }
                }

                if (problem) villager.targetedLocation = false;

            } else if (!villager.closeToPlayer && villager.targetedLocation.distanceTo(villager.sprite.position) > 16) {
                // Don't move when close to the player
                villager.sprite.velocity.x = 0;
                villager.sprite.velocity.y = 0;
                if (villager.targetedLocation.x > villager.sprite.position.x) {
                    villager.sprite.velocity.x = 1
                } else if (villager.targetedLocation.x < villager.sprite.position.x) {
                    villager.sprite.velocity.x = -1
                }
                if (villager.targetedLocation.y > villager.sprite.position.y) {
                    villager.sprite.velocity.y = 1
                } else if (villager.targetedLocation.y < villager.sprite.position.y) {
                    villager.sprite.velocity.y = -1
                }

                villager.sprite.velocity.normalize();
                villager.sprite.velocity = villager.sprite.velocity.multiply(villager.speed);
                villager.sprite.update(deltaTime);
            } else {
                villager.targetedLocation = false;
            }
        }

    },
    draw() {
        for (const villager of worldVillagers) {
            if (!villager.active) continue;
            villager.sprite.draw();
            if (villager.closeToPlayer) {
                popupSprite.draw();
            }
        }
    }    
}
