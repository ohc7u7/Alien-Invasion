// ── Bullet + BulletPool (object pooling) ─────────────────────
class Bullet {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.isPlayer = true;
        this.active = false;
        this.radius = 5;

        this.trailLen = 8;
        this.trailX = new Array(this.trailLen).fill(0);
        this.trailY = new Array(this.trailLen).fill(0);
        this.trailCount = 0;
        this.trailHead = 0;
    }

    activate(x, y, vx, vy, isPlayer) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isPlayer = isPlayer;
        this.radius = isPlayer ? 5 : 4;
        this.active = true;
        this.trailCount = 0;
        this.trailHead = 0;
    }

    deactivate() {
        this.active = false;
        this.trailCount = 0;
    }

    _pushTrail(x, y) {
        this.trailX[this.trailHead] = x;
        this.trailY[this.trailHead] = y;
        this.trailHead = (this.trailHead + 1) % this.trailLen;
        if (this.trailCount < this.trailLen) this.trailCount++;
    }

    update(bw, bh) {
        if (!this.active) return;

        this._pushTrail(this.x, this.y);
        this.x += this.vx;
        this.y += this.vy;

        let w = bw || width;
        let h = bh || height;
        if (this.y < -30 || this.y > h + 30 || this.x < -30 || this.x > w + 30) {
            this.deactivate();
        }
    }

    draw() {
        if (!this.active) return;

        noStroke();
        for (let i = 0; i < this.trailCount; i++) {
            let idx = (this.trailHead - this.trailCount + i + this.trailLen) % this.trailLen;
            let a = map(i, 0, max(1, this.trailCount - 1), 30, 150);
            let s = map(i, 0, max(1, this.trailCount - 1), 1, this.radius * 0.7);
            if (this.isPlayer) fill(0, 220, 255, a);
            else fill(255, 70, 70, a);
            ellipse(this.trailX[idx], this.trailY[idx], s * 2);
        }

        if (this.isPlayer) fill(180, 240, 255);
        else fill(255, 140, 140);
        ellipse(this.x, this.y, this.radius * 2);
    }
}

class BulletPool {
    constructor(size) {
        this.pool = new Array(size);
        for (let i = 0; i < size; i++) {
            this.pool[i] = new Bullet();
        }
        this.cursor = 0;
    }

    getBullet(x, y, vx, vy, isPlayer) {
        let n = this.pool.length;
        for (let i = 0; i < n; i++) {
            let idx = (this.cursor + i) % n;
            let b = this.pool[idx];
            if (!b.active) {
                b.activate(x, y, vx, vy, isPlayer);
                this.cursor = (idx + 1) % n;
                return b;
            }
        }
        return null;
    }

    updateAll(bw, bh) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].update(bw, bh);
        }
    }

    drawAll() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].draw();
        }
    }

    deactivateAll() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].deactivate();
        }
    }
}
