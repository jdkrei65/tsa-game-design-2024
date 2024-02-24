import { gameify } from './gameify/gameify.js';
import { dialogue } from './dialogue.js';
import { build } from './build.js';
import { message } from './message.js';
import { gather } from './gather.js';
import { levelProgress } from './levelProgress.js';
import { signs } from './signs.js';
import { menu } from './menu.js';
import { inputbox } from './inputbox.js';
import { villagers } from './villagers.js';
import { manageModes } from './manageModes.js';
import { worldBorder } from './worldBorder.js';
import { StaticSpacialHashArray } from './spacialHash.js';

import map_PlainsGrassLayer  from './mapdata/plains/PlainsGrassLayer.tilemapdata.js';
import map_PlainsObjectLayer from './mapdata/plains/PlainsObjectLayer.tilemapdata.js';
import map_PlainsOceanLayer  from './mapdata/plains/PlainsOceanLayer.tilemapdata.js';
import map_PlainsPathLayer   from './mapdata/plains/PlainsPathLayer.tilemapdata.js';

// TODO WITH DESERT MAP
// - don't allow building in the desert ( add a proper error message )
// - make gathering work in the desert
// - dehydration
// - desert music
// - COLLISIONS
import map_DesertGrassLayer  from './mapdata/desert/DesertGrassLayer.tilemapdata.js';
import map_DesertObjectLayer from './mapdata/desert/DesertObjectLayer.tilemapdata.js';
import map_DesertOceanLayer  from './mapdata/desert/DesertOceanLayer.tilemapdata.js';
import map_DesertPathLayer   from './mapdata/desert/DesertPathLayer.tilemapdata.js';

import map_TundraGrassLayer  from './mapdata/tundra/TundraGrassLayer.tilemapdata.js';
import map_TundraObjectLayer from './mapdata/tundra/TundraObjectLayer.tilemapdata.js';
import map_TundraOceanLayer  from './mapdata/tundra/TundraOceanLayer.tilemapdata.js';
import map_TundraPathLayer   from './mapdata/tundra/TundraPathLayer.tilemapdata.js';

import map_BorderLayer  from './mapdata/BorderLayer.tilemapdata.js';

// debug options
window.DRAW_SHAPES          = false;    // default false
window.DISPLAY_FRAME_TIME   = false;    // default false
window.DRAW_WORLD_BORDER    = false;    // default false
// other options
window.RESIZE_CANVAS        = 'always'; // 'always', 'stepped', or 'never'
window.COLLISIONS_ENABLED   = true;     // default true
window.SPACIAL_HASH_SIZE    = 96;       // default 128 (2x2 tiles)
window.TEST_OPTIMIZATION_ENABLED = false; // default false
window.PLAYER_SPEED_BONUS   = 1;        // default 1, for no bonus

window.onerror = onerror = (event, source, lineno, colno, error) => {
    document.querySelector('#err').innerHTML += `
        ERROR: ${error}
        <br>
        AT: ${source} ${lineno}:${colno}
        <hr>
    `;
}
(function (oldLog) {
    console.log = (...args) => {
        document.querySelector('#err').innerHTML += `
            LOG: ${args}
            <hr>
        `;
        oldLog(...args);
    }
})(console.log)

// don't change these
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const canvasElement = document.querySelector('#game-canvas');
const screen = new gameify.Screen(canvasElement, SCREEN_WIDTH, SCREEN_HEIGHT);
screen.setAntialiasing(false);
screen.audio.setVolume(localStorage.getItem('volume') ?? .1);
window.CHANGE_VOLUME_FUNC = (volume) => {
    localStorage.setItem('volume', Number(volume));
    screen.audio.setVolume(Number(volume));
}

