"use strict"

class Tile {
    constructor(position, atlas, rect) {
        if (!position || !atlas || !rect) throw new Error('Make sure to provide position, atlas and rect.');
        this.position = position;
        this.atlas = atlas;
        this.rect = rect;
    }

    render() {
        // Used for debug
        Renderer.render(
            { color: '#fff000' },
            { x: -HALF_TILE, y: -HALF_TILE },
            TILE_SIZE, TILE_SIZE
        );

        Renderer.render(
            { atlas: this.atlas, rect: this.rect },
            { x: -HALF_TILE, y: -HALF_TILE },
            TILE_SIZE, TILE_SIZE
        );
    }
}