// ── Bullet class ──────────────────────────────────────────────
class Bullet {
    constructor(x, y, vx, vy, isPlayer) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isPlayer = isPlayer;
        this.active = true;
        this.radius = isPlayer ? 5 : 4;
        this.trail = [];
    }

    update(bw, bh) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;

        // Out of game box bounds
        let w = bw || width;
        let h = bh || height;
        if (this.y < -30 || this.y > h + 30 || this.x < -30 || this.x > w + 30) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;
        for (let i = 0; i < this.trail.length; i++) {
            let a = map(i, 0, this.trail.length, 30, 170);
            let s = map(i, 0, this.trail.length, 1, this.radius * 0.7);
            noStroke();
            if (this.isPlayer) fill(0, 220, 255, a);
            else fill(255, 60, 60, a);
            ellipse(this.trail[i].x, this.trail[i].y, s * 2);
        }
        let ctx = drawingContext;
        if (this.isPlayer) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = 'rgba(0,220,255,0.85)';
            fill(180, 240, 255);
        } else {
            ctx.shadowBlur = 16;
            ctx.shadowColor = 'rgba(255,60,60,0.85)';
            fill(255, 130, 130);
        }
        noStroke();
        ellipse(this.x, this.y, this.radius * 2);
        ctx.shadowBlur = 0;
    }
}
