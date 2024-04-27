import { gameify } from './gameify/gameify.js';
import { inputbox } from './inputbox.js';
import { manageModes } from './manageModes.js';
import { dialogue } from './dialogue.js';

let menuScene = undefined;
const menuAudio = new gameify.audio.Sound('audio/main_menu.mp3');
let screen = undefined;

let player = undefined;

const womanPlayerTilesheet = new gameify.Tileset('images/woman_animated_sprite_full.png', 32, 48);
const manPlayerTilesheet = new gameify.Tileset('images/man_animated_sprite_full.png', 32, 48);
const horseWomanTilesheet = new gameify.Tileset("images/Ostrich_walking_LR2.png", 64, 48);
const horseManTilesheet = new gameify.Tileset("images/Ostrich_walking_LR2.png", 64, 48);
const make_player_anim = (sheet, row) => {
    return new gameify.Animation([
        { image: { type: 'Image', value: sheet.getTile(0, row) }, },
        { image: { type: 'Image', value: sheet.getTile(1, row) }, },
        { image: { type: 'Image', value: sheet.getTile(2, row) }, },
        { image: { type: 'Image', value: sheet.getTile(3, row) }, },
        { image: { type: 'Image', value: sheet.getTile(4, row) }, },
        { image: { type: 'Image', value: sheet.getTile(5, row) }, },
        { image: { type: 'Image', value: sheet.getTile(6, row) }, },
        { image: { type: 'Image', value: sheet.getTile(7, row) }, }
    ], {duration: 750, loop: true})
}
const make_horse_anim = (sheet, row) => {
    return new gameify.Animation([
        { image: { type: 'Image', value: sheet.getTile(1, row) }, },
        { image: { type: 'Image', value: sheet.getTile(2, row) }, },
        { image: { type: 'Image', value: sheet.getTile(3, row) }, },
        { image: { type: 'Image', value: sheet.getTile(4, row) }, },
        { image: { type: 'Image', value: sheet.getTile(5, row) }, },
        { image: { type: 'Image', value: sheet.getTile(6, row) }, },
        { image: { type: 'Image', value: sheet.getTile(7, row) }, },
        { image: { type: 'Image', value: sheet.getTile(8, row) }, }
    ], {duration: 650, loop: true})
}
const set_player_animations = (sheet, horseSheet) => {
    player.sprite.animator.set('idle',       new gameify.Animation([], {duration: 500, loop: true}));
    player.sprite.animator.set('walk_north', make_player_anim(sheet, 0));
    player.sprite.animator.set('walk_south', make_player_anim(sheet, 2));
    player.sprite.animator.set('walk_east',  make_player_anim(sheet, 1));
    player.sprite.animator.set('walk_west',  make_player_anim(sheet, 3));

    player.sprite.animator.set('horse_idle',       new gameify.Animation([], {duration: 500, loop: true}));
    player.sprite.animator.set('horse_walk_north', make_horse_anim(horseSheet, 0));
    player.sprite.animator.set('horse_walk_south', make_horse_anim(horseSheet, 0));
    player.sprite.animator.set('horse_walk_east',  make_horse_anim(horseSheet, 0));
    player.sprite.animator.set('horse_walk_west',  make_horse_anim(horseSheet, 1));
}

const all_muted = () => {
    return screen.audio.getVolume() == 0
        && screen.audio_sfx.getVolume() == 0
        && screen.audio.getVolume() == 0;
}
const get_volume = (vv) => {
    return (screen['audio'+vv].getVolume() || localStorage.getItem('volume' + vv)) ?? .1;
}

