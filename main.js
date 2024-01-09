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

    screen.camera.focus(new gameify.Vector2d(200, 200), new gameify.Vector2d(24, 24));

    build.update(screen);
    dialogue.updateBox();

});
plainsWorldScene.onDraw(() => {
    screen.clear('#efe');
    
    build.draw();

    screen.camera.setDrawMode('ui');
    dialogue.drawBox();
    build.drawUI();
});
screen.setScene(plainsWorldScene);
screen.startGame();