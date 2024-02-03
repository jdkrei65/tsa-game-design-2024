import { gameify } from './gameify/gameify.js';
import { StaticSpacialHashArray } from './spacialHash.js';
import { message } from './message.js';

let borderMap = undefined;
let collisionShapes = undefined;
let drawingBorderBox = undefined;
let timeSinceBorder = 0;
let maxTimeSinceBorder = 1000;

export const worldBorder = {
    setMap(map) {
        borderMap = map;
        collisionShapes = new StaticSpacialHashArray(window.SPACIAL_HASH_SIZE);
        map.listTiles().forEach(tile => {
            const newShape = new gameify.shapes.Rectangle(0, 0, 64, 64);
            newShape.position.x += tile.position.x * map.twidth;
            newShape.position.y += tile.position.y * map.twidth;
            collisionShapes.addItem(tile.position.multiply(map.twidth), newShape);
        });
    },
    collidesWithMap: (shape) => {
        shape.fillColor = '#00f3';
        return collisionShapes.forEachNearby(shape.position, (result) => {
            const colShape = result.item;
            if (shape.collidesWith(colShape)) {
                shape.fillColor = '#f008';
                colShape.strokeColor = '#fff0';
                colShape.fillColor = '#f00';
                if (drawingBorderBox !== colShape) {
                    timeSinceBorder = 0;
                    message.showText(`Let's not explore too far,\nYou don't want to get lost!`);
                }
                drawingBorderBox = colShape;
                return true;
            }
        }, true);
    },
    update: (deltaTime, screen, player) => {
        if (drawingBorderBox) {
            timeSinceBorder += deltaTime;
            if (timeSinceBorder > maxTimeSinceBorder) {
                timeSinceBorder = 0;
                drawingBorderBox = undefined;
            }
        }
    },
    draw: (screen, player) => {
        if (drawingBorderBox) {
            screen.context.globalAlpha = 0.5*(1-(timeSinceBorder/maxTimeSinceBorder));
            //drawingBorderBox.draw(screen.context);
            borderMap.draw();
            screen.context.globalAlpha = 1;
        }

        if (window.DRAW_WORLD_BORDER) borderMap.draw();
        if (window.DRAW_SHAPES) collisionShapes.forEachNearby(player.sprite.shape.position, (result) => {
            result.item.draw(screen.context);
        });
    },
}