"use strict"

let lastFrameTime = 0; // last frame duration (inverse of FPS)

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Could not find canvas.');

const camera = new Camera(canvas);

const player = new Player();
const world = new World();
world.entities.push(player);
//world.entities.push(new Circle('c1', { x: 0, y: 0 }, 2));
world.entities.push(new Circle('c2', { x: 200, y: 0 }));
const walkingNPC = new Living('l1', { x: -100, y: 0 }, 15, '#ff33ff', 50);
walkingNPC.register(new WalkInCircle(walkingNPC)); // TODO: repetition?
world.entities.push(walkingNPC);

Input.setup(canvas);

const update = (dt) => {
    const dir = Input.getDirection();
    if (dir) {
        player.move(
            world,
            { x: dir.dx * player.speed, y: dir.dy * player.speed }
        );
        Input.target = null; // cancel click/tap target
    } else if (Input.target) {
        // Move toward click/tap
        const dx = Input.target.x - player.position.x;
        const dy = Input.target.y - player.position.y;
        const distance = Math.hypot(dx, dy);

        const dp = { x: (dx / distance) * player.speed, y: (dy / distance) * player.speed };
        if (distance < player.radius || !player.move(world, dp)) {
            Input.target = null;
        }
    }

    for (let entity of world.entities) {
        entity.update(world, dt);
    }

    camera.move(player.position);
};

(async function main() {
    Renderer.initialize(canvas);
    const sprites = await Renderer.loadAtlas('sprites');

    const resize = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        Renderer.gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    world.tiles.push(new Tile({ x: 0, y: 0 }, sprites, { x: 16, y: 205, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 1, y: 0 }, sprites, { x: 16 + HALF_TILE, y: 205, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 2, y: 2 }, sprites, { x: 16 + HALF_TILE, y: 205 + HALF_TILE, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 2, y: 1 }, sprites, { x: 16, y: 205 + HALF_TILE, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 2, y: -1 }, sprites, { x: 16, y: 205 - HALF_TILE, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 2, y: -2 }, sprites, { x: 16 + TILE_SIZE, y: 205 - HALF_TILE, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 2, y: -3 }, sprites, { x: 16 + TILE_SIZE, y: 205 - TILE_SIZE, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 2, y: -4 }, sprites, { x: 16 + TILE_SIZE + HALF_TILE, y: 206, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 2, y: -5 }, sprites, { x: 16 + TILE_SIZE + HALF_TILE, y: 206 - TILE_SIZE - HALF_TILE, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 2, y: 0 }, sprites, { x: 16 + TILE_SIZE + HALF_TILE, y: 206 - TILE_SIZE - HALF_TILE, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 3, y: 0 }, sprites, { x: 16 + TILE_SIZE, y: 206 - TILE_SIZE - HALF_TILE, width: HALF_TILE, height: HALF_TILE }));
    world.tiles.push(new Tile({ x: 4, y: 0 }, sprites, { x: 16 + TILE_SIZE + TILE_SIZE, y: 206 - TILE_SIZE, width: HALF_TILE, height: HALF_TILE }));
    
    const renderHUD = () => {
        ctx.save();
        ctx.resetTransform(); // draw in screen space
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';

        // Location
        ctx.fillText(`(${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)})`, 10, 20);

        // Framerate
        ctx.textAlign = 'end';
        const fps = lastFrameTime ? 1 / lastFrameTime : 0;
        ctx.fillText(`${Math.floor(fps)} FPS`, canvas.width - 10, 20);

        ctx.restore();
    };

    const render = () => {
        const gl = Renderer.gl;
        Renderer.gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        Renderer.push();
        Renderer.translate({ x: -camera.position.x, y: -camera.position.y });
        world.render(camera);
        Renderer.pop();

        // renderHUD();
    };

    let accumulator = 0;
    let last = performance.now();
    const loop = () => {
        const now = performance.now();
        let frameTime = lastFrameTime = (now - last) / 1000;
        if (frameTime > .25) frameTime = .25; // Skipping frames when lagging behind
        last = now;

        for (accumulator += frameTime; accumulator >= STEP; accumulator -= STEP) {
            update(STEP);
        }

        render();
        requestAnimationFrame(loop);
    };

    loop();
})();
