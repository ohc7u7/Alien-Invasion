// ── Ship Skins system ────────────────────────────────────────

const SKINS = [
    {
        id: 'default',
        name: 'VIPER',
        desc: 'Nave estándar equilibrada',
        speed: 6.5,
        damage: 2,
        health: 15,
        cadence: 500,
        col: [0, 200, 255],
        tintCol: [255, 255, 255]   // original red look
    },
    {
        id: 'tank',
        name: 'TITAN',
        desc: 'Blindada: +HP, −velocidad',
        speed: 3.5,
        damage: 2,
        health: 35,
        cadence: 750,
        col: [255, 100, 50],
        tintCol: [255, 180, 50]    // warm orange
    },
    {
        id: 'rapid',
        name: 'PHANTOM',
        desc: 'Rápida: +cadencia, −HP',
        speed: 8.0,
        damage: 1,
        health: 8,
        cadence: 300,
        col: [200, 50, 255],
        tintCol: [255, 100, 255]   // pink/magenta
    },
    {
        id: 'heavy',
        name: 'DESTROYER',
        desc: 'Destructora: +daño, −cadencia',
        speed: 4.0,
        damage: 6,
        health: 12,
        cadence: 900,
        col: [255, 200, 50],
        tintCol: [255, 255, 100]   // bright gold/yellow
    }
];

let selectedSkinIdx = 0;

function getSelectedSkin() {
    return SKINS[selectedSkinIdx];
}

// ── Procedural ship drawing per skin ─────────────────────────

function drawShipShape(skinId, w, h) {
    let hw = w / 2, hh = h / 2;
    noStroke();

    switch (skinId) {
        case 'default': // VIPER — sleek triangle
            // Main body
            fill(0, 180, 240);
            beginShape();
            vertex(0, -hh);
            vertex(-hw * 0.6, hh * 0.5);
            vertex(-hw * 0.3, hh);
            vertex(hw * 0.3, hh);
            vertex(hw * 0.6, hh * 0.5);
            endShape(CLOSE);
            // Cockpit
            fill(0, 255, 255, 200);
            ellipse(0, -hh * 0.15, w * 0.2, h * 0.22);
            // Wing accents
            stroke(0, 255, 255, 120);
            strokeWeight(1.5);
            line(-hw * 0.5, hh * 0.3, -hw * 0.15, -hh * 0.3);
            line(hw * 0.5, hh * 0.3, hw * 0.15, -hh * 0.3);
            noStroke();
            break;

        case 'tank': // TITAN — wide bulky shape
            // Wide body
            fill(220, 80, 30);
            beginShape();
            vertex(0, -hh * 0.7);
            vertex(-hw * 0.4, -hh * 0.4);
            vertex(-hw, hh * 0.2);
            vertex(-hw * 0.85, hh);
            vertex(hw * 0.85, hh);
            vertex(hw, hh * 0.2);
            vertex(hw * 0.4, -hh * 0.4);
            endShape(CLOSE);
            // Armor plates
            fill(255, 120, 60, 180);
            rect(-hw * 0.6, -hh * 0.1, w * 0.3, h * 0.35, 3);
            rect(hw * 0.3, -hh * 0.1, w * 0.3, h * 0.35, 3);
            // Center cockpit
            fill(255, 160, 80, 200);
            ellipse(0, -hh * 0.1, w * 0.25, h * 0.2);
            // Border glow
            stroke(255, 140, 50, 100);
            strokeWeight(2);
            noFill();
            beginShape();
            vertex(0, -hh * 0.7);
            vertex(-hw, hh * 0.2);
            vertex(hw, hh * 0.2);
            endShape(CLOSE);
            noStroke();
            break;

        case 'rapid': // PHANTOM — thin aerodynamic
            // Slim body
            fill(170, 40, 220);
            beginShape();
            vertex(0, -hh);
            vertex(-hw * 0.25, -hh * 0.2);
            vertex(-hw * 0.8, hh * 0.6);
            vertex(-hw * 0.3, hh * 0.4);
            vertex(-hw * 0.15, hh);
            vertex(hw * 0.15, hh);
            vertex(hw * 0.3, hh * 0.4);
            vertex(hw * 0.8, hh * 0.6);
            vertex(hw * 0.25, -hh * 0.2);
            endShape(CLOSE);
            // Speed lines
            stroke(220, 100, 255, 150);
            strokeWeight(1.5);
            line(0, -hh * 0.6, 0, hh * 0.3);
            line(-hw * 0.15, -hh * 0.3, -hw * 0.15, hh * 0.1);
            line(hw * 0.15, -hh * 0.3, hw * 0.15, hh * 0.1);
            noStroke();
            // Cockpit
            fill(230, 120, 255, 200);
            ellipse(0, -hh * 0.35, w * 0.15, h * 0.18);
            break;

        case 'heavy': // DESTROYER — angular with cannons
            // Main hull
            fill(220, 180, 30);
            beginShape();
            vertex(0, -hh * 0.8);
            vertex(-hw * 0.5, -hh * 0.2);
            vertex(-hw * 0.5, hh * 0.6);
            vertex(-hw * 0.2, hh);
            vertex(hw * 0.2, hh);
            vertex(hw * 0.5, hh * 0.6);
            vertex(hw * 0.5, -hh * 0.2);
            endShape(CLOSE);
            // Side cannons
            fill(255, 210, 50);
            rect(-hw * 0.9, -hh * 0.1, w * 0.18, h * 0.55, 2);
            rect(hw * 0.72, -hh * 0.1, w * 0.18, h * 0.55, 2);
            // Cannon tips
            fill(255, 255, 100);
            ellipse(-hw * 0.81, -hh * 0.15, 6, 6);
            ellipse(hw * 0.81, -hh * 0.15, 6, 6);
            // Cockpit
            fill(255, 240, 100, 200);
            ellipse(0, -hh * 0.2, w * 0.22, h * 0.18);
            // Hull lines
            stroke(255, 220, 80, 100);
            strokeWeight(1);
            line(-hw * 0.35, 0, hw * 0.35, 0);
            line(-hw * 0.3, hh * 0.3, hw * 0.3, hh * 0.3);
            noStroke();
            break;
    }
}

