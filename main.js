import { gameify } from './gameify/gameify.js';
import { dialogue } from './dialogue.js';
import { build } from './build.js';
import { message } from './message.js';
import { gather } from './gather.js';
import { levelProgress } from './levelProgress.js';
import { signs } from './signs.js';
import { StaticSpacialHashArray } from './spacialHash.js';

import grassTilemapData  from './mapdata/grasslayer.tilemapdata.js';
import natureTilemapData from './mapdata/naturelayer.tilemapdata.js';
import oceanTilemapData  from './mapdata/oceanlayer.tilemapdata.js';

// debug options
window.DRAW_SHAPES          = false;    // default false
window.DISPLAY_FRAME_TIME   = false;    // default false
// other options
window.RESIZE_CANVAS        = 'always'; // 'always', 'stepped', or 'never'
window.COLLISIONS_ENABLED   = true;     // default true
window.SPACIAL_HASH_SIZE    = 96;       // default 128 (2x2 tiles)

// NOTE TO SELF:
// draw trees above player before the player, and ones below after the player
// draw paths on separate(?) map or with the "above trees"
// remove collisions after gathering

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
build.setScreen(screen);
message.setScreen(screen);
gather.setScreen(screen);
levelProgress.setScreen(screen);

//Main Character
const characterSprite = new gameify.Image("images/temporaryChar.png")
const player = {
    sprite: new gameify.Sprite(300, 200, characterSprite),
    direction: new gameify.Vector2d(1, 0),
    speed: 90, // px per s
    resources: {
        wood: 5,  // Start with some resources for testing,
        stone: 0, // set this to zero later
        apples: 5,
        gold: 10
    }
};
player.sprite.setShape(new gameify.shapes.Circle(0, 0, 14), 28, 34);
//player.sprite.setShape(new gameify.shapes.Rectangle(0, 0, 28, 22), 14, 28);
player.sprite.scale = .2;
screen.add(player.sprite);

screen.camera.setSpeed(0.002);
screen.camera.maxDistance = 55;
screen.camera.minDistance = 30;

// create map layers
const worldMapTileset = new gameify.Tileset('images/worldmapalex1-9-24.png', 32, 32);
const tilemapSize = 64;
const mapLayers = {
    ocean: new gameify.Tilemap(tilemapSize, tilemapSize),
    grass: new gameify.Tilemap(tilemapSize, tilemapSize),
    nature: new gameify.Tilemap(tilemapSize, tilemapSize)
};
const mapData = {
    ocean: {
        collisionShapes: new StaticSpacialHashArray(window.SPACIAL_HASH_SIZE), // 1.5x1.5 tile chunks
        collidesWithMap: (shape) => {
            shape.fillColor = '#00f3';
            return mapData.ocean.collisionShapes.forEachNearby(shape.position, (oceanShape) => {
                if (shape.collidesWith(oceanShape)) {
                    shape.fillColor = '#f008';
                    oceanShape.fillColor = '#ff08';
                    return true;
                }
            }, true);
        },
        drawShapes: () => {
            mapData.ocean.collisionShapes.forEachNearby(player.sprite.shape.position, (shape) => {
                shape.draw(screen.context);
            });
        }
    }
}
for (const layerName in mapLayers) {
    const layer = mapLayers[layerName];
    layer.setTileset(worldMapTileset);
    screen.add(layer);
}
mapLayers.grass.loadMapData(grassTilemapData);
mapLayers.nature.loadMapData(natureTilemapData);
mapLayers.ocean.loadMapData(oceanTilemapData);
gather.setMap(mapLayers.nature);
mapLayers.ocean.listTiles().forEach(tile => {
    //const newShape = new gameify.shapes.Rectangle(15, 10, 39, 44);
    const newShape = new gameify.shapes.Rectangle(0, 0, 64, 64);
    newShape.position.x += tile.position.x * mapLayers.ocean.twidth;
    newShape.position.y += tile.position.y * mapLayers.ocean.twidth;
    mapData.ocean.collisionShapes.addItem(newShape.position, newShape);
});

// Don't build on the ocean or the trees
build.collideWithMap(mapLayers.ocean);
build.collideWithMap(mapLayers.nature);

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

signs.addSign(6*64, 1*64, 'Welcome to your village!\n\n\n\n[SPACE to rename the village]', screen, (sign)=>{
    const name = prompt('Enter a name for your village');
    if (name) sign.text = `Welcome to ${name}!\n\n\n\n[SPACE to rename ${name}]`;
});


const lastDeltaTimes = [];
let greatestDeltaTimeSpike = 0;

const plainsWorldScene = new gameify.Scene(screen);
plainsWorldScene.onUpdate((deltaTime) => {
    // Reset the mouse cursor to default
    // (not 'pointer', when buttons are hovered)
    screen.element.style.cursor = '';

    screen.camera.focus(player.sprite.position, new gameify.Vector2d(32, 80));

    // Update UI's (buttons) first, so clicks are handled properly
    gather.updateUI(deltaTime, screen, player);
    build.updateUI(deltaTime, screen, player);
    levelProgress.updateUI(deltaTime, screen, player);
    // ... then update the rest
    gather.update(deltaTime, screen, player);
    build.update(deltaTime, screen, player);
    signs.update(deltaTime, screen, player);
    dialogue.updateBox();

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

    if (player.sprite.velocity.x !== 0 || player.sprite.velocity.y !== 0) {
        player.direction = player.sprite.velocity.copy();
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
    for (const dir of directions) {
        // Try to move at 0deg to target, but also rotated a bit to slide along walls
        player.sprite.velocity = lastVelocity.rotatedDegrees(dir);
        // The update function takes the velocity and moves the player
        player.sprite.update(deltaTime);
        
        // Check if the player collides with any of the map objects
        if (!window.COLLISIONS_ENABLED) break;
        else if (gather.collidesWithMap(player.sprite.shape)
            || mapData.ocean.collidesWithMap(player.sprite.shape)
        ) {
            // revert to before collision
            player.sprite.position = lastPosition;
            
        } else break; // no collision? we're done here.
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
plainsWorldScene.onDraw(() => {
    screen.clear('#efe');

    mapLayers.ocean.draw();
    mapLayers.grass.draw();
    
    signs.draw();
    player.sprite.draw();

    mapLayers.nature.draw();
    
    gather.draw(screen, player);
    build.draw();

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
screen.setScene(plainsWorldScene);
screen.startGame();