const rs = (evt) => {
    const margin = 32;

    let height = window.innerHeight - margin //Math.floor((window.innerHeight-margin)/300)*300;
    let width = window.innerWidth - margin //Math.floor((window.innerWidth-margin)/400)*400;

    if (window.RESIZE_CANVAS === 'stepped') {
        height = Math.floor((window.innerHeight-margin)/300)*300;
        width = Math.floor((window.innerWidth-margin)/400)*400;
    }
    if (window.RESIZE_CANVAS === 'never' || window.innerHeight < 300+margin || window.innerWidth < 400+margin) {
        canvasElement.style.height = 'unset';
        canvasElement.style.width = 'unset';
        return;
    }
    
    const windowRatio = window.innerWidth/window.innerHeight;
    const screenRatio = screen.width/screen.height

    if (windowRatio > screenRatio) {
        width = (height*screenRatio);
    } else {
        height = (width/screenRatio);
    }
    canvasElement.style.height = height + 'px';
    canvasElement.style.width = width + 'px';
}
window.onresize = rs; rs();

// Init imported things
dialogue.setScreen(screen);
dialogue.setScene('tutorial');
villagers.setScreen(screen);
build.setScreen(screen);
message.setScreen(screen);
signs.setScreen(screen);
gather.setScreen(screen);
inputbox.setScreen(screen);
levelProgress.setScreen(screen);
manageModes.setScreen(screen);

//Main Character
const womanVillagerTilesheet = new gameify.Tileset('images/woman_animated_sprite_full.png', 32, 48);
const player = {
    sprite: new gameify.Sprite(300, 200, womanVillagerTilesheet.getTile(0, 3)),
    direction: new gameify.Vector2d(1, 0),
    walk_speed: 90, // px per s
    sprint_speed: 150,
    speed: 90, // default to waking speed, this is overwritten anyway
    resources: {
        wood: 0,
        stone: 0,
        apples: 0,
        berries: 0,
        gold: 10
    }
};
window.PLAYER = player;
window.LOG_PLAYER_POS_FUNC = () => {
    console.log(player.sprite.position, mapLayers.plains.grass.screenToMap(player.sprite.position));
}
window.TP_TO = (x, y) => {
    player.sprite.position.x = x;
    player.sprite.position.y = y;
}
player.sprite.setShape(new gameify.shapes.Circle(0, 0, 10), 16, 32);
//player.sprite.setShape(new gameify.shapes.Rectangle(0, 0, 28, 22), 14, 28);
player.sprite.scale = 1;
screen.add(player.sprite);

screen.camera.setSpeed(0.002);
screen.camera.maxDistance = 55;
screen.camera.minDistance = 30;

// create map layers
const plainsMapTileset = new gameify.Tileset('images/plains_tileset.png', 32, 32);
const desertMapTileset = new gameify.Tileset('images/desert_tileset.png', 32, 32);
const tundraMapTileset = new gameify.Tileset('images/tundra_tileset.png', 32, 32);
const borderMapTileset = new gameify.Tileset('images/border_tileset.png', 32, 32);
const tilemapSize = 64;
const mapLayers = {
    plains: {
        ocean: new gameify.Tilemap(tilemapSize, tilemapSize),
        grass: new gameify.Tilemap(tilemapSize, tilemapSize),
        nature: new gameify.Tilemap(tilemapSize, tilemapSize),
        path: new gameify.Tilemap(tilemapSize, tilemapSize),
    },
    desert: {
        ocean: new gameify.Tilemap(tilemapSize, tilemapSize),
        grass: new gameify.Tilemap(tilemapSize, tilemapSize),
        nature: new gameify.Tilemap(tilemapSize, tilemapSize),
        path: new gameify.Tilemap(tilemapSize, tilemapSize),
    },
    tundra: {
        ocean: new gameify.Tilemap(tilemapSize, tilemapSize),
        grass: new gameify.Tilemap(tilemapSize, tilemapSize),
        nature: new gameify.Tilemap(tilemapSize, tilemapSize),
        path: new gameify.Tilemap(tilemapSize, tilemapSize),
    },
    border: new gameify.Tilemap(tilemapSize, tilemapSize),
    // Do something a one layer from every area
    // callback(mapLayers[area][layer], area)
    forAllAreas: (layer, callback) => {
        for (const area in mapLayers) {
            if (mapLayers[area][layer]) {
                callback(mapLayers[area][layer], area);
            }
        }
    },
    // Do something to all layers
    forAllLayers: (callback) => {
        // assume all biomes have the same layers, use plains as reference
        for (const layerName in mapLayers.plains) {
            mapLayers.forAllAreas(layerName, (layer) => callback(layer));
            callback(mapLayers.border);
        }
    },
    // Do something to all layers in an area
    forAllLayersInArea: (area, callback) => {
        for (const layer in mapLayers[area]) {
            callback(mapLayers[area][layer]);
        }
    }
};

