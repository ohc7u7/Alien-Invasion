// ── Particle & Explosion system ──────────────────────────────
class Particle {
    constructor(x, y, col) {
        this.x = x;
        this.y = y;
        let a = random(TWO_PI);
        let spd = random(1.5, 7);
        this.vx = cos(a) * spd;
        this.vy = sin(a) * spd;
        this.life = 1.0;
        this.decay = random(0.015, 0.045);
        this.size = random(3, 9);
        this.col = col || [255, 200, 50];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.06;
        this.life -= this.decay;
        this.vx *= 0.97;
        this.vy *= 0.97;
    }

    draw() {
        if (this.life <= 0) return;
        let a = this.life * 255;
        let ctx = drawingContext;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${this.col[0]},${this.col[1]},${this.col[2]},${this.life * 0.5})`;
        noStroke();
        fill(this.col[0], this.col[1], this.col[2], a);
        ellipse(this.x, this.y, this.size * this.life);
        ctx.shadowBlur = 0;
    }

    isDead() { return this.life <= 0; }
}

class Explosion {
    constructor(x, y, count, colors) {
        this.particles = [];
        let cols = colors || [
            [255, 200, 50], [255, 100, 30],
            [255, 255, 100], [255, 150, 0]
        ];
        count = count || 24;
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, cols[floor(random(cols.length))]));
        }
    }
    update() {
        for (let p of this.particles) p.update();
        this.particles = this.particles.filter(p => !p.isDead());
    }
    draw() { for (let p of this.particles) p.draw(); }
    isDone() { return this.particles.length === 0; }
}

// ── Engine exhaust for the player ship ───────────────────────
class EngineExhaust {
    constructor() { this.particles = []; }

    emit(x, y) {
        for (let i = 0; i < 2; i++) {
            let p = new Particle(x + random(-8, 8), y, [0, 120 + random(135), 255]);
            p.vy = random(2, 5);
            p.vx = random(-0.5, 0.5);
            p.size = random(3, 6);
            p.decay = random(0.04, 0.07);
            this.particles.push(p);
        }
    }
    update() {
        for (let p of this.particles) p.update();
        this.particles = this.particles.filter(p => !p.isDead());
    }
    draw() { for (let p of this.particles) p.draw(); }
}