// ── Skin Selection Screen (drawn inside game box) ────────────

const STATE_SKINSELECT = 4;

function drawSkinSelectScreen(bw, bh) {
    fill(0, 0, 15, 180);
    noStroke();
    rect(0, 0, bw, bh);

    let ctx = drawingContext;

    // Title
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0,220,255,0.7)';
    fill(0, 220, 255);
    textFont('Orbitron');
    textSize(min(bw * 0.06, 28));
    textAlign(CENTER, CENTER);
    text('ELIGE TU NAVE', bw / 2, bh * 0.06);
    ctx.shadowBlur = 0;

    // Cards
    let cardW = min(bw * 0.4, 180);
    let cardH = cardW * 0.6;
    let gap = 14;
    let cols = 2;
    let startX = (bw - (cols * cardW + (cols - 1) * gap)) / 2;
    let startY = bh * 0.14;

    for (let i = 0; i < SKINS.length; i++) {
        let col = i % cols;
        let row = floor(i / cols);
        let cx = startX + col * (cardW + gap);
        let cy = startY + row * (cardH + gap);
        let sk = SKINS[i];
        // Adjust mouse coords to game box relative
        let mx = mouseX - gx;
        let my = mouseY - gy;
        let hovered = mx >= cx && mx <= cx + cardW && my >= cy && my <= cy + cardH;
        let selected = (i === selectedSkinIdx);

        if (handCtrl && handCtrl.currentFingerCount === i + 1) {
            hovered = true;
        }

        drawSkinCard(cx, cy, cardW, cardH, sk, hovered, selected, i);

        if (hovered && handCtrl && handCtrl.currentFingerCount === i + 1 && handCtrl.selectionTimer > 0) {
            let elapsed = millis() - handCtrl.selectionTimer;
            let pct = constrain(elapsed / 1500, 0, 1);
            if (pct > 0) {
                push();
                stroke(sk.col[0], sk.col[1], sk.col[2], 200);
                strokeWeight(4);
                noFill();
                arc(cx + cardW / 2, cy - 16, 20, 20, -HALF_PI, -HALF_PI + TWO_PI * pct);
                pop();
            }
        }
    }

    // Stats preview for selected skin
    let sk = SKINS[selectedSkinIdx];
    let statsY = startY + ceil(SKINS.length / cols) * (cardH + gap) + 10;

    fill(sk.col[0], sk.col[1], sk.col[2]);
    textFont('Orbitron');
    textSize(16);
    textAlign(CENTER, TOP);
    text(sk.name, bw / 2, statsY);

    fill(180);
    textFont('Rajdhani');
    textSize(13);
    text(sk.desc, bw / 2, statsY + 24);

    // Stat bars
    let barNames = ['VEL', 'DMG', 'HP', 'CAD'];
    let barVals = [sk.speed / 8, sk.damage / 5, sk.health / 35, 1 - (sk.cadence - 200) / 800];
    let barCols = [[80, 255, 120], [255, 80, 80], [255, 200, 50], [0, 200, 255]];
    let barStartY = statsY + 48;
    let barW = bw * 0.5;
    let barXStart = (bw - barW) / 2;

    for (let i = 0; i < 4; i++) {
        let by = barStartY + i * 22;
        // Label
        fill(150);
        textFont('Rajdhani');
        textSize(11);
        textAlign(RIGHT, CENTER);
        text(barNames[i], barXStart - 6, by + 5);

        // Background
        noStroke();
        fill(30, 30, 40, 180);
        rect(barXStart, by, barW, 10, 3);

        // Fill
        let c = barCols[i];
        fill(c[0], c[1], c[2], 200);
        rect(barXStart, by, barW * constrain(barVals[i], 0, 1), 10, 3);
    }

    // Start button
    let btnY = barStartY + 4 * 22 + 20;
    let pulse = (sin(frameCount * 0.06) + 1) * 0.5;

    ctx.shadowBlur = 12 * pulse;
    ctx.shadowColor = 'rgba(0,255,160,0.6)';
    fill(0, lerp(150, 255, pulse), lerp(80, 160, pulse));
    textFont('Orbitron');
    textSize(16);
    textAlign(CENTER, CENTER);
    text('ENTER / CLIC PARA JUGAR', bw / 2, btnY);
    ctx.shadowBlur = 0;

    // Navigation hint
    fill(80);
    textSize(11);
    text('← → o clic para elegir  |  ENTER para empezar', bw / 2, bh * 0.95);
}

