"use strict"

let lastFrameTime = 0; // last frame duration (inverse of FPS)

const canvas = document.getElementById("game");
if (!canvas) throw new Error('Could not find canvas.');

const ctx = canvas.getContext('2d');
const camera = new Camera(canvas);

const player = new Player();
const world = new World();
world.entities.push(player);
world.entities.push(new Circle('c1', { x: 5, y: 0 }));
world.entities.push(new Circle('c2', { x: 0, y: 0 }));
const walkingNPC = new Living('l1', { x: 0, y: 0 }, 15, 'orange', 2);
walkingNPC.register(new WalkInCircle(walkingNPC)); // TODO: repetition?
world.entities.push(walkingNPC);

const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
};
window.addEventListener('resize', resize);
resize();

Input.setup(canvas);

const update = (dt) => {
    const dir = Input.getDirection();
    if (dir) {
        player.move(
            world,
            { x: dir.dx * (player.speed / CELL_SIZE), y: dir.dy * (player.speed / CELL_SIZE) }
        );
        Input.target = null; // cancel click/tap target
    } else if (Input.target) {
        // Move toward click/tap
        const dx = Input.target.x - player.position.x;
        const dy = Input.target.y - player.position.y;
        const distance = Math.hypot(dx, dy);

        const delta = { x: (dx / distance) * (player.speed / CELL_SIZE), y: (dy / distance) * (player.speed / CELL_SIZE) };
        if (distance < 0.05 || !player.move(world, delta)) {
            Input.target = null;
        }
    }

    for (let entity of world.entities) {
        entity.update(world, dt);
    }

    camera.follow(player); // No need to move to render as the player (and camera) wont move outside updates
};

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    world.render(ctx, camera);
    renderHUD();
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
