// ── Player class ─────────────────────────────────────────────
class Player {
    constructor(x, y, skin) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.w = 54;
        this.h = 60;

        // Apply skin stats
        this.baseDamage = skin ? skin.damage : 2;
        this.baseSpeed = skin ? skin.speed : 5;
        this.baseCadence = skin ? skin.cadence : 550;
        this.health = skin ? skin.health : 15;
        this.maxHealth = this.health;
        this.skinCol = skin ? skin.col : [0, 200, 255];

        this.score = 0;
        this.damage = this.baseDamage;
        this.kbSpeed = this.baseSpeed;

        this.exp = 0;
        this.expToLevel = 1000;
        this.level = 1;

        this.lastShotTime = 0;
        this.shotCadence = this.baseCadence;
        this.prevShoot = false;
        this._prevKbShoot = false;

        this.exhaust = new EngineExhaust();
        this.iFrames = 0;
        this.tilt = 0;

        // Buff manager
        this.buffs = new BuffManager();
    }

    update(handX, handY, shooting, playerBullets, bw, bh) {
        // Update buffs
        this.buffs.update();

        // Apply buff modifiers
        let speedMult = this.buffs.has(PU_SPEED) ? 1.6 : 1.0;
        let damageMult = this.buffs.has(PU_DAMAGE) ? 2.0 : 1.0;
        let cadenceMult = this.buffs.has(PU_RAPID) ? 0.4 : 1.0;

        this.damage = ceil(this.baseDamage * damageMult);
        this.kbSpeed = this.baseSpeed * speedMult;
        let currentCadence = this.shotCadence * cadenceMult;

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
        this.x = lerp(this.x, this.targetX, lerpAmt * speedMult);
        this.y = lerp(this.y, this.targetY, lerpAmt * speedMult);

        this.x = constrain(this.x, this.w / 2, bw - this.w / 2);
        this.y = constrain(this.y, bh * 0.25, bh - this.h / 2 - 10);

        let dx = this.x - prevX;
        this.tilt = lerp(this.tilt, constrain(dx * 3, -0.3, 0.3), 0.12);

        // Always auto-fire (gesture model removed).
        let canShoot = true;
        if (canShoot && millis() - this.lastShotTime > currentCadence) {
            this.lastShotTime = millis();
            playerBullets.push(new Bullet(this.x, this.y - this.h / 2, 0, -9, true));
            // Rapid fire: extra side bullets
            if (this.buffs.has(PU_RAPID)) {
                playerBullets.push(new Bullet(this.x - 12, this.y - this.h / 2 + 8, -1.5, -8, true));
                playerBullets.push(new Bullet(this.x + 12, this.y - this.h / 2 + 8, 1.5, -8, true));
            }
        }
        this.prevShoot = true;
        this._prevKbShoot = false;

        this.exhaust.emit(this.x, this.y + this.h / 2);
        this.exhaust.update();

        if (this.iFrames > 0) this.iFrames--;
    }

    takeDamage(amt) {
        // Shield buff = immune
        if (this.buffs.has(PU_SHIELD)) return false;
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

        // Shield visual
        if (this.buffs.has(PU_SHIELD)) {
            let sp = (sin(frameCount * 0.08) + 1) * 0.5;
            ctx.shadowBlur = 30;
            ctx.shadowColor = `rgba(0,220,255,${0.3 + sp * 0.3})`;
            noFill();
            stroke(0, 220, 255, 80 + sp * 80);
            strokeWeight(2);
            ellipse(0, 0, this.w + 18, this.h + 18);
            noStroke();
        }

        // Ship glow (tinted to skin color)
        ctx.shadowBlur = 28;
        ctx.shadowColor = `rgba(${this.skinCol[0]},${this.skinCol[1]},${this.skinCol[2]},0.45)`;

        // Damage buff = red tint
        if (this.buffs.has(PU_DAMAGE)) {
            tint(255, 140, 100);
        } else if (this.buffs.has(PU_SPEED)) {
            tint(120, 255, 160);
        }

        imageMode(CENTER);
        if (sprite) image(sprite, 0, 0, this.w, this.h);
        else { fill(0, 200, 255); noStroke(); triangle(0, -this.h / 2, -this.w / 2, this.h / 2, this.w / 2, this.h / 2); }

        noTint();
        ctx.shadowBlur = 0;
        pop();
    }

    getHealthPct() { return this.health / this.maxHealth; }
}
