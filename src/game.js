"use strict"

let lastFrameTime = 0; // last frame duration (inverse of FPS)

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Could not find canvas.');

const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
};
resize();

const camera = new Camera(canvas);

Input.setup(canvas);

Renderer.initialize(canvas);

window.addEventListener('resize', () => {
    Renderer.gl.viewport(0, 0, canvas.width, canvas.height);
    resize();
});

(async function main() {
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

    const overworldReq = await fetch('/assets/overworld.json');
    if (!overworldReq || !overworldReq.ok) throw new Error('Could not load overworld data.');
    const overworld = TiledParser.parse(await overworldReq.json());

    const player = new Player();
    const world = new World(overworld);
    world.entities.push(player);
    //world.entities.push(new Circle('c1', { x: 0, y: 0 }, 2));
    world.entities.push(new Circle('c2', { x: 200, y: 0 }));
    const walkingNPC = new Living('l1', { x: -100, y: 0 }, 15, '#ff33ff', 50);
    walkingNPC.register(new WalkInCircle(walkingNPC)); // TODO: repetition?
    world.entities.push(walkingNPC);

    const tileset = await Renderer.loadAtlas('overworld');

    const render = () => {
        const gl = Renderer.gl;
        Renderer.gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        Renderer.push();
        Renderer.translate({ x: -camera.position.x, y: -camera.position.y });
        world.render(camera, tileset);
        Renderer.pop();
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
