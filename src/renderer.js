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
    textureDefaultWhite: null,

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
        Renderer.textureDefaultWhite = defaultTexture;

        // unbind to be tidy
        gl.bindTexture(gl.TEXTURE_2D, null);
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
        const texCoords = [
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(Renderer.textureCoord);
        gl.vertexAttribPointer(Renderer.textureCoord, 2, gl.FLOAT, false, 0, 0);

        const [r, g, b, a] = Renderer.parseHexColor(asset.color);
        gl.uniform4f(Renderer.color, r, g, b, a);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, asset.texture ?? Renderer.textureDefaultWhite);
        gl.uniform1i(Renderer.texture, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
}
