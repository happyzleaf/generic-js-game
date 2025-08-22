"use strict"

class Camera {
    constructor(canvas, position = vec2()) {
        this.canvas = canvas;
        this.position = position;
    }

    move(position) {
        this.position.x = position.x - this.canvas.width / 2;
        this.position.y = position.y - this.canvas.height / 2;
    }

    sees(position) {
        const px = position.x;
        const py = position.y;
        return (
            px > this.position.x &&
            px < this.position.x + this.canvas.width &&
            py > this.position.y &&
            py < this.position.y + this.canvas.height
        );
    }
}