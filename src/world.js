"use strict"

class World {
    constructor() {
        this.entities = [];
    }

    render(camera) {
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