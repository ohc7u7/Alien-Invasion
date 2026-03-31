// ── UI — Side HUD, menus, starfield, deck cards ─────────────

// ═══════════════════════════════════════════════════════════
// Starfield (full-screen background)
// ═══════════════════════════════════════════════════════════

function createStarfield() {
    let layers = [];
    let configs = [
        { count: 90, speed: 0.4, sMin: 1.0, sMax: 1.5 },
        { count: 50, speed: 1.0, sMin: 1.5, sMax: 2.5 },
        { count: 25, speed: 2.2, sMin: 2.5, sMax: 4.0 }
    ];
    for (let c of configs) {
        let stars = [];
        for (let i = 0; i < c.count; i++) {
            stars.push({
                x: random(width), y: random(height),
                size: random(c.sMin, c.sMax),
                bright: random(0.3, 1),
                col: random() > 0.85 ? [170, 200, 255] : [255, 255, 255]
            });
        }
        layers.push({ stars, speed: c.speed });
    }
    return layers;
}

function drawStarfield(layers) {
    for (let l of layers) {
        for (let s of l.stars) {
            s.y += l.speed;
            if (s.y > height + 5) { s.y = -5; s.x = random(width); }
            let tw = 140 + sin(frameCount * 0.04 + s.x) * 60;
            noStroke();
            fill(s.col[0], s.col[1], s.col[2], tw * s.bright);
            ellipse(s.x, s.y, s.size);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// SIDE UI (drawn outside the game box)
// ═══════════════════════════════════════════════════════════

function drawSideUI() {
    if (!player) return;

    let sideW = gx - 20; // available space on each side
    let barW = 22;
    let barH = gh * 0.55;

    // ── LEFT SIDE: "VIDA" vertical label + health bar ──
    let lx = gx - barW - 30;
    let ly = gy + (gh - barH) / 2;

    // Label "VIDA"
    push();
    fill(255, 60, 60);
    textFont('Orbitron');
    textSize(16);
    textAlign(CENTER, CENTER);
    let label = 'VIDA';
    for (let i = 0; i < label.length; i++) {
        text(label[i], lx + barW / 2, ly - 30 - (label.length - 1 - i) * 22);
    }
    pop();

    // Health bar
    drawVerticalBar(lx, ly, barW, barH, player.getHealthPct(),
        color(180, 30, 30), color(255, 60, 60), color(60, 20, 20));

    // Health text
    fill(200);
    noStroke();
    textFont('Rajdhani');
    textSize(12);
    textAlign(CENTER, TOP);
    text(player.health + '/' + player.maxHealth, lx + barW / 2, ly + barH + 8);

    // ── RIGHT SIDE: "NIVEL" vertical label + EXP bar ──
    let rx = gx + gw + 10;
    let ry = gy + (gh - barH) / 2;

    // Label "NIVEL"
    push();
    fill(0, 200, 255);
    textFont('Orbitron');
    textSize(16);
    textAlign(CENTER, CENTER);
    let label2 = 'NIVEL';
    for (let i = 0; i < label2.length; i++) {
        text(label2[i], rx + barW / 2, ry - 30 - (label2.length - 1 - i) * 22);
    }
    pop();

    // EXP bar
    let expPct = constrain(player.exp / player.expToLevel, 0, 1);
    drawVerticalBar(rx, ry, barW, barH, expPct,
        color(0, 80, 160), color(0, 180, 255), color(10, 30, 60));

    // Level text
    fill(200);
    noStroke();
    textFont('Rajdhani');
    textSize(12);
    textAlign(CENTER, TOP);
    text('Lv.' + player.level, rx + barW / 2, ry + barH + 8);

    // ── Wave indicator (below right bar) ──
    let wLabels = ['', 'WAVE I', 'WAVE II', 'WAVE III'];
    let wCols = [null, [100, 255, 100], [255, 200, 50], [200, 100, 255]];
    if (waveType >= 1 && waveType <= 3) {
        let wc = wCols[waveType];
        fill(wc[0], wc[1], wc[2]);
        textFont('Orbitron');
        textSize(11);
        textAlign(CENTER, TOP);
        text(wLabels[waveType], rx + barW / 2, ry + barH + 28);
    }

    // ── Webcam preview (below left bar) ──
    let pvW = min(sideW - 10, 140);
    let pvH = pvW * 0.75;
    let pvX = 10;
    let pvY = gy + gh - pvH - 10;
    handCtrl.drawPreview(pvX, pvY, pvW, pvH);

    // ── Fire mode status near webcam ──
    fill(0, 255, 120);
    textFont('Rajdhani');
    textSize(10);
    textAlign(LEFT, TOP);
    text('AUTO FIRE', pvX, pvY - 14);
}

function drawVerticalBar(x, y, w, h, pct, darkCol, brightCol, bgCol) {
    // Trapezoid clip shape
    push();
    noStroke();

    // Background
    fill(bgCol);
    beginShape();
    vertex(x, y + h * 0.05);
    vertex(x + w, y);
    vertex(x + w, y + h * 0.95);
    vertex(x, y + h);
    endShape(CLOSE);

    // Fill from bottom
    let fillH = h * pct;
    let ctx = drawingContext;
    ctx.shadowBlur = 10;
    ctx.shadowColor = brightCol.toString();

    fill(brightCol);
    let clipY = y + h - fillH;
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.moveTo(x, y + h * 0.05);
    drawingContext.lineTo(x + w, y);
    drawingContext.lineTo(x + w, y + h * 0.95);
    drawingContext.lineTo(x, y + h);
    drawingContext.closePath();
    drawingContext.clip();

    noStroke();
    fill(brightCol);
    rect(x, clipY, w, fillH);

    drawingContext.restore();
    ctx.shadowBlur = 0;

    // Border
    stroke(brightCol.levels ? brightCol : color(200), 80);
    strokeWeight(1);
    noFill();
    beginShape();
    vertex(x, y + h * 0.05);
    vertex(x + w, y);
    vertex(x + w, y + h * 0.95);
    vertex(x, y + h);
    endShape(CLOSE);

    pop();
}

// ═══════════════════════════════════════════════════════════
// Score (inside game box)
// ═══════════════════════════════════════════════════════════

function drawScoreInBox(score, bw) {
    let ctx = drawingContext;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255,50,50,0.6)';
    noStroke();
    fill(255, 50, 50);
    textFont('Orbitron');
    textSize(18);
    textAlign(RIGHT, TOP);
    text('SCORE ' + score, bw - 12, 12);
    ctx.shadowBlur = 0;
}

// ═══════════════════════════════════════════════════════════
// DECK CARDS — Level-up upgrade selection
// ═══════════════════════════════════════════════════════════

const CARD_DATA = [
    { id: 1, title: '❤ VIDA', desc: 'Recupera y aumenta\nvida máxima +20', col: [255, 80, 80] },
    { id: 2, title: '⚔ DAÑO', desc: 'Aumenta el daño\nde tus balas +2', col: [255, 200, 50] },
    { id: 3, title: '⚡ CADENCIA', desc: 'Dispara más\nrápido -60ms', col: [0, 200, 255] }
];

function drawDeckCards() {
    // Full-screen dim overlay
    fill(0, 0, 0, 100);
    noStroke();
    rect(0, 0, width, height);

    let cardW = min(160, (gw - 60) / 3);
    let cardH = cardW * 1.5;
    let gap = 18;
    let totalW = cardW * 3 + gap * 2;
    let startX = gx + (gw - totalW) / 2;
    let cardY = gy + gh * 0.38;

    for (let i = 0; i < 3; i++) {
        let cx = startX + i * (cardW + gap);
        let c = CARD_DATA[i];
        let hovered = mouseX >= cx && mouseX <= cx + cardW &&
            mouseY >= cardY && mouseY <= cardY + cardH;

        drawCard(cx, cardY, cardW, cardH, c, hovered, i + 1);
    }

    // Key hints
    fill(150);
    textFont('Rajdhani');
    textSize(12);
    textAlign(CENTER, TOP);
    text('Haz clic en una carta  |  Teclas 1, 2, 3', gx + gw / 2, cardY + cardH + 20);
}

function drawCard(x, y, w, h, data, hovered, num) {
    push();
    let ctx = drawingContext;
    let c = data.col;

    // Card background
    if (hovered) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.7)`;
        fill(20, 20, 30, 240);
        stroke(c[0], c[1], c[2]);
        strokeWeight(2);
    } else {
        fill(12, 12, 22, 230);
        stroke(c[0], c[1], c[2], 120);
        strokeWeight(1.5);
    }
    rect(x, y, w, h, 10);
    ctx.shadowBlur = 0;

    // Number badge
    fill(c[0], c[1], c[2]);
    noStroke();
    textFont('Orbitron');
    textSize(14);
    textAlign(CENTER, TOP);
    text(num, x + w / 2, y + 12);

    // Title
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.6)`;
    textSize(min(w * 0.11, 16));
    text(data.title, x + w / 2, y + 38);
    ctx.shadowBlur = 0;

    // Divider
    stroke(c[0], c[1], c[2], 60);
    strokeWeight(1);
    line(x + 15, y + 62, x + w - 15, y + 62);

    // Description
    noStroke();
    fill(190);
    textFont('Rajdhani');
    textSize(13);
    textAlign(CENTER, TOP);
    let lines = data.desc.split('\n');
    for (let li = 0; li < lines.length; li++) {
        text(lines[li], x + w / 2, y + 74 + li * 18);
    }

    pop();
}

function getClickedCard(mx, my) {
    let cardW = min(160, (gw - 60) / 3);
    let cardH = cardW * 1.5;
    let gap = 18;
    let totalW = cardW * 3 + gap * 2;
    let startX = gx + (gw - totalW) / 2;
    let cardY = gy + gh * 0.38;

    for (let i = 0; i < 3; i++) {
        let cx = startX + i * (cardW + gap);
        if (mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH) {
            return i + 1;
        }
    }
    return 0;
}

// ═══════════════════════════════════════════════════════════
// MENU SCREEN (inside game box)
// ═══════════════════════════════════════════════════════════

function drawMenuScreen(ready, bw, bh) {
    fill(0, 0, 15, 150);
    noStroke();
    rect(0, 0, bw, bh);

    let ctx = drawingContext;
    let pulse = sin(frameCount * 0.03) * 0.3 + 0.7;

    ctx.shadowBlur = 30 * pulse;
    ctx.shadowColor = 'rgba(0,220,255,0.8)';
    fill(0, 220, 255);
    textAlign(CENTER, CENTER);
    textFont('Orbitron');
    textSize(min(bw * 0.085, 40));
    text('ALIEN', bw / 2, bh * 0.2);
    text('INVASION', bw / 2, bh * 0.28);

    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255,50,200,0.6)';
    fill(255, 50, 200);
    textSize(min(bw * 0.03, 14));
    text('HAND CONTROL EDITION', bw / 2, bh * 0.36);
    ctx.shadowBlur = 0;

    fill(190, 190, 210);
    textFont('Rajdhani');
    textSize(14);
    text('Mueve tu mano para controlar la nave', bw / 2, bh * 0.5);
    text('Gesto "Dispara" para atacar', bw / 2, bh * 0.55);
    text('Teclado: WASD + P', bw / 2, bh * 0.60);

    if (ready) {
        let a = (sin(frameCount * 0.06) + 1) * 0.5;
        ctx.shadowBlur = 15 * a;
        ctx.shadowColor = 'rgba(0,255,160,0.7)';
        fill(0, lerp(100, 255, a), int(lerp(60, 150, a)));
        textFont('Orbitron');
        textSize(14);
        text('ENTER / ✋ MANO', bw / 2, bh * 0.72);
        text('PARA EMPEZAR', bw / 2, bh * 0.77);
        ctx.shadowBlur = 0;
    } else {
        fill(180, 180, 50);
        textFont('Rajdhani');
        textSize(13);
        text('Cargando modelos ML…', bw / 2, bh * 0.72);
    }

    fill(70);
    textSize(11);
    text('P5.js + ML5.js', bw / 2, bh * 0.92);
}

// ═══════════════════════════════════════════════════════════
// GAME OVER SCREEN (inside game box)
// ═══════════════════════════════════════════════════════════

function drawGameOverScreen(score, bw, bh) {
    fill(0, 0, 15, 180);
    noStroke();
    rect(0, 0, bw, bh);

    let ctx = drawingContext;
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(255,40,40,0.7)';
    fill(255, 50, 50);
    textAlign(CENTER, CENTER);
    textFont('Orbitron');
    textSize(min(bw * 0.09, 42));
    text('GAME OVER', bw / 2, bh * 0.3);
    ctx.shadowBlur = 0;

    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0,220,255,0.6)';
    fill(0, 220, 255);
    textSize(24);
    text('SCORE: ' + score, bw / 2, bh * 0.45);
    ctx.shadowBlur = 0;

    let a = (sin(frameCount * 0.06) + 1) * 0.5;
    fill(lerp(100, 255, a));
    textFont('Rajdhani');
    textSize(14);
    text('ENTER / ✋ Mano para reiniciar', bw / 2, bh * 0.62);
}
