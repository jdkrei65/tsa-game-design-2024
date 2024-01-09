import { gameify } from './gameify/gameify.js';
import { dialogue } from './dialogue.js';
import { build } from './build.js';

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

//Main Character
const characterSprite = new gameify.Image("images/temporaryChar.png")
const player = {
    sprite: new gameify.Sprite(0,0, characterSprite),
    resources: {
        wood: 50,  // Start with some resources for testing,
        stone: 50, // set this to zero later
        gold: 50
    }
};
screen.add(player.sprite);

// create map layers
const worldMapTileset = new gameify.Tileset('images/worldmapalex1-9-24.png', 32, 32);
const mapLayers = {
    grass: new gameify.Tilemap(64, 64),
    nature: new gameify.Tilemap(64, 64),
    ocean: new gameify.Tilemap(64, 64),
};
for (const layerName in mapLayers) {
    const layer = mapLayers[layerName];
    layer.setTileset(worldMapTileset);
    screen.add(layer);
}
mapLayers.grass.loadMapData(grassTilemapData);
mapLayers.nature.loadMapData(natureTilemapData);
mapLayers.ocean.loadMapData(oceanTilemapData);

const resourceUITileset = new gameify.Tileset('images/resource_ui_placeholder.png', 32, 32);
const resourceIndicators = {}
const resourceIndicatorTextStyle = new gameify.TextStyle('Arial', 18, 'black');
let rBtnPos = 0;
for (const r in player.resources) {
    const sprite = new gameify.Sprite(0, 0, resourceUITileset.getTile(0, rBtnPos, 3, 1));
    const text = new gameify.Text(player.resources[r], 0, 0, resourceIndicatorTextStyle);
    resourceIndicators[r] = {
        sprite: sprite,
        text: text,
        active: false
    }
    sprite.scale = 1;
    sprite.position.y = 10 + (40*rBtnPos);
    sprite.position.x = 800 - sprite.getSize().x - 10;
    text.position = sprite.position.add(new gameify.Vector2d(30, 7));
    screen.add(sprite);
    screen.add(text);
    rBtnPos += 1;
}

const plainsWorldScene = new gameify.Scene(screen);
plainsWorldScene.onUpdate((deltaTime) => {

    screen.camera.focus(new gameify.Vector2d(200, 200), new gameify.Vector2d(24, 24));
    build.update(deltaTime, screen, player.resources);
    dialogue.updateBox();

    for (const res in resourceIndicators) {
        const text = resourceIndicators[res].text;
        text.string = player.resources[res];
    }

});
plainsWorldScene.onDraw(() => {
    screen.clear('#efe');

    for (const layerName in mapLayers) {
        mapLayers[layerName].draw();
    }
    
    player.sprite.draw();
    
    build.draw();

    screen.camera.setDrawMode('ui');
    
    for (const res in resourceIndicators) {
        const indicator = resourceIndicators[res];
        indicator.sprite.draw();
        indicator.text.draw();
    }

    dialogue.drawBox();
    build.drawUI(screen);
});
screen.setScene(plainsWorldScene);
screen.startGame();