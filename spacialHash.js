
export class StaticSpacialHashArray {

    chunkSize = 100;
    chunks = {};

    constructor (chunkSize) {
        this.chunkSize = chunkSize;
    }

    addItem(position, item) {
        const chunkX = Math.floor(position.x / this.chunkSize);
        const chunkY = Math.floor(position.y / this.chunkSize);
        if (!this.chunks[chunkX]) this.chunks[chunkX] = {};
        if (!this.chunks[chunkX][chunkY]) this.chunks[chunkX][chunkY] = [];

        this.chunks[chunkX][chunkY].push(item);
    }

    getAllInChunk(position) {
        const chunkX = Math.floor(position.x / this.chunkSize);
        const chunkY = Math.floor(position.y / this.chunkSize);
        return this.chunks[chunkX][chunkY];
    }

    getNearbyChunks(position) {
        const chunkX = Math.floor(position.x / this.chunkSize);
        const chunkY = Math.floor(position.y / this.chunkSize);
        return [(this.chunks[chunkX  ] || [])[chunkY  ] || [],
                (this.chunks[chunkX+1] || [])[chunkY  ] || [],
                (this.chunks[chunkX-1] || [])[chunkY  ] || [],
                (this.chunks[chunkX  ] || [])[chunkY+1] || [],
                (this.chunks[chunkX  ] || [])[chunkY-1] || [],
                (this.chunks[chunkX-1] || [])[chunkY+1] || [],
                (this.chunks[chunkX+1] || [])[chunkY-1] || [],
                (this.chunks[chunkX+1] || [])[chunkY+1] || [],
                (this.chunks[chunkX-1] || [])[chunkY-1] || [],
            ];
    }

    getAllInNearbyChunks(position) {
        return [].concat(...this.getNearbyChunks(position));
    }

    forEach(callback) {
        for (const chunkX in this.chunks) {
            if (this.chunks[chunkX]) for (const chunkY in this.chunks[chunkX]) {
                callback(this.chunks[chunkX][chunkY]);
            }
        }
    }

    forEachNearby(position, callback, returnOnTrue) {
        for (const chunk of this.getNearbyChunks(position)) {
            for (const item of chunk) {
                if (callback(item) === true && returnOnTrue) return true;
            }
        }
        if (returnOnTrue) return false;
    }
}