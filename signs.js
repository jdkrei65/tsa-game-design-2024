import { dialogue } from './dialogue.js';
import { gameify } from './gameify/gameify.js';

const buildingTileset = new gameify.Tileset("images/builditembuttons.png", 32, 32);
const signImage = buildingTileset.getTile(2, 7);

const signSprites = [];

export const signs = {
    addSign: (x, y, text, screen, action) => {
        const newSprite = new gameify.Sprite(x+24, y+24, signImage);
        screen.add(newSprite);
        const newSign = {
            id: 'Sign_' + Math.floor(Math.random()*9000000),
            text: text,
            sprite: newSprite,
            action: action
        };
        signSprites.push(newSign);
        return newSign;
    },
    update: (deltaTime, screen, player) => {
        for (const sign of signSprites) {
            if (player.sprite.position.distanceTo(sign.sprite.position) < 50) {
                dialogue.setText('A nearby sign says:\n' + sign.text, 'Sign_', sign.id);
                if (screen.keyboard.keyWasJustPressed('Space') && sign.action) {
                    sign.action(sign);
                }
            } else {
                dialogue.closeIfActive(sign.id);
            }
        }
    },
    draw: () => {
        for (const sign of signSprites) {
            sign.sprite.draw();
        }
    }
}