import { gameify } from './gameify/gameify.js';

let menuScene = undefined;
export const menu = {
    createScene(screen, nextScene) {
        const bgImage = new gameify.Image('images/menuScreen.png')
        const bgSprite = new gameify.Sprite(0, 0, bgImage);
        bgSprite.scale = 2;
        screen.add(bgSprite);

        const box = new gameify.shapes.Rectangle(265, 298, 240, 75);

        menuScene = new gameify.Scene(screen);
        menuScene.onUpdate((deltaTile) => {
            if (box.contains(screen.mouse.getPosition())) {
                screen.element.style.cursor = 'pointer';
                if (screen.mouse.eventJustHappened('left')) screen.setScene(nextScene)
            } else {
                screen.element.style.cursor = '';
            }
        });
        menuScene.onDraw(() => {
            bgSprite.draw();
        });
        return menuScene;
    },
    scene() { return menuScene }
}