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
        position = position ?? this.position;
        return position.distance(entity.position);
    }

    testMove(world, dp) {
        const dir = dp.normalize();
        const max = dp.length();
        let allowed = max;

        const next = this.position.sum(dp);

        const check = (a, b, otherPosition) => {
            const nextDistance = a.collidesWith(next, b, otherPosition);
            if (nextDistance >= 0) return; // no collision

            const currentDist = a.collidesWith(this.position, b, otherPosition);
            if (currentDist < nextDistance) return; // moving away

            // collision! calculate safe distance
            const totalChange = currentDist - nextDistance;
            let safeRatio = Math.max(0, Math.min(1, currentDist / totalChange));
            const safeDistance = safeRatio * max;
            allowed = Math.min(allowed, safeDistance);
        };

        // entities
        for (let entity of world.entities) {
            if (entity === this || !entity.colliders) continue;
            for (let a of this.colliders) {
                for (let b of entity.colliders) {
                    check(a, b, entity.position);
                }
            }
        }

        // tiles
        world.map.walk((tile, tilePosition) => {
            if (!tile.colliders) return true;
            for (let a of this.colliders) {
                for (let b of tile.colliders) {
                    check(a, b, tilePosition);
                }
            }
            return true;
        });

        if (allowed > 0) {
            const correction = dir.mult(allowed);
            this.position = this.position.sum(correction);
            return true;
        }

        return false;
    }

    move(world, dp) {
        return this.testMove(world, dp) || dp.x !== 0 && this.testMove(world, vec2(dp.x, 0)) || dp.y !== 0 && this.testMove(world, vec2(0, dp.y));
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
        super(id, position, 12, '#ffffff', 200);
    }
}
