// ── HandController — ML5 HandPose + Teachable Machine ────────
class HandController {
    constructor() {
        this.video = null;
        this.handpose = null;
        this.classifier = null;

        this.handX = null;
        this.handY = null;
        this.detected = false;
        this.shooting = false;

        this.hpReady = false;
        this.clReady = false;
        this.ready = false;

        this.shootLabel = '';
        this.shootConfidence = 0;
        this.statusText = 'Inicializando cámara…';
    }

    init() {
        // P5 video capture
        this.video = createCapture(VIDEO);
        this.video.size(320, 240);
        this.video.hide();

        // HandPose
        this.handpose = ml5.handpose(this.video, () => {
            console.log('HandPose loaded');
            this.hpReady = true;
            this._checkReady();
        });

        this.handpose.on('predict', (results) => {
            if (results.length > 0) {
                let lm = results[0].landmarks;
                // Palm ≈ average of wrist(0) and middle-finger-mcp(9)
                let rawX = (lm[0][0] + lm[9][0]) / 2;
                let rawY = (lm[0][1] + lm[9][1]) / 2;
                // Mirror X so moving hand left moves ship left
                this.handX = map(this.video.width - rawX, 0, this.video.width, 0, width);
                this.handY = map(rawY, 0, this.video.height, height * 0.22, height - 40);
                this.detected = true;
            } else {
                this.detected = false;
            }
        });

        // Teachable Machine image classifier
        this.classifier = ml5.imageClassifier('my_model/model.json', () => {
            console.log('Teachable Machine loaded');
            this.clReady = true;
            this._checkReady();
            this._classifyLoop();
        });
    }

    _checkReady() {
        if (this.hpReady && this.clReady) {
            this.ready = true;
            this.statusText = '¡Modelos listos! Muestra tu mano.';
        }
    }

    _classifyLoop() {
        if (!this.classifier || !this.video) return;
        this.classifier.classify(this.video, (err, results) => {
            if (!err && results && results.length > 0) {
                let top = results[0];
                this.shootLabel = top.label;
                this.shootConfidence = top.confidence;
                let lbl = top.label.trim().toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                this.shooting = (lbl === 'dispara' && top.confidence > 0.82);
            }
            requestAnimationFrame(() => this._classifyLoop());
        });
    }

    /** Draw mirrored webcam preview + gesture indicator */
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

        // Gesture label
        noStroke();
        textFont('Rajdhani');
        textSize(11);
        textAlign(LEFT, TOP);
        fill(this.shooting ? color(0, 255, 120) : color(180));
        text(this.shooting ? '🔫 DISPARO' : '✋ ESTÁTICO', px + 3, py + ph + 4);

        // Confidence bar
        fill(40, 40, 50, 180);
        rect(px, py + ph + 19, pw, 3, 2);
        fill(this.shooting ? color(0, 255, 120) : color(80));
        rect(px, py + ph + 19, pw * this.shootConfidence, 3, 2);

        pop();
    }
}
