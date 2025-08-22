"use strict"

class World {
    constructor(map) {
        this.map = map;
        this.entities = [];
    }

    update(dt) {
        for (let entity of this.entities) {
            entity.update(this, dt);
        }
    }

    render(camera, tileset) {
        if (this.map) this.map.render(tileset);

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