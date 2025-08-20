"use strict"

class World {
    constructor() {
        this.entities = [];
    }

    render(ctx, camera) {
        ctx.save();

        ctx.translate(-camera.position.x, -camera.position.y);
        for (let entity of this.entities) {
            if (camera.sees(entity)) {
                entity.render(ctx);
            }
        }

        ctx.restore();
    }
}