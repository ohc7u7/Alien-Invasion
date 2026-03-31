// ── Main sketch — boxed game area + game loop ────────────────

const STATE_MENU = 0;
const STATE_PLAYING = 1;
const STATE_GAMEOVER = 2;
const STATE_LEVELUP = 3;
// STATE_SKINSELECT = 4  (defined in skins.js)

let gameState = STATE_MENU;

// Sprites
let sprPlayer, sprEnemy1, sprEnemy2, sprEnemy3, sprBullet;

// Objects
let player;
let enemies = [];
let bulletPool;
let particlePool;
let exhaustPool;
let explosionPool;
let powerups = [];   // active falling power-ups
let starfield;
let handCtrl;
let frameGlowLayer;

// Game box (fixed arcade-style area)
let gx, gy, gw, gh;
const GAME_W = 500;
const GAME_H = 700;

// Wave system
let waveType = 1;
let killCount = 0;
let killThresholds = [10, 4, 2];

// Screen shake
let shakeAmount = 0;

// Elite enemy tracking
let totalKills = 0;
const ELITE_EVERY = 5; // every N kills, next respawn is elite

// ── P5 lifecycle ─────────────────────────────────────────────

function preload() {
    sprPlayer = loadImage('assets/player.png');
    sprEnemy1 = loadImage('assets/enemy_1.png');
    sprEnemy2 = loadImage('assets/enemy_2.png');
    sprEnemy3 = loadImage('assets/enemy_3.png');
    sprBullet = loadImage('assets/bullet.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(1);
    imageMode(CORNER);
    textAlign(CENTER, CENTER);

    recalcGameBox();
    initPools();
    starfield = createStarfield();
    loadSkinUnlocks();

    handCtrl = new HandController();
    handCtrl.init();
}

function initPools() {
    bulletPool = new BulletPool(400);
    particlePool = new ParticlePool(300);
    exhaustPool = new ParticlePool(300);
    explosionPool = new ExplosionPool(50, particlePool);

    enemies = new Array(50);
    for (let i = 0; i < 50; i++) {
        enemies[i] = new Enemy();
    }

    powerups = new Array(30);
    for (let i = 0; i < 30; i++) {
        powerups[i] = new PowerUp(0, 0, 0);
        powerups[i].active = false;
    }
}

function recalcGameBox() {
    let scale = min((windowHeight * 0.88) / GAME_H, (windowWidth * 0.5) / GAME_W);
    gw = floor(GAME_W * scale);
    gh = floor(GAME_H * scale);
    gx = floor((windowWidth - gw) / 2);
    gy = floor((windowHeight - gh) / 2);
    buildFrameGlow();
}

function buildFrameGlow() {
    frameGlowLayer = createGraphics(gw + 14, gh + 14);
    frameGlowLayer.clear();
    frameGlowLayer.noFill();
    for (let i = 0; i < 5; i++) {
        frameGlowLayer.stroke(0, 140, 255, 80 - i * 12);
        frameGlowLayer.strokeWeight(1 + i);
        frameGlowLayer.rect(7 - i, 7 - i, gw + i * 2, gh + i * 2, 4);
    }
}

function draw() {
    background(5, 3, 18);
    drawStarfield(starfield);
    if (handCtrl) handCtrl.update();

    // Side UI
    if (gameState === STATE_PLAYING || gameState === STATE_LEVELUP) {
        drawSideUI();
    }

    // ── Game box ──
    push();
    if (frameGlowLayer) {
        image(frameGlowLayer, gx - 7, gy - 7);
    }
    stroke(0, 120, 255, 80);
    strokeWeight(2);
    noFill();
    rect(gx - 2, gy - 2, gw + 4, gh + 4, 3);

    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(gx, gy, gw, gh);
    drawingContext.clip();
    translate(gx, gy);

    noStroke();
    fill(3, 2, 12);
    rect(0, 0, gw, gh);

    if (shakeAmount > 0) {
        translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
        shakeAmount *= 0.88;
        if (shakeAmount < 0.4) shakeAmount = 0;
    }

    switch (gameState) {
        case STATE_MENU: updateMenu(); break;
        case STATE_SKINSELECT: updateSkinSelect(); break;
        case STATE_PLAYING: updatePlaying(); break;
        case STATE_GAMEOVER: updateGameOver(); break;
        case STATE_LEVELUP: updateLevelUp(); break;
    }

    pop();
    drawingContext.restore();

    if (gameState === STATE_LEVELUP) drawDeckCards();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    recalcGameBox();
    starfield = createStarfield();
}

// ── MENU ─────────────────────────────────────────────────────

function updateMenu() {
    drawMenuScreen(handCtrl.ready || _kbReady, gw, gh);
    if ((handCtrl.ready && handCtrl.detected) || _kbReady) {
        _kbReady = false;
        gameState = STATE_SKINSELECT;
    }
}

let _kbReady = false;

function keyPressed() {
    if (gameState === STATE_MENU && (keyCode === ENTER || keyCode === 32)) {
        _kbReady = true;
    }
    if (gameState === STATE_SKINSELECT) {
        if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') {
            selectedSkinIdx = (selectedSkinIdx - 1 + SKINS.length) % SKINS.length;
        }
        if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') {
            selectedSkinIdx = (selectedSkinIdx + 1) % SKINS.length;
        }
        if ((keyCode === ENTER || keyCode === 32) && SKINS[selectedSkinIdx].unlocked) {
            startGame();
        }
    }
    if (gameState === STATE_GAMEOVER && (keyCode === ENTER || keyCode === 32)) {
        gameState = STATE_SKINSELECT;
    }
    if (gameState === STATE_LEVELUP) {
        if (key === '1') applyUpgrade(1);
        if (key === '2') applyUpgrade(2);
        if (key === '3') applyUpgrade(3);
    }
}