const mapData = {
    ocean: {
        collisionShapes: new StaticSpacialHashArray(window.SPACIAL_HASH_SIZE), // 1.5x1.5 tile chunks
        collidesWithMap: (shape) => {
            shape.fillColor = '#00f3';
            return mapData.ocean.collisionShapes.forEachNearby(shape.position, (result) => {
                const oceanShape = result.item;
                if (shape.collidesWith(oceanShape)) {
                    shape.fillColor = '#f008';
                    oceanShape.fillColor = '#ff08';
                    return true;
                }
            }, true);
        },
        drawShapes: () => {
            mapData.ocean.collisionShapes.forEachNearby(player.sprite.shape.position, (result) => {
                result.item.draw(screen.context);
            });
        }
    }
}

// Assign tilesets to all layers
mapLayers.forAllLayersInArea('plains', (layer) => {
    layer.setTileset(plainsMapTileset);
    screen.add(layer);
});
mapLayers.forAllLayersInArea('desert', (layer) => {
    layer.setTileset(desertMapTileset);
    screen.add(layer);
});
mapLayers.forAllLayersInArea('tundra', (layer) => {
    layer.setTileset(tundraMapTileset);
    screen.add(layer);
});
mapLayers.border.setTileset(borderMapTileset);
screen.add(mapLayers.border);

// plains map layers
mapLayers.plains.grass.loadMapData(map_PlainsGrassLayer);
mapLayers.plains.nature.loadMapData(map_PlainsObjectLayer);
mapLayers.plains.ocean.loadMapData(map_PlainsOceanLayer);
mapLayers.plains.path.loadMapData(map_PlainsPathLayer);
// desert map layers
mapLayers.desert.grass.loadMapData(map_DesertGrassLayer);
mapLayers.desert.nature.loadMapData(map_DesertObjectLayer);
mapLayers.desert.ocean.loadMapData(map_DesertOceanLayer);
mapLayers.desert.path.loadMapData(map_DesertPathLayer);
// tundra map layers
mapLayers.tundra.grass.loadMapData(map_TundraGrassLayer);
mapLayers.tundra.nature.loadMapData(map_TundraObjectLayer);
mapLayers.tundra.ocean.loadMapData(map_TundraOceanLayer);
mapLayers.tundra.path.loadMapData(map_TundraPathLayer);

// border map layer
mapLayers.border.loadMapData(map_BorderLayer);
worldBorder.setMap(mapLayers.border);
gather.addMap('plains', mapLayers.plains.nature);
gather.addMap('desert', mapLayers.desert.nature);
gather.addMap('tundra', mapLayers.tundra.nature);

mapLayers.forAllAreas('ocean', (layer, area) => {
    layer.listTiles().forEach(tile => {
        if(tile.source.y > 0) {
            // some "decorative" tiles are put in the ocean layer
            // but shouldn't have hitboxes
            return;
        } else if (mapLayers.plains.path.get(tile.position.x, tile.position.y)){ //tile.position.x === 23 && tile.position.y === 16) {
            // don't add collision shapes over paths
            return;
        }
        //const newShape = new gameify.shapes.Rectangle(15, 10, 39, 44);
        const newShape = new gameify.shapes.Rectangle(0, 0, 64, 64);
        newShape.position.x += tile.position.x * layer.twidth;
        newShape.position.y += tile.position.y * layer.twidth;
        mapData.ocean.collisionShapes.addItem(newShape.position, newShape);
    })
});

