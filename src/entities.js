"use strict"

class Entity {
    constructor(id, position = vec2()) {
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
    constructor(id, position, radius = 10, color = '#aabbcc') {
        super(id, position);
        this.radius = radius;
        this.color = color;
    }

    render() {
        Renderer.render(
            { color: this.color },
            square(
                vec2(-this.radius, -this.radius),
                this.radius * 2,
            )
        );
    }

    distance(entity, position) {
        if (this === entity) return 0;
        //if (!(entity instanceof Circle)) return 0;
        const dx = (position ? position.x : this.position.x) - entity.position.x;
        const dy = (position ? position.y : this.position.y) - entity.position.y;
        const distance = Math.hypot(dx, dy);
        const threshold = this.radius + entity.radius;
        return distance - threshold;
    }

    move(world, dp) {
        const next = this.position.sum(dp);

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

class Living extends Circle {
    constructor(id, position, radius, color, speed = 0) {
        super(id, position, radius, color);
        this.speed = speed; // pixels per frame
    }
}

class Player extends Living {
    constructor(id = 'Player', position) {
        super(id, position, 12, '#ff0000', 5);
    }
}
