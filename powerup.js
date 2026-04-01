// ── Power-Up system ──────────────────────────────────────────

const PU_SHIELD = 0;  // temporary invincibility
const PU_RAPID = 1;  // increased fire rate
const PU_DAMAGE = 2;  // double damage
const PU_SPEED = 3;  // faster ship

const PU_DURATION = 300; // frames (~5 sec at 60fps)

const PU_DEFS = [
    { id: PU_SHIELD, label: '🛡 SHIELD', col: [0, 220, 255], icon: '🛡' },
    { id: PU_RAPID, label: '⚡ RAPID', col: [255, 220, 50], icon: '⚡' },
    { id: PU_DAMAGE, label: '⚔ POWER', col: [255, 80, 80], icon: '⚔' },
    { id: PU_SPEED, label: '💨 SPEED', col: [80, 255, 120], icon: '💨' }
];

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.def = PU_DEFS[type];
        this.active = true;
        this.radius = 14;
        this.vy = 1.5;       // falls down slowly
        this.bobPhase = random(TWO_PI);
        this.spawnTime = frameCount;
    }

    update() {
        this.y += this.vy;
        this.x += sin((frameCount - this.spawnTime) * 0.06 + this.bobPhase) * 0.5;

        // Deactivate if falls off screen
        if (this.y > 900) this.active = false;
    }

    draw() {
        if (!this.active) return;

        let age = frameCount - this.spawnTime;
        let pulse = 0.8 + sin(age * 0.1) * 0.2;
        let c = this.def.col;

        push();
        translate(this.x, this.y);

        // Outer glow
        let ctx = drawingContext;
        ctx.shadowBlur = 18 * pulse;
        ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.7)`;

        // Circle bg
        fill(10, 10, 20, 200);
        stroke(c[0], c[1], c[2], 180);
        strokeWeight(2);
        ellipse(0, 0, this.radius * 2 * pulse);

        ctx.shadowBlur = 0;

        // Icon
        noStroke();
        fill(c[0], c[1], c[2]);
        textAlign(CENTER, CENTER);
        textSize(14);
        text(this.def.icon, 0, -1);

        pop();
    }

    collidesWith(px, py, pw) {
        return dist(this.x, this.y, px, py) < (this.radius + pw / 2.5);
    }
}

// ── Player buff tracker ──────────────────────────────────────

class BuffManager {
    constructor() {
        this.buffs = {}; // type -> remaining frames
    }

    add(type) {
        this.buffs[type] = PU_DURATION;
    }

    update() {
        for (let k in this.buffs) {
            this.buffs[k]--;
            if (this.buffs[k] <= 0) delete this.buffs[k];
        }
    }

    has(type) {
        return !!this.buffs[type];
    }

    remaining(type) {
        return this.buffs[type] || 0;
    }

    // Draw active buff icons in the HUD
    drawIndicators(x, y) {
        let ox = 0;
        for (let k in this.buffs) {
            let def = PU_DEFS[int(k)];
            if (!def) continue;
            let pct = this.buffs[k] / PU_DURATION;
            let c = def.col;

            push();
            // Bar background
            fill(20, 20, 30, 180);
            noStroke();
            rect(x + ox, y, 50, 18, 4);

            // Timer fill
            fill(c[0], c[1], c[2], 150);
            rect(x + ox, y, 50 * pct, 18, 4);

            // Icon + label
            fill(255);
            textFont('Rajdhani');
            textSize(10);
            textAlign(LEFT, CENTER);
            text(def.icon + ' ' + ceil(this.buffs[k] / 60) + 's', x + ox + 4, y + 9);
            pop();

            ox += 56;
        }
    }
}