// ── SKIN SELECT ──────────────────────────────────────────────

function updateSkinSelect() {
    drawSkinSelectScreen(gw, gh);
}

// ── PLAYING ──────────────────────────────────────────────────

function updatePlaying() {
    let hx = null, hy = null;
    if (handCtrl.detected && handCtrl.handX !== null && handCtrl.handY !== null) {
        hx = map(handCtrl.handX, 0, width, 0, gw);
        hy = map(handCtrl.handY, 0, height, 0, gh);
    }

    player.update(hx, hy, handCtrl.shooting, bulletPool, exhaustPool, gw, gh);

    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (e.active) e.update(bulletPool, gw, gh);
    }

    bulletPool.updateAll(gw, gh);
    particlePool.updateAll();
    exhaustPool.updateAll();
    explosionPool.updateAll();

    // Update power-ups
    for (let i = 0; i < powerups.length; i++) {
        let p = powerups[i];
        if (p.active) p.update();
    }

    // ── Collisions: player bullets → enemies ──
    for (let bi = 0; bi < bulletPool.pool.length; bi++) {
        let b = bulletPool.pool[bi];
        if (!b.active || !b.isPlayer) continue;
        for (let ei = 0; ei < enemies.length; ei++) {
            let e = enemies[ei];
            if (!e.active || e.pattern === 'static' || e.spawning) continue;
            if (dist(b.x, b.y, e.x, e.y) < (e.w / 2 + b.radius)) {
                b.deactivate();
                if (e.hit(player.damage)) {
                    player.score += 100;
                    player.exp += 100;
                    totalKills++;

                    // Elite enemy → drop power-up
                    if (e.elite) {
                        let puType = floor(random(4));
                        for (let k = 0; k < powerups.length; k++) {
                            if (!powerups[k].active) {
                                let p = powerups[k];
                                p.x = e.x; p.y = e.y; p.type = puType;
                                p.def = PU_DEFS[puType];
                                p.active = true;
                                p.radius = 14; 
                                p.vy = 1.5;
                                p.bobPhase = random(TWO_PI);
                                p.spawnTime = frameCount;
                                break;
                            }
                        }
                        explosionPool.getExplosion(e.x, e.y, 35, [
                            [255, 220, 50], [255, 255, 100], [255, 180, 0], [255, 240, 150]
                        ]);
                    } else {
                        explosionPool.getExplosion(e.x, e.y, 28);
                    }

                    shakeAmount = 5;
                    killCount++;
                    respawnEnemy(ei);
                }
                break;
            }
        }
    }

    // ── Collisions: enemy bullets → player ──
    for (let bi = 0; bi < bulletPool.pool.length; bi++) {
        let b = bulletPool.pool[bi];
        if (!b.active || b.isPlayer) continue;
        if (dist(b.x, b.y, player.x, player.y) < (player.w / 2.2 + b.radius)) {
            b.deactivate();
            if (player.takeDamage(1)) {
                gameState = STATE_GAMEOVER;
                checkAndUnlockSkins(player.score);
                explosionPool.getExplosion(player.x, player.y, 50, [
                    [0, 180, 255], [0, 255, 255], [255, 255, 255], [100, 200, 255]
                ]);
                shakeAmount = 14;
            } else {
                shakeAmount = 6;
            }
        }
    }

    // ── Collisions: power-ups → player ──
    for (let pi = powerups.length - 1; pi >= 0; pi--) {
        let pu = powerups[pi];
        if (!pu.active) continue;
        if (pu.collidesWith(player.x, player.y, player.w)) {
            pu.active = false;
            player.buffs.add(pu.type);
            // Pickup flash
            explosionPool.getExplosion(player.x, player.y, 15, [
                PU_DEFS[pu.type].col, [255, 255, 255]
            ]);
        }
    }

    // ── Check level-up ──
    if (player.exp >= player.expToLevel) {
        gameState = STATE_LEVELUP;
    }

    // ── Draw ──
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (e.active) e.draw(getSpriteForType(e.type));
    }
    for (let i = 0; i < powerups.length; i++) {
        let pu = powerups[i];
        if (pu.active) pu.draw();
    }
    exhaustPool.drawAll();
    player.draw(sprPlayer);
    bulletPool.drawAll();
    particlePool.drawAll();

    drawScoreInBox(player.score, gw);

    // Buff indicators inside box
    if (player.buffs) {
        player.buffs.drawIndicators(8, gh - 28);
    }
}