export const menu = {
    openOptions() {
        inputbox.alert(`Music volume:<br>
            <span class="range-input"><input oninput="window.CHANGE_VOLUME_MUSIC((2**(this.value-3))/6)"
                value="${Math.log2(get_volume('')*6)+3}" type="range" min="0" max="5" step=".25"></span>
            <br>
            Effects volume:<br>
            <span class="range-input"><input oninput="window.CHANGE_VOLUME_SFX((2**(this.value-3))/6)"
                value="${Math.log2(get_volume('_sfx')*6)+3}" type="range" min="0" max="5" step=".25"></span>
            <br>
            Voices volume:<br>
            <span class="range-input"><input oninput="window.CHANGE_VOLUME_VOICES((2**(this.value-3))/6)"
                value="${Math.log2(get_volume('_voices')*6)+3}" type="range" min="0" max="5" step=".25"></span>
            <br>
            ${all_muted() ? `<button onclick="window.UNMUTE_AUDIO();">
                Unmute sounds
            </button>` : `<button onclick="window.MUTE_AUDIO();">
                Mute sounds
            </button>`}
        `);
    },
    menuAudio,
    createScene(_screen, nextScene, _player) {
        player = _player
        screen = _screen;

        const clickAudio = new gameify.audio.Sound('audio/sfx/hit_2.2.mp3');
        screen.audio_sfx.add(clickAudio);

        const menuTextStyle = new gameify.TextStyle('DefaultFont', 32, '#fff');
        const menuTextHoverStyle = new gameify.TextStyle('DefaultFont', 32, '#e3c576');

        const charSelectText = new gameify.Text(
            'Select Character',
            250, 50, menuTextStyle
        );
        screen.add(charSelectText);
        const manSelText = new gameify.Text(
            '^',
            305, 535, menuTextStyle
        );
        screen.add(manSelText);
        const womanSelText = new gameify.Text(
            '^',
            510, 535, menuTextStyle
        );
        screen.add(womanSelText);

        const charSelectImage = new gameify.Image('images/char_select_screen.png');
        const charSelectSprite = new gameify.Sprite(135, 75, charSelectImage);
        const charSelectBgImage = new gameify.Image('images/char_select_screen_bg.png');
        const charSelectBgSprite = new gameify.Sprite(0, 0, charSelectBgImage);
        charSelectBgSprite.scale = 2;
        charSelectSprite.scale = 0.25;
        screen.add(charSelectSprite);
        screen.add(charSelectBgSprite);
        const charSelectScene = new gameify.Scene(screen);

        const manBox = new gameify.shapes.Rectangle(215, 115, 175, 450);
        const womanBox = new gameify.shapes.Rectangle(425, 115, 175, 450);
        charSelectScene.onUpdate(() => {

            manSelText.style = menuTextStyle;
            womanSelText.style = menuTextStyle;

            if (manBox.contains(screen.mouse.getPosition())) {
                screen.element.style.cursor = 'pointer';
                manSelText.style = menuTextHoverStyle;
                if (screen.mouse.eventJustHappened('left')) {
                    dialogue.setPlayerImage('man');
                    set_player_animations(manPlayerTilesheet, horseManTilesheet);
                    screen.setScene(nextScene);
                    clickAudio.stop();
                    clickAudio.play();
                }
            } else if (womanBox.contains(screen.mouse.getPosition())) {
                screen.element.style.cursor = 'pointer';
                womanSelText.style = menuTextHoverStyle;
                if (screen.mouse.eventJustHappened('left')) {
                    dialogue.setPlayerImage('woman');
                    set_player_animations(womanPlayerTilesheet, horseWomanTilesheet);
                    screen.setScene(nextScene);
                    clickAudio.stop();
                    clickAudio.play();
                }
            } else {
                screen.element.style.cursor = '';
            }

        });
        charSelectScene.onDraw(() => {
            screen.clear('#efe');
            charSelectBgSprite.draw();
            charSelectSprite.draw();
            charSelectText.draw();
            manSelText.draw();
            womanSelText.draw();
            if (window.DRAW_SHAPES) {
                manBox.draw(screen.context);
                womanBox.draw(screen.context);
            }
        });

        const bgImage = new gameify.Image('images/title_screen.jpg')
        const bgSprite = new gameify.Sprite(0, 0, bgImage);
        bgSprite.scale = 0.3;
        screen.add(bgSprite);

        const playText = new gameify.Text(
            'Play',
            430, 470, menuTextStyle
        );
        screen.add(playText);
        const optionsText = new gameify.Text(
            'Options',
            430, 530, menuTextStyle
        );
        screen.add(optionsText);

        const box = new gameify.shapes.Rectangle(420, 460, 120, 45);
        const optionsBox = new gameify.shapes.Rectangle(420, 520, 140, 45);

        menuAudio.setVolume(.5);
        screen.audio.add(menuAudio);

        menuScene = new gameify.Scene(screen);
        menuScene.onUpdate((deltaTime) => {
            if (!menuAudio.isPlaying()) menuAudio.play();

            playText.style = menuTextStyle;
            optionsText.style = menuTextStyle;

            screen.element.style.cursor = 'pointer';

            if (box.contains(screen.mouse.getPosition())) {
                playText.style = menuTextHoverStyle;
                if (screen.mouse.eventJustHappened('left')) {
                    screen.setScene(charSelectScene);
                    clickAudio.stop();
                    clickAudio.play();
                }

            } else if (optionsBox.contains(screen.mouse.getPosition())) {
                optionsText.style = menuTextHoverStyle;
                if (screen.mouse.eventJustHappened('left')) {
                    menu.openOptions();
                    clickAudio.stop();
                    clickAudio.play();
                }

            } else {
                screen.element.style.cursor = '';
            }
        });
        menuScene.onDraw(() => {
            screen.clear('#efe');
            bgSprite.draw();
            playText.draw();
            optionsText.draw();
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