import { gameify } from './gameify/gameify.js';
import { dialogue } from './dialogue.js';
import { build } from './build.js';

window.onerror = onerror = (event, source, lineno, colno, error) => {
    document.querySelector('#err').innerHTML += `
        ERROR: ${error}
        AT: ${source} ${lineno}:${colno}

        <hr>
    `;
}


const canvasElement = document.querySelector('#game-canvas');
const screen = new gameify.Screen(canvasElement, 800, 600);
screen.setAntialiasing(false);

// Init imported things
dialogue.setScreen(screen);
dialogue.setScene('tutorial');
build.setScreen(screen);

// Temp buildings
const buildingTileset = new gameify.Tileset("images/placeholder4.png", 32, 32);
const buildingMap = new gameify.Tilemap(32, 32);
buildingMap.setTileset(buildingTileset);
screen.add(buildingMap);
// Temp build preview
const image = buildingTileset.getTile(0, 0, 2, 1);
const previewPlaceSprite = new gameify.Sprite(0, 0, image);
screen.add(previewPlaceSprite);
//Main Character
let mainChar=new gameify.Sprite(0,0,"images/temporaryChar.png");
screen.add(mainChar);

const plainsWorldScene = new gameify.Scene(screen);
plainsWorldScene.onUpdate((deltaTime) => {
    
    const mouseWorldPosition = screen.camera.screenToWorld(screen.mouse.getPosition());
    const mouseMapPosition = buildingMap.screenToMap(mouseWorldPosition);

    previewPlaceSprite.position = mouseMapPosition.multiply(buildingMap.twidth);

    previewPlaceSprite.update(deltaTime);

    screen.camera.focus(new gameify.Vector2d(200, 200), new gameify.Vector2d(24, 24));

    //dialogue.setText(`x: ${mouseMapPosition.x}, y: ${mouseMapPosition.y}`);

    build.update(screen);
    dialogue.updateBox();

});
plainsWorldScene.onDraw(() => {
    screen.clear('#efe');
    //screen.context.globalAlpha = 0.5;
    //previewPlaceSprite.draw();
    //screen.context.globalAlpha = 1;
    
    build.draw();

    screen.camera.setDrawMode('ui');
    dialogue.drawBox();
    build.drawUI();
});
screen.setScene(plainsWorldScene);
screen.startGame();