"use strict"

class Entity {
    constructor(id, position = vec2(), colliders = null) {
        this.id = id;
        this.position = position;
        this.colliders = colliders && colliders.length ? colliders : null;
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

    render() {
        if (!this.colliders) return;

        for (let collider of this.colliders) {
            collider.render(vec2());
        }
    }

    distance(entity, position) {
        if (!position && this === entity) return 0;
        position = position ?? entity.position;
        const dx = position.x - entity.position.x;
        const dy = position.y - entity.position.y;
        return Math.hypot(dx, dy);
    }

    move(world, dp) {
        const next = this.position.sum(dp);

        if (!this.colliders) {
            this.position = next;
            return true;
        }

        // Check collisions with other entities using colliders
        for (let entity of world.entities) {
            if (entity === this) continue;
            if (!entity.colliders) continue;

            for (let a of this.colliders) {
                for (let b of entity.colliders) {
                    if (a.collidesWith(next, b, entity.position)) {
                        return false; // collision detected, cancel movement
                    }
                }
            }
        }

        const collided = !world.map.walk((tile, tilePosition) => {
            if (!tile.colliders) return true; // continue

            for (let a of this.colliders) {
                for (let b of tile.colliders) {
                    if (a.collidesWith(next, b, tilePosition)) return false; // collision! break
                }
            }

            return true; // continue
        });
        if (collided) return false;

        // Commit
        this.position = next;
        return true;
    }
}

class Circle extends Entity {
    constructor(id, position, radius = 10, color = '#aabbcc') {
        super(id, position, [new RectCollider(vec2(radius * 2, radius * 2), vec2(-radius, -radius))]);
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

        super.render();
    }

    distance(entity, position) {
        if (this === entity) return 0;
        const dx = (position ? position.x : this.position.x) - entity.position.x;
        const dy = (position ? position.y : this.position.y) - entity.position.y;
        const distance = Math.hypot(dx, dy);
        const threshold = this.radius + entity.radius;
        return distance - threshold;
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
        super(id, position, 12, '#ffffff', 5);
    }
}
