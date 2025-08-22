"use strict"

class Collider {
    collidesWith(position, collider, colliderPosition) {};
    render(position) {};
}

class RectCollider extends Collider {
    constructor(size = vec2(), offset = null) {
        super();
        this.size = size;
        this.offset = offset;
    }

    collidesWith(position, collider, colliderPosition) {
        if (!(collider instanceof RectCollider)) throw new Error('Unsupported collision.');

        let aPos = position;
        if (this.offset) aPos = aPos.sum(this.offset);

        let bPos = colliderPosition;
        if (collider.offset) bPos = bPos.sum(collider.offset);

        const aLeft = aPos.x;
        const aTop = aPos.y;
        const aRight = aPos.x + this.size.x;
        const aBottom = aPos.y + this.size.y;

        const bLeft = bPos.x;
        const bTop = bPos.y;
        const bRight = bPos.x + collider.size.x;
        const bBottom = bPos.y + collider.size.y;

        // No overlap if one rectangle is completely to one side of the other
        const separated = aRight <= bLeft || aLeft >= bRight || aBottom <= bTop || aTop >= bBottom;
        return !separated;
    }

    render(position) {
        if (this.offset) position = position.sum(this.offset);

        Renderer.render(
            { color: '#ff0000bb' },
            rect(
                position,
                this.size.x, this.size.y
            )
        );
    }
}

class CircleCollider extends Collider {

}