// ── LEVEL UP ─────────────────────────────────────────────────

function updateLevelUp() {
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (e.active) e.draw(getSpriteForType(e.type));
    }
    exhaustPool.drawAll();
    player.draw(sprPlayer);
    bulletPool.drawAll();
    particlePool.drawAll();
    drawScoreInBox(player.score, gw);

    fill(0, 0, 20, 160);
    noStroke();
    rect(0, 0, gw, gh);

    fill(255, 220, 50);
    textFont('Orbitron');
    textSize(min(gw * 0.07, 36));
    textAlign(CENTER, CENTER);
    text('¡LEVEL UP!', gw / 2, gh * 0.2);

    fill(200);
    textFont('Rajdhani');
    textSize(14);
    text('Elige una mejora', gw / 2, gh * 0.28);
}

function applyUpgrade(option) {
    if (gameState !== STATE_LEVELUP) return;
    switch (option) {
        case 1:
            player.maxHealth += 20;
            player.health = player.maxHealth;
            break;
        case 2:
            player.baseDamage += 2;
            break;
        case 3:
            player.shotCadence = max(150, player.shotCadence - 60);
            break;
    }
    player.expToLevel += 200;
    player.exp = 0;
    player.level++;
    gameState = STATE_PLAYING;
}

// ── GAME OVER ────────────────────────────────────────────────

let gameOverCooldown = 0;

function updateGameOver() {
    explosionPool.updateAll();
    particlePool.updateAll();
    particlePool.drawAll();
    drawGameOverScreen(player.score, gw, gh);
    if (gameOverCooldown > 0) { gameOverCooldown--; return; }
    if (handCtrl.detected) { gameState = STATE_SKINSELECT; }
}

