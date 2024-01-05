import { gameify } from './gameify/gameify.js';

const canvasElement = document.querySelector('#game-canvas');
const screen = new gameify.Screen(canvasElement, 800, 600);

const buildingTileset = new gameify.Tileset();

const buildingMap = new gameify.Tilemap(32, 32);


const plainsWorldScene = new gameify.Scene(screen);
plainsWorldScene.onUpdate((deltaTime) => { /* deltaTime is time since last update, in miliseconds */

});
plainsWorldScene.onDraw(() => {

});

screen.setScene(plainsWorldScene);