// Don't build on the ocean or the trees
build.addBuildObstacleMap(mapLayers.plains.ocean);
build.addBuildObstacleMap(mapLayers.plains.nature);
build.addBuildObstacleMap(mapLayers.plains.path);
build.addBuildObstacleMap(mapLayers.desert.grass, 'You cannot build in the\ndesert!', true); // no building in the desert
build.addBuildObstacleMap(mapLayers.tundra.grass, 'You cannot build in the\ntundra!', true); // no building in the tundra
build.addBuildObstacleMap(mapLayers.border);
// Places villagers can't walk
villagers.addNavObstacleMap(mapLayers.desert.grass);
villagers.addNavObstacleMap(mapLayers.tundra.grass);
villagers.addNavObstacleMap(mapLayers.plains.ocean);
villagers.addNavObstacleMap(mapLayers.plains.nature);

const resourceUITileset = new gameify.Tileset('images/resource_ui_placeholder.png', 16, 16);
const resourceIndicators = {}
const resourceIndicatorTextStyle = new gameify.TextStyle('DefaultFont', 16, 'black');
let rBtnPos = 0;
for (const r in player.resources) {
    const sprite = new gameify.Sprite(0, 0, resourceUITileset.getTile(0, rBtnPos, 3, 1));
    sprite.scale = 2;
    const text = new gameify.Text(player.resources[r], 0, 0, resourceIndicatorTextStyle);
    resourceIndicators[r] = {
        sprite: sprite,
        text: text,
        active: false
    }
    sprite.position.y = 10 + (38*rBtnPos);
    sprite.position.x = 800 - sprite.getSize().x - 10;
    text.position = sprite.position.add(new gameify.Vector2d(30, 10));
    screen.add(sprite);
    screen.add(text);
    rBtnPos += 1;
}

const directionText = `
^ N - Desert
> E - Tundra
`;

let villageName = '';
signs.addSign(6*64, 1*64, `You're in the Forest!` + directionText, screen, async (sign)=>{
    const name = await inputbox.prompt('Enter a name for your village:', villageName);
    if (!name) return;
    villageName = name;
    sign.text = `You're in ${name}!` + directionText;
    sign.actionText = `rename ${name}`;
}, 'name your village');
signs.addSign(2*64, -25*64, `^ N - Desert\n> E - Tundra\nv S - Forest`, screen);
signs.addSign(26*64, -1*64, `You're in the Forest!\nNE - Desert\n> E - Tundra\n`, screen);
signs.addSign(56*64, 1*64, `< W - Forest\n> E - Tundra\n`, screen);


const lastDeltaTimes = [];
let greatestDeltaTimeSpike = 0;

const plainsAudio = new gameify.audio.Sound('audio/plains_bg.mp3');
const desertAudio = new gameify.audio.Sound('audio/desert_bg.mp3');
let PAVolume = .1;
plainsAudio.setVolume(PAVolume);
desertAudio.setVolume(PAVolume);
screen.audio.add(plainsAudio);
screen.audio.add(desertAudio);

const plainsWorldScene = new gameify.Scene(screen);
plainsWorldScene.onSceneShown(() => {
    plainsAudio.play();
    plainsAudio.setLoop(false);
})
plainsWorldScene.onSceneHidden(() => {
    plainsAudio.stop();
})
let musicTimer = 30000;

let currentLocation = 'plains';
let lastLocation = 'plains';

console.log(plainsAudio);

