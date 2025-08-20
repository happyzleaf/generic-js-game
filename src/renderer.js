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
    offset: { x: 0, y: 0 },

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
                uniform vec4 u_color;      // tint color (rgba)
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

        // unbind to be tidy
        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    createTextureFromImage(image) {
        const gl = Renderer.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // Flip the image's Y axis so the image's top-left corresponds to texture v=0.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // Use nearest filtering and clamp to edge so non-power-of-two textures work safely.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    },

    loadAtlas(id) {
        const img = document.getElementById(id);
        if (!img) return Promise.reject(new Error(`No image element with id '${id}'`));

        const setup = () => {
            return {
                image: img,
                texture: Renderer.createTextureFromImage(img),
                width: img.naturalWidth,
                height: img.naturalHeight
            };
        };

        if (img.complete && img.naturalWidth !== 0) {
            return Promise.resolve(setup());
        }

        return new Promise((resolve, reject) => {
            img.addEventListener('load', () => resolve(setup()), { once: true });
            img.addEventListener('error', () => reject(new Error(`Failed to load image '${imageId}'`)), { once: true });
        });
    },

    parseHexColor(hex) {
        if (!hex) return [1, 1, 1, 1];
        let s = hex.replace('#', '');
        if (s.length === 3) { // short form RGB -> expand
            s = s.split('').map(c => c + c).join('');
        }
        if (s.length === 6) s += 'ff';
        if (s.length !== 8) return [1, 1, 1, 1];
        const r = parseInt(s.slice(0, 2), 16) / 255;
        const g = parseInt(s.slice(2, 4), 16) / 255;
        const b = parseInt(s.slice(4, 6), 16) / 255;
        const a = parseInt(s.slice(6, 8), 16) / 255;
        return [r, g, b, a];
    },

    createShader(type, source) {
        const gl = Renderer.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    },

    createProgram(vertexShader, fragmentShader) {
        const gl = Renderer.gl;
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        return program;
    },

    push() {
        Renderer.stack.push( { x: Renderer.offset.x, y: Renderer.offset.y } );
    },

    pop() {
        Renderer.offset = Renderer.stack ? Renderer.stack.pop() : { x: 0, y: 0 };
    },

    translate(position) {
        Renderer.offset.x += position.x;
        Renderer.offset.y += position.y;
    },

    render(asset, position, width, height) {
        const x = position.x + Renderer.offset.x;
        const y = position.y + Renderer.offset.y;
        const gl = Renderer.gl;

        const program = Renderer.textureProgram;
        gl.useProgram(program);
        gl.uniform2f(Renderer.resolution, Renderer.canvas.width, Renderer.canvas.height);

        gl.bindBuffer(gl.ARRAY_BUFFER, Renderer.positionBuffer);
        const positions = [
            x, y,
            x + width, y,
            x, y + height,
            x, y + height,
            x + width, y,
            x + width, y + height
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(Renderer.position);
        gl.vertexAttribPointer(Renderer.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, Renderer.textureCoordBuffer);
        let texCoords = [
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ];

        let texture = asset.texture ?? Renderer.textureDefault;
        if (asset.atlas) {
            // atlas coordinates are provided in pixels relative to the atlas image
            texture = asset.atlas.texture;
            const u0 = asset.rect.x / asset.atlas.width;
            const v0 = asset.rect.y / asset.atlas.height;
            const u1 = (asset.rect.x + asset.rect.width) / asset.atlas.width;
            const v1 = (asset.rect.y + asset.rect.height) / asset.atlas.height;
            texCoords = [
                u0, v0,
                u1, v0,
                u0, v1,
                u0, v1,
                u1, v0,
                u1, v1
            ];
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(Renderer.textureCoord);
        gl.vertexAttribPointer(Renderer.textureCoord, 2, gl.FLOAT, false, 0, 0);

        const [r, g, b, a] = Renderer.parseHexColor(asset.color);
        gl.uniform4f(Renderer.color, r, g, b, a);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(Renderer.texture, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
}
