"use strict"

// We use infinite Tiled maps divided in chunks
// Check out their editor: https://www.mapeditor.org/

class TiledChunk {
    constructor(rect, data = []) {
        this.rect = rect;
        this.data = data;
    }

    render(tileset) {
        for (let y = 0; y < this.rect.height; y++) {
            for (let x = 0; x < this.rect.width; x++) {
                const index = y * this.rect.width + x;
                const gid = this.data[index];
                if (!gid) continue; // 0 = empty
                tileset.render(gid - 1, x, y);
            }
        }
    }
}

class TiledLayer {
    constructor(id, rect, visible = true, chunks = []) {
        this.id = id;
        this.rect = rect;
        this.visible = visible;
        this.chunks = chunks;
    }

    render(tileset) {
        if (!this.visible) return;

        for (let chunk of this.chunks) {
            const relative = chunk.rect.position.mult(TILE_SIZE);
            // TODO: camera#sees
            Renderer.push();
            Renderer.translate(relative);
            chunk.render(tileset);
            Renderer.pop();
        }
    }
}

class TiledTile {
    constructor(id, colliders = null) {
        this.id = id;
        this.colliders = colliders && colliders.length ? colliders : null;
    }

    renderColliders(x, y) {
        if (!this.colliders) return;

        for (let collider of this.colliders) {
            Renderer.render(
                { color: '#ff0000bb' },
                rect(
                    vec2(x, y).mult(TILE_SIZE).sum(collider.position),
                    collider.width, collider.height
                )
            );
        }
    }
}

class TiledTileset{
    constructor(id, source, width, height, columns, tileSize, transparentColor = null, tiles = null) {
        this.id = id;
        this.source = source;
        this.width = width;
        this.height = height;
        this.columns = columns;
        this.tileSize = tileSize;
        this.transparentColor = transparentColor;

        this.atlas = null;
        this.tiles = tiles && tiles.size ? tiles : null;
    }

    async load() {
        const element = document.querySelector(`[data-source='${this.source}']`);
        if (!element) throw new Error(`Could not find element with atlas of source '${this.source}'.`);
        this.atlas = await Renderer.loadAtlas(this.id, element);    
    }

    render(i, x, y) {
        const sx = (i % this.columns) * TILE_SIZE;
        const sy = Math.floor(i / this.columns) * TILE_SIZE;

        Renderer.render(
            { atlas: this.atlas, rect: square(vec2(sx, sy), TILE_SIZE) },
            square(vec2(x, y).mult(TILE_SIZE), TILE_SIZE)
        );

        const extra = this.tiles ? this.tiles.get(i) : null;
        if (extra) extra.renderColliders(x, y);
    }
}

class TiledMap {
    constructor(tileSize, tilesets = [], layers = []) {
        this.tileSize = tileSize;
        this.tilesets = tilesets;
        this.layers = layers;
    }

    async load() {
        for (let tileset of this.tilesets) {
            await tileset.load();
        }
    }

    render() {
        const tileset = this.tilesets[0];
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
    COLLIDER_TYPE: "objectgroup",
    parse(map) {
        if (!map) throw new Error('You must provide a map.');
        if (map.type !== TiledParser.TYPE) throw new Error('The file provided is not of type map.');
        if (map.infinite !== TiledParser.INFINITE) throw new Error(`Unsupported ${TiledParser.INFINITE ? 'finite' : 'infinite'} map.`);
        if (map.orientation !== TiledParser.ORIENTATION) throw new Error('Unsupported orientation.');
        if (map.compressionlevel !== TiledParser.COMPRESSION_LEVEL) throw new Error('Unsupported compression level.');

        const tilesets = [];
        for (let tileset of map.tilesets ?? []) {
            const tiles = new Map();
            for (let tile of tileset.tiles ?? []) {
                let collider = tile.objectgroup;
                let colliders = [];
                if (collider) {
                    if (collider.type !== TiledParser.COLLIDER_TYPE) throw new Error('Unsupported collider type.');

                    for (let block of collider.objects ?? []) {
                        colliders.push(rect(
                            vec2(collider.x + block.x, collider.y + block.y),
                            block.width, block.height
                        ));
                    }
                }

                tiles.set(tile.id, new TiledTile(
                    tile.id,
                    colliders
                ));
            }

            tilesets.push(new TiledTileset(
                tileset.name,
                tileset.image,
                tileset.imagewidth, tileset.imageheight,
                tileset.columns,
                tileset.tileheight,
                tileset.transparentcolor,
                tiles
            ));
        }

        const layers = [];
        for (let layer of map.layers ?? []) {
            const chunks = [];
            for (let chunk of layer.chunks ?? []) {
                chunks.push(new TiledChunk(
                    rect(
                        vec2(chunk.x, chunk.y),
                        chunk.width, chunk.height
                    ),
                    chunk.data
                ));
            }

            layers.push(new TiledLayer(
                layer.id,
                rect(
                    vec2(layer.startx, layer.starty),
                    layer.width, layer.height,
                ),
                layer.visible,
                chunks
            ));
        }

        return new TiledMap(map.tileheight, tilesets, layers);
    },
};
