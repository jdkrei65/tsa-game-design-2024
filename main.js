import { gameify } from './gameify/gameify.js';
import { dialogue } from './dialogue.js';
import { build } from './build.js';
import { message } from './message.js';
import { gather } from './gather.js';
import { clipboard } from './clipboard.js';

import grassTilemapData  from './mapdata/grasslayer.tilemapdata.js';
import natureTilemapData from './mapdata/naturelayer.tilemapdata.js';
import oceanTilemapData  from './mapdata/oceanlayer.tilemapdata.js';

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


const canvasElement = document.querySelector('#game-canvas');
const screen = new gameify.Screen(canvasElement, 800, 600);
screen.setAntialiasing(false);

// Init imported things
dialogue.setScreen(screen);
dialogue.setScene('tutorial');
build.setScreen(screen);
message.setScreen(screen);
gather.setScreen(screen);
clipboard.setScreen(screen);

//Main Character
const characterSprite = new gameify.Image("images/temporaryChar.png")
const player = {
    sprite: new gameify.Sprite(300, 200, characterSprite),
    direction: new gameify.Vector2d(1, 0),
    speed: 80, // px per s
    resources: {
        wood: 5,  // Start with some resources for testing,
        stone: 0, // set this to zero later
        apples: 5,
        gold: 10
    }
};
player.sprite.scale = .2;
screen.add(player.sprite);

screen.camera.setSpeed(0.002);
screen.camera.maxDistance = 55;
screen.camera.minDistance = 30;

// create map layers
const worldMapTileset = new gameify.Tileset('images/worldmapalex1-9-24.png', 32, 32);
const mapLayers = {
    ocean: new gameify.Tilemap(64, 64),
    grass: new gameify.Tilemap(64, 64),
    nature: new gameify.Tilemap(64, 64),
};
for (const layerName in mapLayers) {
    const layer = mapLayers[layerName];
    layer.setTileset(worldMapTileset);
    screen.add(layer);
}
mapLayers.grass.loadMapData(grassTilemapData);
mapLayers.nature.loadMapData(natureTilemapData);
mapLayers.ocean.loadMapData(oceanTilemapData);
gather.setMap(mapLayers.nature);

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

const plainsWorldScene = new gameify.Scene(screen);
plainsWorldScene.onUpdate((deltaTime) => {
    // Reset the mouse cursor to default
    // (not 'pointer', when buttons are hovered)
    screen.element.style.cursor = '';

    screen.camera.focus(player.sprite.position, new gameify.Vector2d(32, 80));

    // Update UI's (buttons) first, so clicks are handled properly
    gather.updateUI(deltaTime, screen, player);
    build.updateUI(deltaTime, screen, player);
    clipboard.updateUI(deltaTime, screen, player);
    // ... then update the rest
    gather.update(deltaTime, screen, player);
    build.update(deltaTime, screen, player);
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

    // moves according to velocity
    // does deltaTime for you
    player.sprite.update(deltaTime);

    for (const res in resourceIndicators) {
        const text = resourceIndicators[res].text;
        text.string = player.resources[res];
    }

    message.updateMessage(deltaTime);

});
plainsWorldScene.onDraw(() => {
    screen.clear('#efe');

    for (const layerName in mapLayers) {
        mapLayers[layerName].draw();
    }
    
    player.sprite.draw();
    
    gather.draw();
    build.draw();

    screen.camera.setDrawMode('ui');
    
    for (const res in resourceIndicators) {
        const indicator = resourceIndicators[res];
        indicator.sprite.draw();
        indicator.text.draw();
    }

    dialogue.drawBox();
    gather.drawUI();
    build.drawUI();
    clipboard.drawUI();
    message.draw();
});
screen.setScene(plainsWorldScene);
screen.startGame();