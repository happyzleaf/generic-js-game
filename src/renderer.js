'use strict';

const Renderer = {
    canvas: null,
    gl: null,

    resolution: null,

    position: null,
    positionBuffer: null,

    color: null,
    texture: null,
    textureCoord: null,
    textureCoordBuffer: null,
    textureProgram: null,
    textureDefault: null,

    stack: [],
    offset: vec2(),

    atlases: new Map(),

    initialize(canvas) {
        Renderer.canvas = canvas;
        const gl = Renderer.gl = canvas.getContext('webgl');
        if (!gl) throw new Error('WebGL not supported.');

        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        Renderer.textureProgram = Renderer.createProgram(
            Renderer.createShader(gl.VERTEX_SHADER, `
                attribute vec2 a_position;
                attribute vec2 a_texCoord;
                uniform vec2 u_resolution;
                varying vec2 v_texCoord;

                void main() {
                    vec2 normalized = a_position / u_resolution * 2.0 - 1.0;
                    normalized.y *= -1.0; // Flip y
                    gl_Position = vec4(normalized, 0, 1);
                    v_texCoord = a_texCoord;
                }
            `),
            Renderer.createShader(gl.FRAGMENT_SHADER, `
                precision mediump float;
                uniform sampler2D u_texture;
                uniform vec4 u_color;
                varying vec2 v_texCoord;

                void main() {
                    vec4 tex = texture2D(u_texture, v_texCoord);
                    gl_FragColor = tex * u_color;
                }
            `)
        );

        // Look up attributes / uniforms
        Renderer.resolution = gl.getUniformLocation(Renderer.textureProgram, 'u_resolution');
        Renderer.position = gl.getAttribLocation(Renderer.textureProgram, 'a_position');
        Renderer.texture = gl.getUniformLocation(Renderer.textureProgram, 'u_texture');
        Renderer.textureCoord = gl.getAttribLocation(Renderer.textureProgram, 'a_texCoord');
        Renderer.color = gl.getUniformLocation(Renderer.textureProgram, 'u_color');

        Renderer.positionBuffer = gl.createBuffer();
        Renderer.textureCoordBuffer = gl.createBuffer();

        const defaultTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, defaultTexture);
        const whitePixel = new Uint8Array([255, 255, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        Renderer.textureDefault = defaultTexture;
    },

    createTextureFromImage(image) {
        const gl = Renderer.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Fix non-power-of-two textures
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    },

    loadAtlas(id, image) {
        if (Renderer.atlases.has(id)) throw new Error(`There is already an atlas with the id '${id}'.`);

        const retrieve = () => {
            if (Renderer.atlases.has(id)) throw new Error(`There is (now) already an atlas with the id '${id}'.`);

            const atlas = {
                id,
                image,
                texture: Renderer.createTextureFromImage(image),
                width: image.naturalWidth,
                height: image.naturalHeight
            };

            Renderer.atlases.set(id, atlas);

            return atlas;
        };

        if (image.complete && image.naturalWidth !== 0) {
            return Promise.resolve(retrieve());
        }

        return new Promise((resolve, reject) => {
            image.addEventListener('load', () => resolve(retrieve()), { once: true });
            image.addEventListener('error', () => reject(new Error(`Failed to load image '${id}'.`)), { once: true });
        });
    },

    createShader(type, source) {
        const gl = Renderer.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));

        return shader;
    },

    createProgram(vertexShader, fragmentShader) {
        const gl = Renderer.gl;
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));

        return program;
    },

    push() {
        Renderer.stack.push(Renderer.offset.copy());
    },

    pop() {
        Renderer.offset = Renderer.stack && Renderer.stack.length ? Renderer.stack.pop() : vec2();
    },

    translate(position) {
        Renderer.offset = Renderer.offset.sum(position);
    },

    render(asset, rect) {
        const x = rect.position.x + Renderer.offset.x;
        const y = rect.position.y + Renderer.offset.y;
        const gl = Renderer.gl;

        const program = Renderer.textureProgram;
        gl.useProgram(program);
        gl.uniform2f(Renderer.resolution, Renderer.canvas.width, Renderer.canvas.height);

        gl.bindBuffer(gl.ARRAY_BUFFER, Renderer.positionBuffer);
        const positions = [
            x, y,
            x + rect.width, y,
            x, y + rect.height,
            x, y + rect.height,
            x + rect.width, y,
            x + rect.width, y + rect.height
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(Renderer.position);
        gl.vertexAttribPointer(Renderer.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, Renderer.textureCoordBuffer);

        let texture = asset.texture ?? Renderer.textureDefault;
        let coordinates = [
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ];

        if (asset.atlas) {
            texture = asset.atlas.texture;
            const u0 = asset.rect.position.x / asset.atlas.width;
            const v0 = asset.rect.position.y / asset.atlas.height;
            const u1 = (asset.rect.position.x + asset.rect.width) / asset.atlas.width;
            const v1 = (asset.rect.position.y + asset.rect.height) / asset.atlas.height;
            coordinates = [
                u0, v0,
                u1, v0,
                u0, v1,
                u0, v1,
                u1, v0,
                u1, v1
            ];
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordinates), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(Renderer.textureCoord);
        gl.vertexAttribPointer(Renderer.textureCoord, 2, gl.FLOAT, false, 0, 0);

        const [r, g, b, a] = hex2rgba(asset.color);
        gl.uniform4f(Renderer.color, r, g, b, a);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(Renderer.texture, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
}
