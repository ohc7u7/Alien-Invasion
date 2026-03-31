// ── HandController — ML5 HandPose (movement only) ────────────
class HandController {
    constructor() {
        this.video = null;
        this.handpose = null;

        this.handX = null;
        this.handY = null;
        this.detected = false;
        this.shooting = true;

        this.hpReady = false;
        this.ready = false;

        // Tracking tuning for lower jitter and less CPU load.
        this.captureW = 224;
        this.captureH = 168;
        this.smoothing = 0.28;
        this.deadZone = 6;
        this.maxLostFrames = 8;
        this.lostFrames = 0;
        this.minConfidence = 0.75;
        this.warmupFrames = 6;
        this.stableFrames = 0;
        this.controlReady = false;
        this.centerOffsetX = 0;
        this.hasCenterCalibration = false;

        this.statusText = 'Inicializando cámara…';
    }

    init() {
        // P5 video capture
        this.video = createCapture(VIDEO);
        this.video.size(this.captureW, this.captureH);
        this.video.hide();

        // HandPose
        this.handpose = ml5.handpose(this.video, () => {
            console.log('HandPose loaded');
            this.hpReady = true;
            this._checkReady();
        });

        this.handpose.on('predict', (results) => {
            if (results.length > 0) {
                let hand = results[0];
                let conf = hand.handInViewConfidence ?? 1;
                if (conf < this.minConfidence) {
                    this.lostFrames++;
                    if (this.lostFrames >= this.maxLostFrames) {
                        this.detected = false;
                        this.handX = null;
                        this.handY = null;
                        this.stableFrames = 0;
                        this.controlReady = false;
                        this.hasCenterCalibration = false;
                    }
                    return;
                }

                let lm = hand.landmarks;
                // Palm ≈ average of wrist(0) and middle-finger-mcp(9)
                let rawX = (lm[0][0] + lm[9][0]) / 2;
                let rawY = (lm[0][1] + lm[9][1]) / 2;
                // Mirror X so moving hand left moves ship left
                let targetX = map(this.video.width - rawX, 0, this.video.width, 0, width);
                let targetY = map(rawY, 0, this.video.height, height * 0.2, height - 30);

                this.lostFrames = 0;

                // Require a few stable frames before enabling movement.
                if (!this.controlReady) {
                    this.stableFrames++;
                    if (this.stableFrames >= this.warmupFrames) {
                        this.controlReady = true;
                        this.centerOffsetX = targetX - width * 0.5;
                        this.hasCenterCalibration = true;
                        this.handX = width * 0.5;
                        this.handY = targetY;
                        this.detected = true;
                    } else {
                        this.detected = false;
                        this.handX = null;
                        this.handY = null;
                    }
                    return;
                }

                if (this.hasCenterCalibration) {
                    targetX -= this.centerOffsetX;
                }

                if (this.handX === null || this.handY === null) {
                    this.handX = targetX;
                    this.handY = targetY;
                } else {
                    this.handX = this._smoothAxis(this.handX, targetX);
                    this.handY = this._smoothAxis(this.handY, targetY);
                }

                this.handX = constrain(this.handX, 0, width);
                this.handY = constrain(this.handY, 0, height);
                this.detected = true;
            } else {
                this.lostFrames++;
                if (this.lostFrames >= this.maxLostFrames) {
                    this.detected = false;
                    this.handX = null;
                    this.handY = null;
                    this.stableFrames = 0;
                    this.controlReady = false;
                    this.hasCenterCalibration = false;
                }
            }
        });

        this._checkReady();
    }

    _checkReady() {
        if (this.hpReady) {
            this.ready = true;
            this.statusText = 'Modelo de mano listo.';
        }
    }

    _smoothAxis(current, target) {
        let delta = target - current;
        if (abs(delta) < this.deadZone) return current;
        return lerp(current, target, this.smoothing);
    }

    /** Draw mirrored webcam preview */
    drawPreview(px, py, pw, ph) {
        if (!this.video) return;
        push();

        // Border glow
        let ctx = drawingContext;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,200,255,0.4)';
        stroke(0, 180, 255, 120);
        strokeWeight(2);
        noFill();
        rect(px - 2, py - 2, pw + 4, ph + 4, 5);
        ctx.shadowBlur = 0;

        // Mirrored video
        push();
        translate(px + pw, py);
        scale(-1, 1);
        image(this.video, 0, 0, pw, ph);
        pop();

        // Status label
        noStroke();
        textFont('Rajdhani');
        textSize(11);
        textAlign(LEFT, TOP);
        fill(0, 255, 120);
        text('AUTO FIRE', px + 3, py + ph + 4);

        pop();
    }
}
