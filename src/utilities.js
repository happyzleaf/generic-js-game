"use strict"

const hex2rgba = (hex) => {
    if (!hex) return [1, 1, 1, 1];

    let s = hex.replace('#', '');
    if (s.length === 3) s = s.split('').map(c => c + c).join('');
    if (s.length === 6) s += 'ff';
    if (s.length !== 8) return [1, 1, 1, 1];

    const r = parseInt(s.slice(0, 2), 16) / 255;
    const g = parseInt(s.slice(2, 4), 16) / 255;
    const b = parseInt(s.slice(4, 6), 16) / 255;
    const a = parseInt(s.slice(6, 8), 16) / 255;
    return [r, g, b, a];
};

const isNumber = (n) => {
    return typeof(n) === "number";
}

const vec2 = (x, y) => new Vec2(x ?? 0, y ?? 0);
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return new Vec2(this.x, this.y);
    }

    sum(operand) {
        // Scalar
        if (isNumber(operand)) {
            return new Vec2(this.x + operand, this.y + operand);
        }

        // Vectorial
        if (operand instanceof Vec2) {
            return new Vec2(this.x + operand.x, this.y + operand.y);
        }

        throw new Error('Operand not recognized.');
    }

    mult(operand) {
        // Scalar
        if (isNumber(operand)) {
            return new Vec2(this.x * operand, this.y * operand);
        }

        // Vectorial
        if (operand instanceof Vec2) {
            return new Vec2(this.x * operand.x, this.y * operand.y);
        }

        throw new Error('Operand not recognized.');
    }
}

const rect = (p, w, h) => new Rect(p, w, h);
class Rect {
    constructor(position, width, height) {
        this.position = position;
        this.width = width;
        this.height = height;
    }

    copy() {
        return new Rect(this.position.copy(), this.width, this.height); // TODO: copy position?
    }
}

const square = (p, h) => new Square(p, h);
class Square extends Rect {
    constructor(position, height) {
        super(position, height, height);
    }

    copy() {
        return new Square(this.position.copy(), this.height); // TODO: copy position?
    }
}
