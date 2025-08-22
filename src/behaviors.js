"use strict"

class Behavior {
    constructor(entity) {
        if (!entity) throw new Error('You must provide an entity to instantiate behavior.');
        this.entity = entity;
    }

    update(world, dt) {}
}

class WalkInCircle extends Behavior {
    constructor(entity, angle = 0, radius = 80, center = null) {
        if (!(entity instanceof Living)) throw new Error('Entity must be living to walk in circles.')
        super(entity);
        this.angle = angle;
        this.radius = radius;
        this.center = center ?? vec2(entity.position.x - radius, entity.position.y);
    }

    update(world, dt) {
        const angularSpeed = this.entity.speed / this.radius;

        const targetAngle = this.angle + angularSpeed * dt;
        const targetX = this.center.x + Math.cos(targetAngle) * this.radius;
        const targetY = this.center.y + Math.sin(targetAngle) * this.radius;

        const delta = vec2(targetX - this.entity.position.x, targetY - this.entity.position.y);
        if (this.entity.move(world, delta)) this.angle = targetAngle;
    }
}