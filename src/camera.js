"use strict"

class Camera {
    constructor(canvas, position = { x: 0, y: 0 }) {
        this.canvas = canvas;
        this.position = position; // top-left
    }

    follow(entity) {
        const targetX = entity.position.x * CELL_SIZE;
        const targetY = entity.position.y * CELL_SIZE;

        const viewportWidth = canvas.width;
        const viewportHeight = canvas.height;

        this.position.x = targetX - viewportWidth / 2;
        this.position.y = targetY - viewportHeight / 2;
    }

    sees(entity) {
        const px = entity.position.x * CELL_SIZE;
        const py = entity.position.y * CELL_SIZE;

        const viewportWidth = canvas.width;
        const viewportHeight = canvas.height;

        return (
            px + CELL_SIZE > this.position.x &&
            px - CELL_SIZE < this.position.x + viewportWidth &&
            py + CELL_SIZE > this.position.y &&
            py - CELL_SIZE < this.position.y + viewportHeight
        );
    }
}