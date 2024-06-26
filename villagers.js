import { dialogue } from './dialogue.js';
import { gameify } from './gameify/gameify.js';
import { levelProgress } from './levelProgress.js';

const villagerTileset = new gameify.Tileset("images/villagers.png", 32, 48);
const horseTileset = new gameify.Tileset("images/Ostrich_walking_LR2.png", 64, 48);
const foxTileset = new gameify.Tileset("images/fox_anim.png", 48, 50);
const foxRightTileset = new gameify.Tileset("images/fox_anim_right.png", 48, 50);
const boarTileset = new gameify.Tileset("images/boar_anim.png", 48, 50);
const boarRightTileset = new gameify.Tileset("images/boar_anim_right.png", 48, 50);
const sheepTileset = new gameify.Tileset("images/sheep_walking.png", 32, 28);
const sheepRightTileset = new gameify.Tileset("images/sheep_walking_right.png", 32, 28);
const witchImage = villagerTileset.getTile(0, 0);
const villagerManImage = new gameify.Image("images/man_villager.png");
const villagerWomanImage = new gameify.Image("images/woman_villager.png");

const talkPopupImage = new gameify.Image('images/e_talk_popup.png');
const ridePopupImage = new gameify.Image('images/e_ride_popup.png');
const popupSprite = new gameify.Sprite(0, 0, talkPopupImage);
popupSprite.scale = 2;

const default_villager_speed = 15;
const default_animal_speed = 45;
const default_horse_speed = 10;

const worldVillagers = [];

const navMaps = [];

