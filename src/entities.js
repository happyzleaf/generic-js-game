"use strict"

class Entity {
    constructor(id, position = { x: 0, y: 0 }) {
        this.id = id;
        this.position = position;
    }

    register(behavior) {
        if (!(behavior instanceof Behavior)) throw new Error('You need to provide a behavior to register.');
        if (!this.behaviors) this.behaviors = [];
        this.behaviors.push(behavior);
    }

    update(world, dt) {
        if (!this.behaviors) return;
        for (let behavior of this.behaviors) {
            behavior.update(world, dt);
        }
    }

    render() {}

    distance(entity, position) {
        return false;
    }
}

class Circle extends Entity {
    constructor(id, position, radius = 10, color = 'black') {
        super(id, position);
        this.radius = radius;
        this.color = color;
    }

    render(ctx) {
        const px = this.position.x * CELL_SIZE;
        const py = this.position.y * CELL_SIZE;

        ctx.beginPath();
        ctx.arc(px, py, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    distance(entity, position) {
        if (this === entity) return 0;
        //if (!(entity instanceof Circle)) return 0;
        const dx = (position ? position.x : this.position.x) - entity.position.x;
        const dy = (position ? position.y : this.position.y) - entity.position.y;
        const distance = Math.hypot(dx, dy);
        const threshold = (this.radius + entity.radius) / CELL_SIZE;
        return distance - threshold;
    }
}

class Living extends Circle {
    constructor(id, position, radius, color, speed = 0) {
        super(id, position, radius, color);
        this.speed = speed; // pixels per frame
    }

    move(world, delta) {
        const next = { x: this.position.x + delta.x, y: this.position.y + delta.y };

        // check collisions
        for (let entity of world.entities) {
            const nextDistance = this.distance(entity, next);
            if (nextDistance >= 0) continue;

            const currentDistance = this.distance(entity);
            if (currentDistance >= nextDistance) return false;
        }

        // no collision
        this.position = next;
        return true;
    }
}

class Player extends Living {
    constructor(id = 'Player', position) {
        super(id, position, 12, 'red', 5);
    }
}