plainsWorldScene.onUpdate((deltaTime) => {
    lastLocation = currentLocation;
    if (player.sprite.position.y < -1900) {
        currentLocation = 'desert';

        if (!levelProgress.isCompleted('items', 'endless flask')) {
            player.sprite.position.y = -1900;
            dialogue.setScene('dehydration', 0, false);
        }
    } else if (player.sprite.position.x > 3850) {
        currentLocation = 'tundra';

        if (!levelProgress.isCompleted('items', 'fur coat')) {
            player.sprite.position.x = 3850;
            dialogue.setScene('hypothermia', 0, false);
        }
    } else {
        currentLocation = 'plains';
    }

    if (lastLocation !== currentLocation) {
        levelProgress.completeGoal('map', currentLocation)
    }

    // MUSIC
    PAVolume = Math.min(1, PAVolume + deltaTime/4000);
    menu.menuAudio.setVolume(Math.max(0, .5-PAVolume))
    plainsAudio.setVolume(Math.min(PAVolume-.5, .5));

    const anyPlaying = plainsAudio.isPlaying() || desertAudio.isPlaying();
    let currentAudio = plainsAudio;
    if (currentLocation == 'desert') {
        currentAudio = desertAudio;
    }

    if (!anyPlaying && musicTimer < 0) {
        currentAudio.play();
        musicTimer = (Math.random() * 40000) + 20000 // 20-40 s of delay
        console.log(musicTimer);
    } else if (!anyPlaying) {
        musicTimer -= deltaTime;
    }

    // Reset the mouse cursor to default
    // (not 'pointer', when buttons are hovered)
    screen.element.style.cursor = '';

    screen.camera.focus(player.sprite.position, new gameify.Vector2d(32, 80));

    // Update UI's (buttons) first, so clicks are handled properly
    gather.updateUI(deltaTime, screen, player);
    build.updateUI(deltaTime, screen, player);
    levelProgress.updateUI(deltaTime, screen, player);
    // ... then update the rest
    villagers.update(deltaTime, screen, player);
    gather.update(deltaTime, screen, player);
    build.update(deltaTime, screen, player);
    signs.update(deltaTime, screen, player);
    worldBorder.update(deltaTime, screen, player);
    dialogue.updateBox();

    if (screen.keyboard.keyWasJustPressed('1')) {
        manageModes.enterMode('build');
    } else if (screen.keyboard.keyWasJustPressed('2')) {
        manageModes.enterMode('gather');
    } else if (screen.keyboard.keyWasJustPressed('3')) {
        manageModes.enterMode('clipboard');
    } else if (screen.keyboard.keyWasJustPressed('4')) {
        manageModes.enterMode('options');
    }

    // SPRINT
    if (screen.keyboard.keyIsPressed("Shift")) {
        player.speed = player.sprint_speed * window.PLAYER_SPEED_BONUS;
    } else {
        player.speed = player.walk_speed * window.PLAYER_SPEED_BONUS;
    }

    // reset each frame so we don't go super fast
    player.sprite.velocity.x = 0;
    player.sprite.velocity.y = 0;

    if (screen.keyboard.keyIsPressed("W")) {
        player.sprite.velocity.y -= 1;
    }
    if (screen.keyboard.keyIsPressed("S")) {
        player.sprite.velocity.y += 1;
    }
    if (screen.keyboard.keyIsPressed("A")) {
        player.sprite.velocity.x -= 1;
    }
    if (screen.keyboard.keyIsPressed("D")) {
        player.sprite.velocity.x += 1;
    }

    // normalize and multiply, so we don't go faster when moving diagonally
    player.sprite.velocity.normalize();
    player.sprite.velocity = player.sprite.velocity.multiply(player.speed);

    // collision nonsense is copied from one of my sample projects
    // it works "good enough(TM)"
    const lastPosition = player.sprite.position.copy();
    const lastVelocity = player.sprite.velocity.copy();
    const directions = [0,
                        45, -45,
                        65, -65];
    let can_move = false;
    for (const dir of directions) {
        // Try to move at 0deg to target, but also rotated a bit to slide along walls
        player.sprite.velocity = lastVelocity.rotatedDegrees(dir);
        // The update function takes the velocity and moves the player
        player.sprite.update(deltaTime);
        
        // Check if the player collides with any of the map objects
        if (!window.COLLISIONS_ENABLED) break;
        else if (gather.collidesWithMap(player.sprite.shape)
            || build.collidesWithMap(player.sprite.shape)
            || mapData.ocean.collidesWithMap(player.sprite.shape)
            || worldBorder.collidesWithMap(player.sprite.shape)
        ) {
            // revert to before collision
            player.sprite.position = lastPosition;
            
        } else {
            can_move = true;
            break; // no collision? we're done here.
        }
    }

    // Stuck on an obstacle, or not moving
    if (!can_move || Math.max(Math.abs(player.sprite.velocity.y), Math.abs(player.sprite.velocity.x)) < 10) {
        player.sprite.animator.play('idle');

    } else if (player.sprite.velocity.x > 10) {
        player.sprite.animator.play('walk_east');
    } else if (player.sprite.velocity.x < -10){
        player.sprite.animator.play('walk_west');
    } else if (player.sprite.velocity.y > 10) {
        player.sprite.animator.play('walk_south');
    } else {
        player.sprite.animator.play('walk_north');
    }

    for (const res in resourceIndicators) {
        const text = resourceIndicators[res].text;
        text.string = player.resources[res];
    }

    if (window.DISPLAY_FRAME_TIME) {
        lastDeltaTimes.push(deltaTime);
        const niceDT = Math.floor(deltaTime)
        const averageTime = Math.floor(lastDeltaTimes.reduce((a, b) => a + b) / lastDeltaTimes.length);

        const numFrames = 120;
        const lastNFrames = lastDeltaTimes.slice(Math.max(lastDeltaTimes.length - numFrames, 0));
        const averageTimeLastN = Math.floor(lastNFrames.reduce((a, b) => a + b) / lastNFrames.length);

        if (deltaTime > greatestDeltaTimeSpike) {
            greatestDeltaTimeSpike = Math.floor(deltaTime);
        }

        const maxLastNFrames = Math.floor(Math.max(...lastNFrames));

        dialogue.setText(`deltaTime: ${niceDT} (${Math.floor(1000/niceDT)}fps)  Average: ${averageTime} (${
            Math.floor(1000/averageTime)}fps)
Average last ${numFrames} frames: ${averageTimeLastN} (${Math.floor(1000/averageTimeLastN)}fps)
Spike: ${greatestDeltaTimeSpike} (${Math.floor(1000/greatestDeltaTimeSpike)}fps)    Spike last ${
    numFrames} frames: ${maxLastNFrames} (${Math.floor(1000/maxLastNFrames)}fps)
`, true);
    }

    message.updateMessage(deltaTime);

});

