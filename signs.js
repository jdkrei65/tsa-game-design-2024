import { dialogue } from './dialogue.js';
import { gameify } from './gameify/gameify.js';

const buildingTileset = new gameify.Tileset("images/builditembuttons.png", 32, 32);
const signImage = buildingTileset.getTile(2, 7);


const popupImage = new gameify.Image('images/e_read_popup.png');
const popupSprite = new gameify.Sprite(0, 0, popupImage);
popupSprite.scale = 2;

const signSprites = [];

let nearSign = false;

export const signs = {
    setScreen: (screen) => {
        screen.add(popupSprite);
    },
    addSign: (x, y, text, screen, action, actionText) => {
        const newSprite = new gameify.Sprite(x+24, y+24, signImage);
        screen.add(newSprite);
        const newSign = {
            id: 'Sign_' + Math.floor(Math.random()*9000000),
            text: text,
            sprite: newSprite,
            action: action,
            actionText: actionText
        };
        signSprites.push(newSign);
        return newSign;
    },
    update: (deltaTime, screen, player) => {
        nearSign = false;
        for (const sign of signSprites) {
            if (player.sprite.position.distanceTo(sign.sprite.position) < 50) {
                nearSign = true;
                popupSprite.position = sign.sprite.position.copy();
                popupSprite.position.y -= 38;
                popupSprite.position.x -= 32;
                if (sign.visible && sign.action && screen.keyboard.keyWasJustPressed('X')) {
                    sign.action(sign);
                    dialogue.closeIfActive(sign.id);
                }
                if (screen.keyboard.keyWasJustPressed('E')) {
                    // [E] to read the sign
                    sign.visible = dialogue.setText('A nearby sign says:\n' + sign.text, 'Sign_', sign.id, sign.actionText);
                    break;
                }
            }
        }
    },
    draw: () => {
        for (const sign of signSprites) {
            sign.sprite.draw();
        }
        if (nearSign) {
            popupSprite.draw();
        }
    }
}