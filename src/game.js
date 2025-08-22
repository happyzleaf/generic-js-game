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
        let dir = Input.getDirection();
        if (dir && dir.length()) {
            Input.target = null; // cancel click target when using keyboard
        } else if (Input.target) {
            dir = Input.target.sub(player.position);
            if (dir.length() < player.radius) Input.target = null;
        }

        const dp = dir.normalize().mult(player.speed);
        if (dp.length() && !player.move(world, dp)) Input.target = null;

        world.update(dt);

        camera.move(player.position);
    };

    const overworldFile = await fetch('/assets/overworld.json');
    if (!overworldFile || !overworldFile.ok) throw new Error('Could not load overworld data.');
    const overworld = TiledParser.parse(await overworldFile.json());

    const player = new Player();
    const world = new World(overworld);
    world.entities.push(player);
    //world.entities.push(new Circle('c1', vec2(), 2));
    world.entities.push(new Circle('c2', vec2(200, 0)));
    const walkingNPC = new Living('l1', vec2(-100, 0), 15, '#ff33ff', 50);
    walkingNPC.register(new WalkInCircle(walkingNPC)); // TODO: repetition?
    world.entities.push(walkingNPC);

    // Loading tilesets
    await overworld.load();

    const render = () => {
        const gl = Renderer.gl;
        Renderer.gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        Renderer.push();
        Renderer.translate(camera.position.mult(-1));
        world.render(camera);
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
