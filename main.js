import { gameify } from './gameify/gameify.js';
import { dialogue } from './dialogue.js';
import { build } from './build.js';

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
let mainChar = new gameify.Sprite(0,0, characterSprite);
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