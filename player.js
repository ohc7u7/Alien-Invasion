// ── Player class ─────────────────────────────────────────────
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.w = 54;
        this.h = 60;

        this.health = 15;
        this.maxHealth = 15;
        this.score = 0;
        this.damage = 2;

        this.exp = 0;
        this.expToLevel = 1000;
        this.level = 1;

        this.lastShotTime = 0;
        this.shotCadence = 550;
        this.prevShoot = false;
        this._prevKbShoot = false;
        this.kbSpeed = 5;

        this.exhaust = new EngineExhaust();
        this.iFrames = 0;
        this.tilt = 0;
    }

    update(handX, handY, shooting, playerBullets, bw, bh) {
        // Keyboard movement (WASD / arrows)
        let kbMoved = false;
        if (keyIsDown(65) || keyIsDown(37)) { this.targetX = this.x - this.kbSpeed; kbMoved = true; }
        if (keyIsDown(68) || keyIsDown(39)) { this.targetX = this.x + this.kbSpeed; kbMoved = true; }
        if (keyIsDown(87) || keyIsDown(38)) { this.targetY = this.y - this.kbSpeed; kbMoved = true; }
        if (keyIsDown(83) || keyIsDown(40)) { this.targetY = this.y + this.kbSpeed; kbMoved = true; }

        if (!kbMoved && handX !== null && handY !== null) {
            this.targetX = handX;
            this.targetY = handY;
        }

        let prevX = this.x;
        let lerpAmt = kbMoved ? 0.35 : 0.13;
        this.x = lerp(this.x, this.targetX, lerpAmt);
        this.y = lerp(this.y, this.targetY, lerpAmt);

        this.x = constrain(this.x, this.w / 2, bw - this.w / 2);
        this.y = constrain(this.y, bh * 0.25, bh - this.h / 2 - 10);

        let dx = this.x - prevX;
        this.tilt = lerp(this.tilt, constrain(dx * 3, -0.3, 0.3), 0.12);

        // Shoot: gesture OR P key (hold to auto-fire)
        let kbShoot = keyIsDown(80);
        let canShoot = shooting || kbShoot;
        if (canShoot && millis() - this.lastShotTime > this.shotCadence) {
            this.lastShotTime = millis();
            playerBullets.push(new Bullet(this.x, this.y - this.h / 2, 0, -9, true));
        }
        this.prevShoot = shooting;
        this._prevKbShoot = kbShoot;

        this.exhaust.emit(this.x, this.y + this.h / 2);
        this.exhaust.update();

        if (this.iFrames > 0) this.iFrames--;
    }

    takeDamage(amt) {
        if (this.iFrames > 0) return false;
        this.health -= amt;
        this.iFrames = 40;
        return this.health <= 0;
    }

    draw(sprite) {
        this.exhaust.draw();
        push();
        translate(this.x, this.y);
        rotate(this.tilt);
        if (this.iFrames > 0 && frameCount % 6 < 3) { pop(); return; }
        let ctx = drawingContext;
        ctx.shadowBlur = 28;
        ctx.shadowColor = 'rgba(0,200,255,0.45)';
        imageMode(CENTER);
        if (sprite) image(sprite, 0, 0, this.w, this.h);
        else { fill(0, 200, 255); noStroke(); triangle(0, -this.h / 2, -this.w / 2, this.h / 2, this.w / 2, this.h / 2); }
        ctx.shadowBlur = 0;
        pop();
    }

    getHealthPct() { return this.health / this.maxHealth; }
}
