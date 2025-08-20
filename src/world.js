"use strict"

class World {
    constructor() {
        this.entities = [];
        this.tiles = []; // TODO: just make it a map
    }

    render(camera) {
        for (let tile of this.tiles) {
            const relative = { x: tile.position.x * TILE_SIZE, y: tile.position.y * TILE_SIZE };
            if (camera.sees(relative)) {
                Renderer.push();
                Renderer.translate(relative);
                tile.render();
                Renderer.pop();
            }
        }

        for (let entity of this.entities) {
            if (camera.sees(entity.position)) {
                Renderer.push();
                Renderer.translate(entity.position);
                entity.render();
                Renderer.pop();
            }
        }
    }
}