const onlyDrawIfNear = (t, x, y) => {
    // all the maps are the same size, so
    // we'll arbitrarily use the nature map for reference
    if (x*mapLayers.plains.nature.twidth + 550 < player.sprite.position.x
        || x*mapLayers.plains.nature.twidth - 550 > player.sprite.position.x
        || y*mapLayers.plains.nature.theight + 450 < player.sprite.position.y
        || y*mapLayers.plains.nature.theight - 450 > player.sprite.position.y) return false;
    return true;
}

plainsWorldScene.onDraw(() => {
    screen.clear('#efe');

    mapLayers.forAllAreas('ocean', (layer) => layer.draw(onlyDrawIfNear));
    mapLayers.forAllAreas('grass', (layer) => layer.draw(onlyDrawIfNear));
    mapLayers.forAllAreas('path', (layer) => layer.draw(onlyDrawIfNear));
    mapLayers.forAllAreas('nature', (layer, area) => layer.draw((tile, x, y) => {
        if (!onlyDrawIfNear(tile, x, y)) return false;

        if (area === 'tundra' && tile.source.y === 2 || tile.source.y === 3) {
            // Hacky way of making certain tundra tiles
            // draw properly (below the player)
            return tile.__tsa_already_drawn = true; // yes, assignment on purpose

        } else if (y*mapLayers.plains.nature.theight < player.sprite.position.y) {
            // tile is above the player, draw it first
            // arbitrarily use the plains map as reference for theight
            return tile.__tsa_already_drawn = true; // yes, assignment on purpose
        }
        return tile.__tsa_already_drawn = false;
    }));

    worldBorder.draw(screen, player);
    build.draw(screen, player);
    villagers.draw(screen);
    signs.draw();

    player.sprite.draw();


    mapLayers.forAllAreas('nature', (layer) => layer.draw((tile, x, y) => {
        return onlyDrawIfNear(tile, x, y) && !tile.__tsa_already_drawn;
    }));
    
    gather.draw(screen, player);

    if (window.DRAW_SHAPES) {
        player.sprite.shape.draw(screen.context);
        mapData.ocean.drawShapes();
    }

    screen.camera.setDrawMode('ui');
    
    for (const res in resourceIndicators) {
        const indicator = resourceIndicators[res];
        indicator.sprite.draw();
        indicator.text.draw();
    }

    dialogue.drawBox();
    gather.drawUI();
    build.drawUI();
    levelProgress.drawUI();
    message.draw();
});
screen.setScene(menu.createScene(screen, plainsWorldScene, player));
screen.startGame();