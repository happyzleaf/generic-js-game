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

        const thisPos = this.offset ? position.sum(this.offset) : position;
        const otherPos = collider.offset ? colliderPosition.sum(collider.offset) : colliderPosition;

        // Edges
        const thisLeft   = thisPos.x;
        const thisTop    = thisPos.y;
        const thisRight  = thisLeft + this.size.x;
        const thisBottom = thisTop + this.size.y;
        const otherLeft   = otherPos.x;
        const otherTop    = otherPos.y;
        const otherRight  = otherLeft + collider.size.x;
        const otherBottom = otherTop + collider.size.y;

        // Gaps
        const horizontalGap = Math.max(thisLeft - otherRight, otherLeft - thisRight);
        const verticalGap   = Math.max(thisTop - otherBottom, otherTop - thisBottom);

        if (horizontalGap > 0 || verticalGap > 0) {
            // No collision
            return Math.max(horizontalGap, verticalGap); // distance
        }

        // collision! return how much they be touchin
        const overlapWidth  = Math.min(thisRight, otherRight) - Math.max(thisLeft, otherLeft);
        const overlapHeight = Math.min(thisBottom, otherBottom) - Math.max(thisTop, otherTop);
        return -Math.min(overlapWidth, overlapHeight);
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
