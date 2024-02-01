import { dialogue } from './dialogue.js';
import { gameify } from './gameify/gameify.js';

const buildingTileset = new gameify.Tileset("images/builditembuttons.png", 32, 32);
const villagerImage = buildingTileset.getTile(0, 3);

const popupImage = new gameify.Image('images/e_talk_popup.png');
const popupSprite = new gameify.Sprite(0, 0, popupImage);

const defaultVillager = {
    onInteract: ()=>{
        if (dialogue.setScene('v1_temp', 0, false)) {
            defaultVillager.canInteract = false;
        }
    },
    canInteract: true,
    closeToPlayer: false,
    sprite: new gameify.Sprite(100, 100, villagerImage)
};

export const villagers = {
    setScreen(screen) {
        screen.add(defaultVillager.sprite);
        screen.add(popupSprite);
    },
    update(deltaTime, screen, player) {
        const villager = defaultVillager;

        villager.closeToPlayer = false;
        if (villager.canInteract && player.sprite.position.distanceTo(villager.sprite.position) < 64) {
            villager.closeToPlayer = true;
            popupSprite.position = villager.sprite.position.copy();
            popupSprite.position.y -= 32;
            popupSprite.position.x -= 16;

            if (screen.keyboard.keyWasJustPressed('E')) {
                villager.onInteract();
            }
            return;
        }
    },
    draw() {
        defaultVillager.sprite.draw();
        if (defaultVillager.closeToPlayer) {
            popupSprite.draw();
        }
    }    
}
