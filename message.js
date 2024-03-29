import { gameify } from './gameify/gameify.js';

const messageAudio = new gameify.audio.Sound('audio/sfx/status_bad.mp3');

const warnMessageImage = new gameify.Image("images/problemdialog.png");
warnMessageImage.opacity = 0;
const warnMessageSprite = new gameify.Sprite(256, 68, warnMessageImage);
warnMessageSprite.scale = 2;
const messageTextStyle = new gameify.TextStyle('DefaultFont', 16, 'black');
messageTextStyle.opacity = 0;
messageTextStyle.lineHeight = 1.5;
const messageText = new gameify.Text('Message here',
    warnMessageSprite.position.x + 15,
    warnMessageSprite.position.y + 19,
    messageTextStyle
);

let show = false;
let duration = 0;
let audioCooldown = 0;

export const message = {
    setScreen: (screen) => {
        screen.add(warnMessageSprite);
        screen.add(messageText);
        screen.audio_sfx.add(messageAudio);
    },
    showText: (text, newDuration = 2000) => {
        duration = newDuration;
        messageText.string = text;
        show = true;

        if (audioCooldown > 0) {
            console.warn('message cooldown!', audioCooldown);
        } else {
            messageAudio.stop();
            messageAudio.play();
            audioCooldown = 500;
        }
    },
    hideText: () => {
        show = false;
    },
    updateMessage: (deltaTime) => {
        audioCooldown -= deltaTime;
        duration -= deltaTime;
        if (show && duration < 0) {
            show = false;
        }
        // fade in/out
        if (show) {
            const opacity = Math.min(1, messageText.style.opacity + deltaTime / 150);
            messageText.style.opacity = opacity;
            warnMessageSprite.image.opacity = opacity;
        } else {
            const opacity = Math.max(0.01, messageText.style.opacity - deltaTime / 150);
            messageText.style.opacity = opacity;
            warnMessageSprite.image.opacity = opacity;
        }
    },
    draw: () => {
        warnMessageSprite.draw();
        messageText.draw();
    }
} 