// ── Main sketch — boxed game area + game loop ────────────────

const STATE_MENU = 0;
const STATE_PLAYING = 1;
const STATE_GAMEOVER = 2;
const STATE_LEVELUP = 3;

let gameState = STATE_MENU;

// Sprites
let sprPlayer, sprEnemy1, sprEnemy2, sprEnemy3, sprBullet;

// Objects
let player;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let explosions = [];
let starfield;
let handCtrl;

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
    starfield = createStarfield();

    handCtrl = new HandController();
    handCtrl.init();
}

function recalcGameBox() {
    let scale = min((windowHeight * 0.88) / GAME_H, (windowWidth * 0.5) / GAME_W);
    gw = floor(GAME_W * scale);
    gh = floor(GAME_H * scale);
    gx = floor((windowWidth - gw) / 2);
    gy = floor((windowHeight - gh) / 2);
}

function draw() {
    background(5, 3, 18);
    drawStarfield(starfield);

    if (gameState === STATE_PLAYING || gameState === STATE_LEVELUP) {
        drawSideUI();
    }

    // ── Game box ──
    push();
    let ctx = drawingContext;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0,120,255,0.3)';
    stroke(0, 120, 255, 80);
    strokeWeight(2);
    noFill();
    rect(gx - 2, gy - 2, gw + 4, gh + 4, 3);
    ctx.shadowBlur = 0;

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
        startGame();
    }
}

let _kbReady = false;
function keyPressed() {
    if (gameState === STATE_MENU && (keyCode === ENTER || keyCode === 32)) _kbReady = true;
    if (gameState === STATE_GAMEOVER && (keyCode === ENTER || keyCode === 32)) startGame();
    if (gameState === STATE_LEVELUP) {
        if (key === '1') applyUpgrade(1);
        if (key === '2') applyUpgrade(2);
        if (key === '3') applyUpgrade(3);
    }
}

// ── PLAYING ──────────────────────────────────────────────────

function updatePlaying() {
    let hx = null, hy = null;
    if (handCtrl.handX !== null && handCtrl.handY !== null) {
        hx = map(handCtrl.handX, 0, width, 0, gw);
        hy = map(handCtrl.handY, 0, height, 0, gh);
    }

    player.update(hx, hy, handCtrl.shooting, playerBullets, gw, gh);

    for (let e of enemies) e.update(enemyBullets, gw, gh);

    for (let b of playerBullets) b.update(gw, gh);
    for (let b of enemyBullets) b.update(gw, gh);
    playerBullets = playerBullets.filter(b => b.active);
    enemyBullets = enemyBullets.filter(b => b.active);

    for (let e of explosions) e.update();
    explosions = explosions.filter(e => !e.isDone());

    // ── Collisions ──
    for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
        let b = playerBullets[bi];
        if (!b.active) continue;
        for (let ei = 0; ei < enemies.length; ei++) {
            let e = enemies[ei];
            if (!e.active || e.pattern === 'static' || e.spawning) continue;
            if (dist(b.x, b.y, e.x, e.y) < (e.w / 2 + b.radius)) {
                b.active = false;
                if (e.hit(player.damage)) {
                    player.score += 100;
                    player.exp += 100;
                    explosions.push(new Explosion(e.x, e.y, 28));
                    shakeAmount = 5;
                    killCount++;
                    respawnEnemy(ei);
                }
                break;
            }
        }
    }

    for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
        let b = enemyBullets[bi];
        if (!b.active) continue;
        if (dist(b.x, b.y, player.x, player.y) < (player.w / 2.2 + b.radius)) {
            b.active = false;
            if (player.takeDamage(1)) {
                gameState = STATE_GAMEOVER;
                explosions.push(new Explosion(player.x, player.y, 50, [
                    [0, 180, 255], [0, 255, 255], [255, 255, 255], [100, 200, 255]
                ]));
                shakeAmount = 14;
            } else {
                shakeAmount = 6;
            }
        }
    }

    // ── Check level-up ──
    if (player.exp >= player.expToLevel) {
        gameState = STATE_LEVELUP;
    }

    // ── Draw ──
    for (let e of enemies) e.draw(getSpriteForType(e.type));
    player.draw(sprPlayer);
    for (let b of playerBullets) b.draw();
    for (let b of enemyBullets) b.draw();
    for (let e of explosions) e.draw();

    drawScoreInBox(player.score, gw);
}

// ── LEVEL UP ─────────────────────────────────────────────────

function updateLevelUp() {
    for (let e of enemies) e.draw(getSpriteForType(e.type));
    player.draw(sprPlayer);
    for (let b of playerBullets) b.draw();
    for (let b of enemyBullets) b.draw();
    drawScoreInBox(player.score, gw);

    fill(0, 0, 20, 160);
    noStroke();
    rect(0, 0, gw, gh);

    let ctx = drawingContext;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255,220,50,0.8)';
    fill(255, 220, 50);
    textFont('Orbitron');
    textSize(min(gw * 0.07, 36));
    textAlign(CENTER, CENTER);
    text('¡LEVEL UP!', gw / 2, gh * 0.2);
    ctx.shadowBlur = 0;

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
            player.damage += 2;
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
    for (let e of explosions) e.update();
    explosions = explosions.filter(e => !e.isDone());
    for (let e of explosions) e.draw();
    drawGameOverScreen(player.score, gw, gh);
    if (gameOverCooldown > 0) { gameOverCooldown--; return; }
    if (handCtrl.detected || _kbReady) startGame();
}

// ── Game init ────────────────────────────────────────────────

function startGame() {
    player = new Player(gw / 2, gh * 0.75);
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    explosions = [];
    waveType = 1;
    killCount = 0;
    gameOverCooldown = 60;
    _kbReady = false;
    gameState = STATE_PLAYING;
    spawnWave();
}

function spawnWave() {
    enemies = [];
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
    for (let cfg of patterns) {
        enemies.push(new Enemy(cfg.x, cfg.y, waveType, cfg.p, cfg.pp || {}));
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
    enemies[idx] = new Enemy(old.x, old.spawnTargetY, waveType, old.pattern, old.pp);
}

function getSpriteForType(t) {
    if (t === 1) return sprEnemy1;
    if (t === 2) return sprEnemy2;
    return sprEnemy3;
}

// ── Mouse click for card selection ───────────────────────────
function mousePressed() {
    if (gameState === STATE_LEVELUP) {
        let card = getClickedCard(mouseX, mouseY);
        if (card > 0) applyUpgrade(card);
    }
}
