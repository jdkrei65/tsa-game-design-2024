import { gameify } from './gameify/gameify.js';

const canvasElement = document.querySelector('#game-canvas');
const screen = new gameify.Screen(canvasElement, 800, 600);

const buildingTileset = new gameify.Tileset("images/placeholder4.png", 32, 32);
const buildingMap = new gameify.Tilemap(32, 32);
buildingMap.setTileset(buildingTileset);
buildingMap.place(
    0, 0,
    10, 10,
    0,
    2, 2
);
screen.add(buildingMap);

const image = buildingTileset.getTile(0, 0, 2, 1); //new gameify.Image("images/placeholder4.png")
const previewPlaceSprite = new gameify.Sprite(0, 0, image);
screen.add(previewPlaceSprite);

console.log(buildingMap.listTiles())
console.log(buildingMap.tiles)

const plainsWorldScene = new gameify.Scene(screen);
plainsWorldScene.onUpdate((deltaTime) => { /* deltaTime is time since last update, in miliseconds */
    
    const mouseWorldPosition = screen.camera.screenToWorld(screen.mouse.getPosition());
    const mouseMapPosition = buildingMap.screenToMap(mouseWorldPosition)

    previewPlaceSprite.position = mouseMapPosition.multiply(buildingMap.twidth)

    previewPlaceSprite.update(deltaTime);

    screen.camera.focus(new gameify.Vector2d(200, 200), new gameify.Vector2d(24, 24));

    if (screen.mouse.eventJustHappened('left')) {
        buildingMap.place(
            0, 0,
            mouseMapPosition.x, mouseMapPosition.y,
            0,
            2, 1
        );
    }

});
plainsWorldScene.onDraw(() => {
    screen.clear('#ffe');
    buildingMap.draw();
    previewPlaceSprite.draw();
});

screen.setScene(plainsWorldScene);
screen.startGame();