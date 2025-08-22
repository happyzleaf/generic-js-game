"use strict"

const Input = {
    keys: {},
    target: null,
    setup(canvas) {
        // Keyboard
        window.addEventListener('keydown', (e) => { Input.keys[e.key.toLowerCase()] = true; });
        window.addEventListener('keyup',   (e) => { Input.keys[e.key.toLowerCase()] = false; });

        // Mouse
        canvas.addEventListener('mousedown', (e) => {
            Input.target = Input.getWorldPosition(canvas, e.clientX, e.clientY);
        });
        canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) {
                Input.target = Input.getWorldPosition(canvas, e.clientX, e.clientY);
            }
        });

        // Touch
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            Input.target = Input.getWorldPosition(canvas, touch.clientX, touch.clientY);
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            Input.target = Input.getWorldPosition(canvas, touch.clientX, touch.clientY);
        }, { passive: false });
    },

    getWorldPosition(canvas, clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left + camera.position.x;
        const y = clientY - rect.top + camera.position.y;
        return { x, y };
    },

    getDirection() {
        let dx = 0, dy = 0;
        if (Input.keys['w'] || Input.keys['arrowup']) dy -= 1;
        if (Input.keys['s'] || Input.keys['arrowdown']) dy += 1;
        if (Input.keys['a'] || Input.keys['arrowleft']) dx -= 1;
        if (Input.keys['d'] || Input.keys['arrowright']) dx += 1;

        const length = Math.hypot(dx, dy);
        if (length === 0) return null;
        return vec2(dx / length, dy / length);
    },
};