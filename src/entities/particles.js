// ── Particle + Explosion pools (object pooling) ──────────────
class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.decay = 0.03;
        this.size = 4;
        this.gravity = 0.06;
        this.drag = 0.97;
        this.col = [255, 200, 50];
        this.active = false;
    }

    activate(x, y, vx, vy, size, decay, col, gravity, drag) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.decay = decay;
        this.col = col;
        this.gravity = gravity;
        this.drag = drag;
        this.life = 1;
        this.active = true;
    }

    deactivate() {
        this.active = false;
        this.life = 0;
    }

    update() {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.life -= this.decay;
        if (this.life <= 0) this.deactivate();
    }

    draw() {
        if (!this.active) return;
        noStroke();
        fill(this.col[0], this.col[1], this.col[2], this.life * 255);
        ellipse(this.x, this.y, this.size * this.life);
    }
}

class ParticlePool {
    constructor(size) {
        this.pool = new Array(size);
        for (let i = 0; i < size; i++) {
            this.pool[i] = new Particle();
        }
        this.cursor = 0;
    }

    emit(x, y, col, cfg) {
        cfg = cfg || {};
        let angle = random(TWO_PI);
        let speedMin = cfg.speedMin ?? 1.5;
        let speedMax = cfg.speedMax ?? 7;
        let speed = random(speedMin, speedMax);

        let vx = cfg.vx !== undefined ? cfg.vx : cos(angle) * speed;
        let vy = cfg.vy !== undefined ? cfg.vy : sin(angle) * speed;
        let size = cfg.size !== undefined ? cfg.size : random(3, 9);
        let decay = cfg.decay !== undefined ? cfg.decay : random(0.015, 0.045);
        let gravity = cfg.gravity !== undefined ? cfg.gravity : 0.06;
        let drag = cfg.drag !== undefined ? cfg.drag : 0.97;

        let n = this.pool.length;
        for (let i = 0; i < n; i++) {
            let idx = (this.cursor + i) % n;
            let p = this.pool[idx];
            if (!p.active) {
                p.activate(x, y, vx, vy, size, decay, col || [255, 200, 50], gravity, drag);
                this.cursor = (idx + 1) % n;
                return p;
            }
        }
        return null;
    }

    emitBurst(x, y, count, colors, cfg) {
        let cols = colors || [[255, 200, 50], [255, 100, 30], [255, 255, 100], [255, 150, 0]];
        for (let i = 0; i < count; i++) {
            this.emit(x, y, cols[floor(random(cols.length))], cfg);
        }
    }

    updateAll() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].update();
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

class Explosion {
    constructor(particlePool) {
        this.pool = particlePool;
        this.active = false;
        this.ttl = 0;
    }

    activate(x, y, count, colors, cfg) {
        this.active = true;
        this.ttl = (cfg && cfg.ttl) ? cfg.ttl : 32;
        this.pool.emitBurst(x, y, count || 24, colors, cfg);
    }

    update() {
        if (!this.active) return;
        this.ttl--;
        if (this.ttl <= 0) this.active = false;
    }

    deactivate() {
        this.active = false;
        this.ttl = 0;
    }
}

class ExplosionPool {
    constructor(size, particlePool) {
        this.pool = new Array(size);
        this.cursor = 0;
        for (let i = 0; i < size; i++) {
            this.pool[i] = new Explosion(particlePool);
        }
    }

    getExplosion(x, y, count, colors, cfg) {
        let n = this.pool.length;
        for (let i = 0; i < n; i++) {
            let idx = (this.cursor + i) % n;
            let e = this.pool[idx];
            if (!e.active) {
                e.activate(x, y, count, colors, cfg);
                this.cursor = (idx + 1) % n;
                return e;
            }
        }
        return null;
    }

    updateAll() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].update();
        }
    }

    deactivateAll() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].deactivate();
        }
    }
}
