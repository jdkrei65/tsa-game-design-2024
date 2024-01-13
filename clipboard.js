import { gameify } from './gameify/gameify.js';
import { manageModes } from './manageModes.js';

const buildingTileset = new gameify.Tileset("images/builditembuttons.png", 32, 32);
const clipboardButtonImage = buildingTileset.getTile(1, 4);
const clipboardButtonActiveImage = buildingTileset.getTile(2, 4);
const clipboardButton = new gameify.Sprite(10, 126, clipboardButtonImage);
clipboardButton.scale = 1.5;

const levels = [{
    text: `Level 1 progress:
(small settlement)

[x] Build 1 house
[ ] Build 1 forager's hut
[ ] Build 1 water tank
`
}]


const clipboardImage = new gameify.Image("images/clipboard.png");
const clipboardSprite = new gameify.Sprite(68, 10, clipboardImage);
clipboardSprite.scale = 2;
const clipboardTextStyle = new gameify.TextStyle('DefaultFont', 16, '#ddd');
clipboardTextStyle.lineHeight = 1.25;
const clipboardText = new gameify.Text(
    levels[0].text,
    58+24, 40, clipboardTextStyle
);

let clipboardModeActive = false;

const enterClipboardMode = () => {
    clipboardModeActive = true;
    clipboardButton.image = clipboardButtonActiveImage;
}
const exitClipboardMode = () => {
    clipboardModeActive = false;
    clipboardButton.image = clipboardButtonImage;
}

manageModes.addMode('clipboard', enterClipboardMode, exitClipboardMode);

export const clipboard = {
    setScreen: (screen) => {
        screen.add(clipboardButton);
        screen.add(clipboardSprite);
        screen.add(clipboardText);
    },
    updateUI: (deltaTime, screen, player) => {
        const mousePos = screen.mouse.getPosition();
        if (mousePos.x > clipboardButton.position.x
            && mousePos.y > clipboardButton.position.y
            && mousePos.x < clipboardButton.position.x + clipboardButton.getSize().x
            && mousePos.y < clipboardButton.position.y + clipboardButton.getSize().y
        ) {
            screen.element.style.cursor = 'pointer';

            if (screen.mouse.eventJustHappened('left', /*capture=*/true)) {
                if (clipboardModeActive) exitClipboardMode();
                else manageModes.enterMode('clipboard');
            }

        }
    },
    drawUI: () => {
        clipboardButton.draw();

        if (clipboardModeActive) {
            clipboardSprite.draw();
            clipboardText.draw();
        }
    }
};