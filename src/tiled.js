"use strict"

// We use infinite Tiled maps divided in chunks
// Check out their editor: https://www.mapeditor.org/

class TiledChunk {
    constructor(width, height, position = { x: 0, y: 0}, data = []) {
        this.width = width;
        this.height = height;
        this.position = position;
        this.data = data;
    }

    render(tileset) {
        // tileset is the atlas object returned by Renderer.loadAtlas()
        if (!tileset) return;

        // number of tiles per row in the atlas
        const cols = Math.floor(tileset.width / TILE_SIZE);
        if (cols <= 0) return;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const index = y * this.width + x;
                const gid = this.data[index];
                if (!gid) continue; // 0 = empty

                const tileIndex = gid - 1; // Tiled GIDs start at 1
                if (tileIndex < 0) continue;

                const sx = (tileIndex % cols) * TILE_SIZE;
                const sy = Math.floor(tileIndex / cols) * TILE_SIZE;

                Renderer.render(
                    { atlas: tileset, rect: { x: sx, y: sy, width: TILE_SIZE, height: TILE_SIZE } },
                    { x: x * TILE_SIZE, y: y * TILE_SIZE },
                    TILE_SIZE, TILE_SIZE
                );
            }
        }
    }
}

class TiledLayer {
    constructor(id, width, height, visible, position = { x: 0, y: 0}, chunks = []) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.visible = visible;
        this.position = position;
        this.chunks = chunks;
    }

    render(tileset) {
        for (let chunk of this.chunks) {
            const relative = { x: chunk.position.x * TILE_SIZE, y: chunk.position.y * TILE_SIZE };
            // TODO: camera#sees
            Renderer.push();
            Renderer.translate(relative);
            chunk.render(tileset);
            Renderer.pop();
        }
    }
}

class TiledTileset{
    constructor(name, source = null, width, height, tileSize, transparentColor = null) {
        this.name = name;
        this.source = source;
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.transparentColor = transparentColor;
    }
}

class TiledMap {
    constructor(width, height, tileSize, tilesets = [], layers = []) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tileset = tilesets;
        this.layers = layers;
    }

    render(tileset) {
        for (let layer of this.layers) {
            layer.render(tileset);
        }
    }
}

const TiledParser = {
    TYPE: "map",
    COMPRESSION_LEVEL: -1,
    INFINITE: true,
    ORIENTATION: "orthogonal",
    RENDER_ORDER: "right-down",
    parse(map) {
        if (!map) throw new Error('You must provide a map.');
        if (map.type !== this.TYPE) throw new Error('The file provided is not of type map.');
        if (map.infinite !== this.INFINITE) throw new Error(`Unsupported ${this.INFINITE ? 'finite' : 'infinite'} map.`);
        if (map.orientation !== this.ORIENTATION) throw new Error('Unsupported orientation.');
        if (map.compressionlevel !== this.COMPRESSION_LEVEL) throw new Error('Unsupported compression level.');

        const tilesets = [];
        for (let tileset of map.tilesets ?? []) {
            tilesets.push(new TiledTileset(
                tileset.name,
                tileset.image,
                tileset.imagewidth, tileset.imageheight,
                tileset.tileheight,
                tileset.transparentcolor
            ));
        }

        const layers = [];
        for (let layer of map.layers ?? []) {
            const chunks = [];
            for (let chunk of layer.chunks ?? []) {
                chunks.push(new TiledChunk(
                    chunk.width, chunk.height,
                    { x: chunk.x, y: chunk.y },
                    chunk.data
                ));
            }

            layers.push(new TiledLayer(
                layer.id,
                layer.width, layer.height,
                layer.visible,
                { x: layer.startx, y: layer.starty },
                chunks
            ));
        }

        return new TiledMap(map.width, map.height, map.tileheight, tilesets, layers);
    },
};
