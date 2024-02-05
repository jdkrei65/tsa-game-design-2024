import { gameify } from './gameify/gameify.js';
import { inputbox } from './inputbox.js';
import { manageModes } from './manageModes.js';

let menuScene = undefined;
const menuAudio = new gameify.audio.Sound('audio/main_menu.mp3');
let screen = undefined;

export const menu = {
    openOptions() {
        inputbox.alert(`Select volume<br>
            <span class="range-input"><input oninput="window.CHANGE_VOLUME_FUNC((2**(this.value-3))/6)"
                value="${Math.log2(screen.audio.getVolume())+3}*6" type="range" min="0" max="5" step=".25"></span>
            <br>
            <button onclick="window.CHANGE_VOLUME_FUNC(0)">Mute sounds</button>
        `);
    },
    menuAudio,
    createScene(_screen, nextScene) {
        screen = _screen;
        const bgImage = new gameify.Image('images/menuScreen.png')
        const bgSprite = new gameify.Sprite(0, 0, bgImage);
        bgSprite.scale = 2;
        screen.add(bgSprite);

        const box = new gameify.shapes.Rectangle(265, 298, 240, 75);
        const optionsBox = new gameify.shapes.Rectangle(260, 385, 240, 47);

        menuAudio.setVolume(.5);
        screen.audio.add(menuAudio);

        menuScene = new gameify.Scene(screen);
        menuScene.onSceneHidden(() => {
            //menuAudio.stop();
        })
        menuScene.onUpdate((deltaTime) => {
            if (!menuAudio.isPlaying()) menuAudio.play();

            screen.element.style.cursor = 'pointer';

            if (box.contains(screen.mouse.getPosition())) {
                if (screen.mouse.eventJustHappened('left')) {
                    screen.setScene(nextScene);
                }

            } else if (optionsBox.contains(screen.mouse.getPosition())) {
                if (screen.mouse.eventJustHappened('left')) {
                    console.log(screen.audio.getVolume());
                    menu.openOptions();
                }

            } else {
                screen.element.style.cursor = '';
            }
        });
        menuScene.onDraw(() => {
            bgSprite.draw();
            if (window.DRAW_SHAPES) {
                box.draw(screen.context);
                optionsBox.draw(screen.context);
            }
        });
        return menuScene;
    },
    scene() { return menuScene }
}

manageModes.addMode('options', menu.openOptions, ()=>{});