export const villagers = {
    addWitchVillager(home_pos) {
        const witch = {
            id: 'witch_' + Math.floor(Math.random()*1000),
            name: 'Witch',
            speed: default_villager_speed,
            active: true,
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
            homeLocation: home_pos,
            targetedLocation: false,
            canInteract: true,
            closeToPlayer: false,
            sprite: new gameify.Sprite(0, 0, witchImage)
        }
        witch.sprite.position = home_pos.add({x: 16, y: 12});
        worldVillagers.push(witch);

        return witch;
    },
    addGenericVillager(home_pos) {
        const villager = {
            id: 'villager_' + Math.floor(Math.random()*1000),
            name: 'Villager',
            speed: default_villager_speed,
            active: true,
            dialogueNumber: Math.ceil(Math.random()*5),
            onInteract: (self, player) => {
                // 1/4 chance to change dialogue
                if (Math.random()*4 > 3) self.dialogueNumber = Math.ceil(Math.random()*5);

                dialogue.setScene('villager_generic' + self.dialogueNumber, 0, false)
            },
            homeLocation: home_pos,
            targetedLocation: false,
            // 1/4 villagers can be talked to
            canInteract: (Math.random()*4 > 3) ? true : false,
            closeToPlayer: false,
            sprite: new gameify.Sprite(0, 0, (Math.random()*2 > 1) ? villagerManImage : villagerWomanImage)
        }
        villager.sprite.position = home_pos.add({x: 16, y: 12});
        worldVillagers.push(villager);

        return villager;
    },
    addWildlife(home_pos, type) {
        if (!type) {
            const n = Math.random()*3
            if (n < 1) type = 'Fox';
            else if (n < 2) type = 'Boar';
            else type = 'Sheep';
        }
        const villager = {
            id: 'wildlife_' + Math.floor(Math.random()*1000),
            name: type,
            speed: default_animal_speed,
            active: true,
            dialogueNumber: Math.ceil(Math.random()*5),
            onInteract: (self, player) => { },
            homeLocation: home_pos,
            targetedLocation: false,
            // 1/4 villagers can be talked to
            canInteract: false,
            closeToPlayer: false,
            sprite: new gameify.Sprite(0, 0, foxTileset.getTile(0, 0)),
            isAnimated: true,
            wanderDistance: 5000,
            wanderChance: 10,
        }
        if (type == 'Fox') {
            villager.sprite.animator.set('idle', new gameify.Animation([
                { image: { type: 'Image', value: foxTileset.getTile(0, 0) }, }
            ], {duration: 100, loop: true}))
            villager.sprite.animator.set('move', new gameify.Animation([
                { image: { type: 'Image', value: foxTileset.getTile(0, 0) }, },
                { image: { type: 'Image', value: foxTileset.getTile(1, 0) }, },
                { image: { type: 'Image', value: foxTileset.getTile(2, 0) }, },
                { image: { type: 'Image', value: foxTileset.getTile(0, 1) }, },
                { image: { type: 'Image', value: foxTileset.getTile(1, 1) }, },
                { image: { type: 'Image', value: foxTileset.getTile(2, 1) }, },
                { image: { type: 'Image', value: foxTileset.getTile(0, 2) }, },
                { image: { type: 'Image', value: foxTileset.getTile(1, 2) }, }
            ], {duration: 880, loop: true}))
            villager.sprite.animator.set('move_right', new gameify.Animation([
                { image: { type: 'Image', value: foxRightTileset.getTile(0, 0) }, },
                { image: { type: 'Image', value: foxRightTileset.getTile(1, 0) }, },
                { image: { type: 'Image', value: foxRightTileset.getTile(2, 0) }, },
                { image: { type: 'Image', value: foxRightTileset.getTile(0, 1) }, },
                { image: { type: 'Image', value: foxRightTileset.getTile(1, 1) }, },
                { image: { type: 'Image', value: foxRightTileset.getTile(2, 1) }, },
                { image: { type: 'Image', value: foxRightTileset.getTile(0, 2) }, },
                { image: { type: 'Image', value: foxRightTileset.getTile(1, 2) }, }
            ], {duration: 880, loop: true}))

        } else if (type == 'Sheep') {
            villager.sprite.animator.set('idle', new gameify.Animation([
                { image: { type: 'Image', value: sheepTileset.getTile(0, 0) }, }
            ], {duration: 100, loop: true}))
            villager.sprite.animator.set('move', new gameify.Animation([
                { image: { type: 'Image', value: sheepTileset.getTile(0, 0) }, },
                { image: { type: 'Image', value: sheepTileset.getTile(1, 0) }, },
                { image: { type: 'Image', value: sheepTileset.getTile(2, 0) }, },
                { image: { type: 'Image', value: sheepTileset.getTile(3, 0) }, },
                { image: { type: 'Image', value: sheepTileset.getTile(4, 0) }, },
                { image: { type: 'Image', value: sheepTileset.getTile(5, 0) }, },
                { image: { type: 'Image', value: sheepTileset.getTile(6, 0) }, },
                { image: { type: 'Image', value: sheepTileset.getTile(7, 0) }, },
            ], {duration: 770, loop: true}))
            villager.sprite.animator.set('move_right', new gameify.Animation([
                { image: { type: 'Image', value: sheepRightTileset.getTile(0, 0) }, },
                { image: { type: 'Image', value: sheepRightTileset.getTile(1, 0) }, },
                { image: { type: 'Image', value: sheepRightTileset.getTile(2, 0) }, },
                { image: { type: 'Image', value: sheepRightTileset.getTile(3, 0) }, },
                { image: { type: 'Image', value: sheepRightTileset.getTile(4, 0) }, },
                { image: { type: 'Image', value: sheepRightTileset.getTile(5, 0) }, },
                { image: { type: 'Image', value: sheepRightTileset.getTile(6, 0) }, },
                { image: { type: 'Image', value: sheepRightTileset.getTile(7, 0) }, },
            ], {duration: 770, loop: true}))
            
        } else /*if (type == 'Boar')*/ {
            villager.sprite.animator.set('idle', new gameify.Animation([
                { image: { type: 'Image', value: boarTileset.getTile(0, 0) }, }
            ], {duration: 100, loop: true}))
            villager.sprite.animator.set('move', new gameify.Animation([
                { image: { type: 'Image', value: boarTileset.getTile(0, 0) }, },
                { image: { type: 'Image', value: boarTileset.getTile(1, 0) }, },
                { image: { type: 'Image', value: boarTileset.getTile(0, 1) }, },
                { image: { type: 'Image', value: boarTileset.getTile(1, 1) }, }
            ], {duration: 440, loop: true}))
            villager.sprite.animator.set('move_right', new gameify.Animation([
                { image: { type: 'Image', value: boarRightTileset.getTile(0, 0) }, },
                { image: { type: 'Image', value: boarRightTileset.getTile(1, 0) }, },
                { image: { type: 'Image', value: boarRightTileset.getTile(0, 1) }, },
                { image: { type: 'Image', value: boarRightTileset.getTile(1, 1) }, }
            ], {duration: 440, loop: true}))
        }
        villager.sprite.position = home_pos.add({x: 16, y: 12});
        worldVillagers.push(villager);

        return villager;
    },
    addHorse(home_pos) {
        const horse = {
            id: 'horse_' + Math.floor(Math.random()*1000),
            name: 'Ostritch',
            speed: default_horse_speed,
            active: true,
            onInteract: (self, player) => {
                if (!levelProgress.isCompleted('items', 'ride horse')) {
                    // If this is the first time on the horse,
                    // teach them how to use it
                    if (dialogue.setScene('horse_tutorial', 0, false)) {
                        levelProgress.completeGoal('items', 'ride horse');

                        player.on_horse = self;
                        self.active = false;
                        console.log('mount');
                    }
                } else {
                    player.on_horse = self;
                    self.active = false;
                    console.log('mount');
                }

                self.dismountFrames = 1;
            },
            dismount: (self, player) => {
                if (self.dismountFrames > 0) {
                    self.dismountFrames -= 1;
                    return;
                }
                self.sprite.position = player.sprite.position;
                self.active = true;
                player.on_horse = false;
                console.log('dismount');
            }, 
            homeLocation: home_pos,
            targetedLocation: false,
            canInteract: true,
            closeToPlayer: false,
            sprite: new gameify.Sprite(0, 0, horseTileset.getTile(0, 0)),
            popupImage: ridePopupImage,
        }
        horse.sprite.position = home_pos.add({x: 16, y: 12});
        worldVillagers.push(horse);

        return horse;
    },
    removeVillager(villager) {
        const index = worldVillagers.indexOf(villager);
        if (index < 0) {
            console.warn('villager not in list');
            return;
        }
        worldVillagers.splice(index, 1);
    },
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

                if (villager.popupImage) {
                    popupSprite.setImage(villager.popupImage);
                } else {
                    popupSprite.setImage(talkPopupImage);
                }
    
                if (screen.keyboard.keyWasJustPressed('E', /*capture=*/true)) {
                    villager.onInteract(villager, player);
                }
            }

            const maxWanderDistance = villager.wanderDistance || 256; // tiles
            if (!villager.targetedLocation) {
                villager.targetedLocation = navMaps[0].screenToMap(villager.sprite.position)
                                                      .multiply(navMaps[0].twidth)
                                                      .add({x: 16, y: 12});
                const dir = Math.floor(Math.random() * (/*max=*/(villager.wanderChance || 500) + 1)); // 4/500 chance to move
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
                if (villager.targetedLocation.distanceTo(villager.homeLocation) > maxWanderDistance) {
                    problem = true;
                } else if (villager.targetedLocation.distanceTo(villager.homeLocation) > 192 && Math.random()*4 > 1) {
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

            } else if (!villager.closeToPlayer && villager.targetedLocation.distanceTo(villager.sprite.position) > 4) {
                // Don't move when close to the player
                villager.sprite.velocity.x = 0;
                villager.sprite.velocity.y = 0;

                if (Math.abs(villager.targetedLocation.x - villager.sprite.position.x) < 1) {
                    villager.sprite.velocity.x = 0
                } else if (villager.targetedLocation.x > villager.sprite.position.x) {
                    villager.sprite.velocity.x = 1
                } else if (villager.targetedLocation.x < villager.sprite.position.x) {
                    villager.sprite.velocity.x = -1
                }
                if (Math.abs(villager.targetedLocation.y - villager.sprite.position.y) < 1) {
                    villager.sprite.velocity.y = 0
                } else if (villager.targetedLocation.y > villager.sprite.position.y) {
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

            if (villager.isAnimated) {
                if (villager.sprite.velocity.x > 1 || villager.sprite.velocity.y > 1) { // moving right/up
                    villager.sprite.animator.play('move_right');
                } else if (villager.sprite.velocity.x < 1 || villager.sprite.velocity.y < 1) { // moving down/left
                    villager.sprite.animator.play('move');
                } else {
                    villager.sprite.animator.play('idle');
                }
            }
        }

    },
    draw(screen) {
        for (const villager of worldVillagers) {
            if (!villager.active) continue;
            if (!villager.sprite.parent) screen.add(villager.sprite);
            villager.sprite.draw();
            if (villager.closeToPlayer) {
                popupSprite.draw();
            }
        }
    }    
}


villagers.addWildlife(new gameify.Vector2d(-1*64, -1*64));
villagers.addWildlife(new gameify.Vector2d(-10*64, 4*64));
villagers.addWildlife(new gameify.Vector2d(-19*64, 6*64));
villagers.addWildlife(new gameify.Vector2d(-29*64, 1*64));
villagers.addWildlife(new gameify.Vector2d(-26*64, -15*64));
villagers.addWildlife(new gameify.Vector2d(-7*64, -15*64));
villagers.addWildlife(new gameify.Vector2d(1*64, -8*64));
villagers.addWildlife(new gameify.Vector2d(19*64, -10*64));
villagers.addWildlife(new gameify.Vector2d(28*64, 8*64));
villagers.addWildlife(new gameify.Vector2d(22*64, 20*64));
villagers.addWildlife(new gameify.Vector2d(13*64, 20*64));
villagers.addWildlife(new gameify.Vector2d(38*64, -8*64));
villagers.addWildlife(new gameify.Vector2d(37*64, -13*64));
villagers.addWildlife(new gameify.Vector2d(6*64, -23*64));