function drawSkinCard(x, y, w, h, skin, hovered, selected, idx) {
    push();
    let c = skin.col;
    let ctx = drawingContext;

    if (selected) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.6)`;
        stroke(c[0], c[1], c[2]);
        strokeWeight(2);
    } else if (hovered) {
        stroke(c[0], c[1], c[2], 100);
        strokeWeight(1.5);
    } else {
        stroke(60, 60, 80, 100);
        strokeWeight(1);
    }

    fill(12, 12, 22, 230);
    rect(x, y, w, h, 8);
    ctx.shadowBlur = 0;

    // Ship preview — sprite with skin color glow
    push();
    translate(x + 36, y + h / 2);

    // Colored glow aura
    let glowP = (sin(frameCount * 0.06) + 1) * 0.5;
    let gCtx = drawingContext;
    gCtx.shadowBlur = 16 + glowP * 8;
    gCtx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.8)`;
    noStroke();
    fill(c[0], c[1], c[2], 50 + glowP * 40);
    ellipse(0, 2, 30, 36);
    gCtx.shadowBlur = 0;

    // Sprite
    tint(skin.tintCol[0], skin.tintCol[1], skin.tintCol[2]);
    imageMode(CENTER);
    image(sprPlayer, 0, 0, 40, 44);
    noTint();
    pop();

    // Name
    noStroke();
    fill(c[0], c[1], c[2]);
    textFont('Orbitron');
    textSize(12);
    textAlign(LEFT, TOP);
    text(skin.name, x + 66, y + 12);

    // Short desc
    fill(160);
    textFont('Rajdhani');
    textSize(11);
    text(skin.desc, x + 66, y + 30);

    // Index number
    fill(60);
    textFont('Orbitron');
    textSize(9);
    textAlign(RIGHT, TOP);
    text(idx + 1, x + w - 8, y + 6);

    pop();
}

function handleSkinSelectClick(mx, my, bw, bh) {
    let cardW = min(bw * 0.4, 180);
    let cardH = cardW * 0.6;
    let gap = 14;
    let cols = 2;
    let startX = (bw - (cols * cardW + (cols - 1) * gap)) / 2;
    let startY = bh * 0.14;
    // Check relative to game box
    let rx = mx - gx;
    let ry = my - gy;

    for (let i = 0; i < SKINS.length; i++) {
        let col = i % cols;
        let row = floor(i / cols);
        let cx = startX + col * (cardW + gap);
        let cy = startY + row * (cardH + gap);
        if (rx >= cx && rx <= cx + cardW && ry >= cy && ry <= cy + cardH) {
            selectedSkinIdx = i;
            return;
        }
    }
}
