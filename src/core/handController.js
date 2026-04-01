// ── HandController — ML5 HandPose optimized ──────────────────
class HandController {
    constructor() {
        this.video = null;
        this.handpose = null;

        this.handX = null;
        this.handY = null;
        this.prevHandX = null; // Rastrear frame anterior para lógica de dirección

        this.targetHandX = null;
        this.targetHandY = null;
        this.detected = false;
        this.shooting = true;

        this.hpReady = false;
        this.ready = false;

        this.captureW = 320;
        this.captureH = 240;
        this.followLerp = 0.22;
        this.deadZone = 3;
        this.maxLostFrames = 10;
        this.lostFrames = 0;
        this.minConfidence = 0.75;
        this.warmupFrames = 5;
        this.stableFrames = 0;
        this.controlReady = false;
        this.centerOffsetX = 0;
        this.hasCenterCalibration = false;

        this.maxInferenceFps = 20;
        this.inferenceIntervalMs = 1000 / this.maxInferenceFps;
        this.lastInferenceMs = -99999;

        this.direction = "QUIETO";
        this.moveThreshold = 8;

        this.currentFingerCount = 0;
        this.stableFingerCount = 0;
        this.selectionTimer = 0;
        this.selectionConfirmed = false;
    }

    init() {
        const constraints = {
            audio: false,
            video: {
                facingMode: 'user',
                width: { ideal: this.captureW, max: this.captureW },
                height: { ideal: this.captureH, max: this.captureH },
                frameRate: { ideal: 30, max: 30 }
            }
        };

        this.video = createCapture(constraints);
        this.video.parent('camera-container');

        this.updateStatusText("Cargando modelo de manos...");

        this.handpose = ml5.handpose(this.video, () => {
            console.log('HandPose loaded');
            this.hpReady = true;
            this.updateStatusText("¡Sistema Listo! Mueve tu mano");
            this._checkReady();
        });

        this.handpose.on('predict', (results) => {
            const now = millis();
            if (now - this.lastInferenceMs < this.inferenceIntervalMs) return;
            this.lastInferenceMs = now;
            this._processPrediction(results);
        });

        this._checkReady();
    }

    update() {
        if (!this.detected || this.targetHandX === null || this.targetHandY === null) {
            this.updateDirectionUI("QUIETO");
            return;
        }

        if (this.handX === null || this.handY === null) {
            this.handX = this.targetHandX;
            this.handY = this.targetHandY;
            this.prevHandX = this.handX;
            return;
        }

        this.prevHandX = this.handX;

        this.handX = this._smoothAxis(this.handX, this.targetHandX);
        this.handY = this._smoothAxis(this.handY, this.targetHandY);
        this.handX = constrain(this.handX, 0, width);
        this.handY = constrain(this.handY, 0, height);


        let deltaX = this.handX - this.prevHandX;

        if (deltaX < -this.moveThreshold) {
            this.updateDirectionUI("IZQUIERDA");
        } else if (deltaX > this.moveThreshold) {
            this.updateDirectionUI("DERECHA");
        } else {
            this.updateDirectionUI("QUIETO");
        }
    }

    updateDirectionUI(newDir) {
        if (this.direction === newDir) return;
        this.direction = newDir;

        let indicator = document.getElementById('direction-indicator');
        if (!indicator) return;

        if (this.direction === "IZQUIERDA") {
            indicator.innerText = "<< IZQUIERDA";
            indicator.className = "dir-left";
        } else if (this.direction === "DERECHA") {
            indicator.innerText = "DERECHA >>";
            indicator.className = "dir-right";
        } else {
            indicator.innerText = "-- QUIETO --";
            indicator.className = "dir-center";
        }
    }

    updateStatusText(msg) {
        let el = document.getElementById('hand-status');
        if (el) el.innerText = msg;
    }

    _processPrediction(results) {
        if (!results || results.length === 0) {
            this.lostFrames++;
            this._checkLostTracking();
            return;
        }

        let hand = results[0];
        let conf = hand.handInViewConfidence ?? 1;
        if (conf < this.minConfidence) {
            this.lostFrames++;
            this._checkLostTracking();
            return;
        }

        let lm = hand.landmarks;
        let rawX = (lm[0][0] + lm[9][0]) * 0.5;
        let rawY = (lm[0][1] + lm[9][1]) * 0.5;


        let mappedX = map(this.video.width - rawX, 0, this.video.width, 0, width);
        let mappedY = map(rawY, 0, this.video.height, height * 0.2, height - 30);

        this.lostFrames = 0;

        if (!this.controlReady) {
            this.stableFrames++;
            if (this.stableFrames >= this.warmupFrames) {
                this.controlReady = true;
                this.centerOffsetX = mappedX - width * 0.5;
                this.hasCenterCalibration = true;
                this.targetHandX = width * 0.5;
                this.targetHandY = mappedY;
                this.handX = this.targetHandX;
                this.handY = this.targetHandY;
                this.detected = true;
            } else {
                this.detected = false;
            }
            return;
        }

        if (this.hasCenterCalibration) {
            mappedX -= this.centerOffsetX;
        }

        this.targetHandX = constrain(mappedX, 0, width);
        this.targetHandY = constrain(mappedY, 0, height);
        this.detected = true;

        // finger counting
        let indexUp = lm[8][1] < lm[5][1];
        let middleUp = lm[12][1] < lm[9][1];
        let ringUp = lm[16][1] < lm[13][1];
        let pinkyUp = lm[20][1] < lm[17][1];

        let fingers = 0;
        if (indexUp) fingers++;
        if (middleUp) fingers++;
        if (ringUp) fingers++;
        if (pinkyUp) fingers++;

        if (fingers > 0) {
            if (fingers === this.currentFingerCount) {
                if (this.selectionTimer === 0) {
                    this.selectionTimer = millis();
                } else if (!this.selectionConfirmed && millis() - this.selectionTimer >= 1500) {
                    this.selectionConfirmed = true;
                    this.stableFingerCount = this.currentFingerCount;
                }
            } else {
                this.currentFingerCount = fingers;
                this.selectionTimer = millis();
                this.selectionConfirmed = false;
            }
        } else {
            this.currentFingerCount = 0;
            this.selectionTimer = 0;
            this.selectionConfirmed = false;
            this.stableFingerCount = 0;
        }
    }

    _checkLostTracking() {
        if (this.lostFrames < this.maxLostFrames) return;
        this.detected = false;
        this.updateDirectionUI("QUIETO");

        this.handX = null;
        this.handY = null;
        this.targetHandX = null;
        this.targetHandY = null;
        this.stableFrames = 0;
        this.controlReady = false;
        this.hasCenterCalibration = false;

        this.currentFingerCount = 0;
        this.stableFingerCount = 0;
        this.selectionTimer = 0;
        this.selectionConfirmed = false;
    }

    _checkReady() {
        if (this.hpReady) {
            this.ready = true;
        }
    }

    _smoothAxis(current, target) {
        if (abs(target - current) < this.deadZone) return current;
        return lerp(current, target, this.followLerp);
    }

    // Eliminado drawPreview(); Ahora todo se maneja mediante DOM/Flexbox 
    // y no renderizado a través de canvas p5 por temas de UX/UI.
    drawPreview() { }
}
