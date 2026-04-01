// ── Enemy class ──────────────────────────────────────────────
class Enemy {
    constructor() {
        this.active = false;
        this.w = 52;
        this.h = 52;
    }

    activate(x, y, type, pattern, patternParams) {
        this.x = x;
        this.spawnTargetY = y;
        this.y = -80;
        this.type = type || 1;
        this.pattern = pattern || 'horizontal';
        this.pp = patternParams || {};
        this.spawning = true;
        this.active = true;
        this.w = 52;
        this.h = 52;
        this.flip = 1;
        this.t0 = 0;
        this.flashTimer = 0;
        this.elite = false; // set externally to mark as power-up carrier

        let levelMult = player ? player.level : 1; 
        let hpScale = 1 + (levelMult - 1) * 0.4; 
        let speedScale = 1 + (levelMult - 1) * 0.05;

        if (this.type === 1) { this.hearts = 2 * hpScale; this.maxH = 2 * hpScale; this.bulletType = 0; this.speed = 2.8 * speedScale; }
        else if (this.type === 2) { this.hearts = 4 * hpScale; this.maxH = 4 * hpScale; this.bulletType = 1; this.speed = 3.0 * speedScale; }
        else { this.hearts = 6 * hpScale; this.maxH = 6 * hpScale; this.bulletType = 2; this.speed = 2.4 * speedScale; }

   
        let fireRateScale = max(0.4, 1 - (levelMult - 1) * 0.08); 
        this.shotInterval = (this.pp.shotInterval || 1800) * fireRateScale;
        this.shotJitter = this.pp.shotJitter || 600;
        this.nextShotAt = 0;
    }

    start() {
        this.t0 = millis();
        this.nextShotAt = millis() + random(800, this.shotInterval);
    }

    update(bulletPool, bw, bh) {
        if (!this.active) return;

        if (this.spawning) {
            let dy = this.spawnTargetY - this.y;
            this.y += dy * 0.15;
            if (abs(dy) < 4) { this.y = this.spawnTargetY; this.spawning = false; this.start(); }
            return;
        }

        if (this.pattern === 'static') { this.y = -300; return; }

        let elapsed = (millis() - this.t0) / 1000;
        let boxW = bw || width;

        switch (this.pattern) {
            case 'horizontal':
                if (this.flip === 1) { this.x += this.speed; if (this.x >= boxW - this.w / 2) this.flip = 0; }
                else { this.x -= this.speed; if (this.x <= this.w / 2) this.flip = 1; }
                break;
            case 'sine':
                let amp = this.pp.amp || 70;
                let freq = this.pp.freq || 0.5;
                let cx = this.pp.cx || boxW / 2;
                this.x = cx + sin(elapsed * freq * TWO_PI) * amp;
                break;
        }

        if (millis() >= this.nextShotAt) {
            this.shoot(bulletPool);
            this.nextShotAt = millis() + this.shotInterval + random(this.shotJitter);
        }

        if (this.flashTimer > 0) this.flashTimer--;
    }

    shoot(bulletPool) {
        let spd = 7.5;
        let bx = this.x, by = this.y + this.h / 2;
        switch (this.bulletType) {
            case 0:
                bulletPool.getBullet(bx, by, 0, spd, false);
                break;
            case 1:
                [70, 90, 110].forEach(d => {
                    let r = radians(d);
                    bulletPool.getBullet(bx, by, cos(r) * spd, sin(r) * spd, false);
                });
                break;
            case 2:
                [70, 110].forEach(d => {
                    let r = radians(d);
                    bulletPool.getBullet(bx - 30, by, cos(r) * spd, sin(r) * spd, false);
                    bulletPool.getBullet(bx + 30, by, cos(r) * spd, sin(r) * spd, false);
                });
                bulletPool.getBullet(bx - 18, by, 0, spd, false);
                bulletPool.getBullet(bx + 18, by, 0, spd, false);
                break;
        }
    }

    hit(dmg) {
        this.hearts -= dmg;
        this.flashTimer = 8;
        return this.hearts <= 0;
    }

    draw(sprite) {
        if (!this.active || this.pattern === 'static') return;
        push();
        translate(this.x, this.y);

        // Elite enemies have a pulsing gold/green glow
        if (this.elite) {
            let ep = (sin(frameCount * 0.12) + 1) * 0.5;
            // Pulsing tint
            tint(255, 200 + ep * 55, 50 + ep * 80);
        }

        if (this.flashTimer > 0) tint(255, 160, 160);

        imageMode(CENTER);
        if (sprite) image(sprite, 0, 0, this.w, this.h);
        else { fill(255, 80, 80); noStroke(); rectMode(CENTER); rect(0, 0, this.w, this.h, 6); }

        if (this.flashTimer > 0 || this.elite) noTint();

        // Elite star indicator
        if (this.elite) {
            fill(255, 220, 50);
            noStroke();
            textSize(12);
            textAlign(CENTER, CENTER);
            text('★', 0, -this.h / 2 - 8);
        }

        pop();

        if (this.hearts < this.maxH) {
            let bw = 38, barH = 4;
            let pct = max(0, this.hearts / this.maxH);
            noStroke();
            fill(30, 30, 40, 180);
            rect(this.x - bw / 2, this.y - this.h / 2 - 10, bw, barH, 2);
            fill(lerpColor(color(255, 50, 50), color(50, 255, 50), pct));
            rect(this.x - bw / 2, this.y - this.h / 2 - 10, bw * pct, barH, 2);
        }
    }
}
