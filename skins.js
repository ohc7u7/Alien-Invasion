// ── Ship Skins system ────────────────────────────────────────

const SKINS = [
    {
        id: 'default',
        name: 'VIPER',
        desc: 'Nave estándar equilibrada',
        speed: 5,
        damage: 2,
        health: 15,
        cadence: 550,
        spriteKey: 'player',      // uses sprPlayer
        unlocked: true,
        unlockReq: null,
        col: [0, 200, 255]
    },
    {
        id: 'tank',
        name: 'TITAN',
        desc: 'Blindada: +HP, −velocidad',
        speed: 3.5,
        damage: 2,
        health: 30,
        cadence: 700,
        spriteKey: 'player',
        unlocked: false,
        unlockReq: { type: 'score', value: 2000, label: '2000 pts' },
        col: [255, 100, 50]
    },
    {
        id: 'rapid',
        name: 'PHANTOM',
        desc: 'Rápida: +cadencia, −HP',
        speed: 7,
        damage: 1,
        health: 10,
        cadence: 300,
        spriteKey: 'player',
        unlocked: false,
        unlockReq: { type: 'score', value: 5000, label: '5000 pts' },
        col: [200, 50, 255]
    },
    {
        id: 'heavy',
        name: 'DESTROYER',
        desc: 'Destructora: +daño, −cadencia',
        speed: 4,
        damage: 4,
        health: 12,
        cadence: 800,
        spriteKey: 'player',
        unlocked: false,
        unlockReq: { type: 'score', value: 8000, label: '8000 pts' },
        col: [255, 200, 50]
    }
];

let selectedSkinIdx = 0;

function loadSkinUnlocks() {
    let data = localStorage.getItem('ai_skin_unlocks');
    if (data) {
        try {
            let unlocked = JSON.parse(data);
            for (let s of SKINS) {
                if (unlocked.includes(s.id)) s.unlocked = true;
            }
        } catch (e) { }
    }
    // Default is always unlocked
    SKINS[0].unlocked = true;
}

function saveSkinUnlocks() {
    let unlocked = SKINS.filter(s => s.unlocked).map(s => s.id);
    localStorage.setItem('ai_skin_unlocks', JSON.stringify(unlocked));
}

function checkAndUnlockSkins(score) {
    let newUnlock = false;
    for (let s of SKINS) {
        if (!s.unlocked && s.unlockReq && s.unlockReq.type === 'score') {
            if (score >= s.unlockReq.value) {
                s.unlocked = true;
                newUnlock = true;
            }
        }
    }
    if (newUnlock) saveSkinUnlocks();
    return newUnlock;
}

function getSelectedSkin() {
    return SKINS[selectedSkinIdx];
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
    let barVals = [sk.speed / 8, sk.damage / 5, sk.health / 30, 1 - (sk.cadence - 200) / 800];
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

    if (sk.unlocked) {
        ctx.shadowBlur = 12 * pulse;
        ctx.shadowColor = 'rgba(0,255,160,0.6)';
        fill(0, lerp(150, 255, pulse), lerp(80, 160, pulse));
        textFont('Orbitron');
        textSize(16);
        textAlign(CENTER, CENTER);
        text('ENTER / CLIC PARA JUGAR', bw / 2, btnY);
        ctx.shadowBlur = 0;
    } else {
        fill(120);
        textFont('Rajdhani');
        textSize(14);
        textAlign(CENTER, CENTER);
        text('🔒 Desbloquea con ' + sk.unlockReq.label, bw / 2, btnY);
    }

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

    fill(skin.unlocked ? color(12, 12, 22, 230) : color(20, 15, 15, 230));
    rect(x, y, w, h, 8);
    ctx.shadowBlur = 0;

    // Ship preview (tinted)
    if (skin.unlocked) {
        tint(c[0], c[1], c[2]);
        imageMode(CENTER);
        image(sprPlayer, x + 36, y + h / 2, 40, 44);
        noTint();
    } else {
        // Lock icon
        fill(80);
        textSize(24);
        textAlign(CENTER, CENTER);
        text('🔒', x + 36, y + h / 2);
    }

    // Name
    noStroke();
    fill(skin.unlocked ? color(c[0], c[1], c[2]) : color(80));
    textFont('Orbitron');
    textSize(12);
    textAlign(LEFT, TOP);
    text(skin.name, x + 66, y + 12);

    // Short desc
    fill(skin.unlocked ? 160 : 60);
    textFont('Rajdhani');
    textSize(11);
    text(skin.desc, x + 66, y + 30);

    // Unlock requirement
    if (!skin.unlocked && skin.unlockReq) {
        fill(100, 80, 50);
        textSize(10);
        text('🔒 ' + skin.unlockReq.label, x + 66, y + h - 20);
    }

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