// ── Game init ────────────────────────────────────────────────

function startGame() {
    let skin = getSelectedSkin();
    player = new Player(gw / 2, gh * 0.75, skin);
    for (let i = 0; i < enemies.length; i++) enemies[i].active = false;
    bulletPool.deactivateAll();
    particlePool.deactivateAll();
    exhaustPool.deactivateAll();
    explosionPool.deactivateAll();
    for (let i = 0; i < powerups.length; i++) powerups[i].active = false;
    waveType = 1;
    killCount = 0;
    totalKills = 0;
    gameOverCooldown = 60;
    _kbReady = false;
    gameState = STATE_PLAYING;
    spawnWave();
}

function spawnWave() {
    for (let i = 0; i < enemies.length; i++) enemies[i].active = false;
    let cx = gw / 2;
    let patterns;
    switch (waveType) {
        case 1:
            patterns = [
                { x: cx - 150, y: 60, p: 'horizontal' },
                { x: cx - 80, y: 130, p: 'sine', pp: { amp: 60, freq: 0.5, cx: cx - 80 } },
                { x: cx, y: 130, p: 'sine', pp: { amp: 60, freq: 0.5, cx: cx } },
                { x: cx + 80, y: 130, p: 'sine', pp: { amp: 60, freq: 0.5, cx: cx + 80 } },
                { x: cx + 150, y: 200, p: 'horizontal' }
            ];
            break;
        case 2:
            patterns = [
                { x: cx - 150, y: 60, p: 'static' },
                { x: cx - 80, y: 100, p: 'sine', pp: { amp: 70, freq: 0.6, cx: cx - 80 } },
                { x: cx, y: 80, p: 'static' },
                { x: cx + 80, y: 100, p: 'sine', pp: { amp: 70, freq: 0.6, cx: cx + 80 } },
                { x: cx + 150, y: 60, p: 'static' }
            ];
            break;
        case 3:
            patterns = [
                { x: cx - 150, y: 60, p: 'static' },
                { x: cx - 80, y: 80, p: 'static' },
                { x: cx, y: 100, p: 'sine', pp: { amp: 55, freq: 0.4, cx: cx } },
                { x: cx + 80, y: 80, p: 'static' },
                { x: cx + 150, y: 60, p: 'static' }
            ];
            break;
    }
    let ei = 0;
    for (let cfg of patterns) {
        if (ei < enemies.length) {
            enemies[ei].activate(cfg.x, cfg.y, waveType, cfg.p, cfg.pp || {});
            ei++;
        }
    }
}

function respawnEnemy(idx) {
    if (killCount >= killThresholds[waveType - 1]) {
        killCount = 0;
        waveType = (waveType % 3) + 1;
        spawnWave();
        return;
    }
    let old = enemies[idx];
    old.activate(old.x, old.spawnTargetY, waveType, old.pattern, old.pp);

    // Make elite if cycle hit
    if (totalKills > 0 && totalKills % ELITE_EVERY === 0) {
        old.elite = true;
        old.hearts = ceil(old.hearts * 1.5);
        old.maxH = old.hearts;
    }
}

function getSpriteForType(t) {
    if (t === 1) return sprEnemy1;
    if (t === 2) return sprEnemy2;
    return sprEnemy3;
}

// ── Mouse ────────────────────────────────────────────────────
function mousePressed() {
    if (gameState === STATE_LEVELUP) {
        let card = getClickedCard(mouseX, mouseY);
        if (card > 0) applyUpgrade(card);
    }
    if (gameState === STATE_SKINSELECT) {
        handleSkinSelectClick(mouseX, mouseY, gw, gh);
        // Double-click start: if clicked on already-selected unlocked skin
        let sk = SKINS[selectedSkinIdx];
        if (sk.unlocked) {
            // Check if click is in the lower area (start button zone)
            let ry = mouseY - gy;
            if (ry > gh * 0.7) startGame();
        }
    }
}
