const PROGRESS_KEY = 'troll_base_progress_v1';
const TOTAL_LEVELS = 10;
const FIRST_ENTRY_KEY = 'troll_base_first_entry_seen_v1';
const LEVEL_CLEAR_COIN_REWARD = 25;
const DAILY_MISSION_REWARD_COINS = 40;
const MENU_MUSIC_VOLUME_KEY = 'troll_base_menu_music_volume_v1';

const PLAYER_COLORS = [
    { id: 'verde', name: 'Verde', tint: 0x6be18f, cost: 0 },
    { id: 'azul', name: 'Azul', tint: 0x69b9ff, cost: 60 },
    { id: 'laranja', name: 'Laranja', tint: 0xffad66, cost: 110 },
    { id: 'rosa', name: 'Rosa', tint: 0xff7fbf, cost: 150 }
];

function getPlayerColorById(id) {
    const found = PLAYER_COLORS.find((c) => c.id === id);
    return found || PLAYER_COLORS[0];
}

function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function buildDailyMission(dateKey) {
    const dayNum = Number((dateKey || '').replace(/-/g, '')) || 0;
    const target = 2 + (dayNum % 3); // 2..4 fases
    return {
        date: dateKey,
        type: 'complete_levels',
        target,
        progress: 0,
        completed: false,
        rewarded: false,
        rewardCoins: DAILY_MISSION_REWARD_COINS
    };
}

function normalizeDailyMission(raw) {
    const today = getTodayKey();
    if (!raw || raw.date !== today) {
        return buildDailyMission(today);
    }
    const target = Math.max(1, Number(raw.target) || 2);
    const progress = Phaser.Math.Clamp(Number(raw.progress) || 0, 0, target);
    const completed = progress >= target || !!raw.completed;
    return {
        date: today,
        type: 'complete_levels',
        target,
        progress,
        completed,
        rewarded: !!raw.rewarded,
        rewardCoins: Math.max(1, Number(raw.rewardCoins) || DAILY_MISSION_REWARD_COINS)
    };
}

function formatDurationMs(ms) {
    const total = Math.max(0, Math.floor(ms || 0));
    const min = Math.floor(total / 60000);
    const sec = Math.floor((total % 60000) / 1000);
    const cent = Math.floor((total % 1000) / 10);
    const mm = String(min).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');
    const cc = String(cent).padStart(2, '0');
    return `${mm}:${ss}.${cc}`;
}

function toOwnedMap(raw) {
    if (Array.isArray(raw)) {
        return raw.reduce((acc, id) => {
            if (typeof id === 'string' && id) {
                acc[id] = true;
            }
            return acc;
        }, {});
    }
    if (raw && typeof raw === 'object') {
        const map = {};
        Object.keys(raw).forEach((k) => {
            map[k] = !!raw[k];
        });
        return map;
    }
    return {};
}

function createDefaultProgress(totalLevels) {
    const ownedColors = { [PLAYER_COLORS[0].id]: true };
    return {
        unlockedLevel: 0,
        lastLevel: 0,
        totalLevels,
        coins: 0,
        ownedColors,
        selectedColor: PLAYER_COLORS[0].id,
        ownedHats: {},
        selectedHat: 'none',
        rewardedLevels: {},
        dailyMission: normalizeDailyMission(null),
        bestSpeedrunMs: 0,
        bestSpeedrunDeaths: 0
    };
}

function loadProgress(totalLevels) {
    const fallback = createDefaultProgress(totalLevels);
    try {
        const raw = window.localStorage.getItem(PROGRESS_KEY);
        if (!raw) {
            return fallback;
        }
        const parsed = JSON.parse(raw);
        const maxLevel = Math.max(0, totalLevels - 1);
        const unlockedLevel = Phaser.Math.Clamp(Number(parsed.unlockedLevel) || 0, 0, maxLevel);
        const lastLevel = Phaser.Math.Clamp(Number(parsed.lastLevel) || 0, 0, unlockedLevel);
        const coins = Math.max(0, Number(parsed.coins) || 0);

        const ownedColors = toOwnedMap(parsed.ownedColors);
        ownedColors[PLAYER_COLORS[0].id] = true;
        const selectedColor = ownedColors[parsed.selectedColor] ? parsed.selectedColor : PLAYER_COLORS[0].id;

        const ownedHats = toOwnedMap(parsed.ownedHats);
        const selectedHatRaw = (typeof parsed.selectedHat === 'string') ? parsed.selectedHat : 'none';
        const selectedHat = (selectedHatRaw === 'none' || ownedHats[selectedHatRaw]) ? selectedHatRaw : 'none';

        const rewardedLevels = {};
        if (parsed.rewardedLevels && typeof parsed.rewardedLevels === 'object') {
            Object.keys(parsed.rewardedLevels).forEach((k) => {
                rewardedLevels[k] = !!parsed.rewardedLevels[k];
            });
        }
        const dailyMission = normalizeDailyMission(parsed.dailyMission);
        const bestSpeedrunMs = Math.max(0, Number(parsed.bestSpeedrunMs) || 0);
        const bestSpeedrunDeaths = Math.max(0, Number(parsed.bestSpeedrunDeaths) || 0);

        return {
            unlockedLevel,
            lastLevel,
            totalLevels,
            coins,
            ownedColors,
            selectedColor,
            ownedHats,
            selectedHat,
            rewardedLevels,
            dailyMission,
            bestSpeedrunMs,
            bestSpeedrunDeaths
        };
    } catch (_err) {
        return fallback;
    }
}

function saveProgress(progress, totalLevels) {
    const maxLevel = Math.max(0, totalLevels - 1);
    const normalized = {
        unlockedLevel: Phaser.Math.Clamp(Number(progress.unlockedLevel) || 0, 0, maxLevel),
        lastLevel: Phaser.Math.Clamp(Number(progress.lastLevel) || 0, 0, maxLevel),
        totalLevels,
        coins: Math.max(0, Number(progress.coins) || 0),
        ownedColors: toOwnedMap(progress.ownedColors),
        selectedColor: PLAYER_COLORS[0].id,
        ownedHats: toOwnedMap(progress.ownedHats),
        selectedHat: 'none',
        rewardedLevels: toOwnedMap(progress.rewardedLevels),
        dailyMission: normalizeDailyMission(progress.dailyMission),
        bestSpeedrunMs: Math.max(0, Number(progress.bestSpeedrunMs) || 0),
        bestSpeedrunDeaths: Math.max(0, Number(progress.bestSpeedrunDeaths) || 0)
    };

    normalized.ownedColors[PLAYER_COLORS[0].id] = true;
    if (normalized.ownedColors[progress.selectedColor]) {
        normalized.selectedColor = progress.selectedColor;
    }
    if (progress.selectedHat === 'none' || normalized.ownedHats[progress.selectedHat]) {
        normalized.selectedHat = progress.selectedHat || 'none';
    }

    try {
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalized));
    } catch (_err) {
        return normalized;
    }
    return normalized;
}

function loadMenuMusicVolume() {
    try {
        const raw = window.localStorage.getItem(MENU_MUSIC_VOLUME_KEY);
        if (raw === null) {
            return 0.55;
        }
        return Phaser.Math.Clamp(Number(raw), 0, 1);
    } catch (_err) {
        return 0.55;
    }
}

function saveMenuMusicVolume(volume) {
    const clamped = Phaser.Math.Clamp(Number(volume), 0, 1);
    try {
        window.localStorage.setItem(MENU_MUSIC_VOLUME_KEY, String(clamped));
    } catch (_err) {
        // ignore storage errors
    }
    return clamped;
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        if (!this.cache.audio.exists('Music')) {
            this.load.audio('Music', 'assets/music.mp3');
        }
        if (!this.cache.audio.exists('menu-click')) {
            this.load.audio('menu-click', 'assets/click.mp3');
        }
        if (!this.cache.audio.exists('death-sfx')) {
            this.load.audio('death-sfx', 'assets/Morte.mp3');
        }
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.menuTransitioning = false;
        this.panelOpen = false;
        this.progress = loadProgress(TOTAL_LEVELS);
        this.menuLetterGroups = [];
        this.menuMusic = null;
        this.menuMusicVolume = loadMenuMusicVolume();

        this.createMenuBackground(w, h);
        this.createScrambledTitle(26, 136, 'TROLL BASE');
        this.startMenuMusic();

        this.createMenuText(26, 250, 'JOGAR', () => {
            this.openSidePanel('play');
        });
        this.createMenuText(26, 332, 'SELETOR', () => {
            this.openSidePanel('levels');
        });
        this.createMenuText(26, 414, 'LOJA', () => {
            this.openSidePanel('shop');
        });
        this.createMenuText(26, 496, 'OPCOES', () => {
            this.openSidePanel('options');
        });
        this.createCoinsDisplay();

        this.createSidePanel(w, h);
        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.input.on('pointerdown', (pointer) => {
            if (!this.panelOpen) {
                return;
            }
            const outsideX = pointer.x < this.panelOpenX || pointer.x > (this.panelOpenX + this.panelWidth);
            const outsideY = pointer.y < this.panelY || pointer.y > (this.panelY + this.panelHeight);
            if (outsideX || outsideY) {
                this.closeSidePanel();
            }
        });

        this.input.keyboard.once('keydown-ENTER', () => {
            this.startGame(this.progress.lastLevel);
        });
        this.input.keyboard.once('keydown-SPACE', () => {
            this.startGame(this.progress.lastLevel);
        });

        this.playMenuEntryAnimation();

        this.events.once('shutdown', () => {
            if (this.menuMusic) {
                this.menuMusic.stop();
                this.menuMusic.destroy();
                this.menuMusic = null;
            }
        });
    }

    startMenuMusic() {
        const menuVolume = this.menuMusicVolume;
        this.menuMusic = this.sound.get('Music');
        if (!this.menuMusic) {
            this.menuMusic = this.sound.add('Music', { loop: true, volume: menuVolume });
        }
        if (!this.menuMusic.isPlaying) {
            this.menuMusic.play({ loop: true, volume: menuVolume });
        } else {
            this.menuMusic.setVolume(menuVolume);
        }
    }

    setMenuMusicVolume(volume) {
        this.menuMusicVolume = saveMenuMusicVolume(volume);
        if (this.menuMusic) {
            this.menuMusic.setVolume(this.menuMusicVolume);
        }
        if (this.updateOptionsMusicUi) {
            this.updateOptionsMusicUi();
        }
    }

    playMenuClickSound() {
        if (!this.cache.audio.exists('menu-click')) {
            return;
        }
        this.sound.play('menu-click', { volume: 0.45 });
    }

    createCoinsDisplay() {
        this.menuCoinsText = this.add.text(this.scale.width - 24, 22, '', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#fff3bf',
            stroke: '#0b1020',
            strokeThickness: 6
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(40);
        this.menuMissionText = this.add.text(this.scale.width - 24, 56, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#e8f2ff',
            stroke: '#0b1020',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(40);
        this.refreshMenuCoinsDisplay();
    }

    refreshMenuCoinsDisplay() {
        if (!this.menuCoinsText) {
            return;
        }
        this.menuCoinsText.setText(`MOEDAS: ${this.progress.coins}`);
        if (this.menuMissionText) {
            const m = this.progress.dailyMission;
            this.menuMissionText.setText(`MISSAO: ${m.progress}/${m.target}`);
        }
    }

    saveMenuProgressPatch(patch) {
        this.progress = saveProgress({
            ...this.progress,
            ...patch
        }, TOTAL_LEVELS);
        this.refreshMenuCoinsDisplay();
    }

    createScrambledTitle(x, y, text) {
        const chars = text.split('');
        let cursor = x;
        chars.forEach((ch, i) => {
            const isSpace = ch === ' ';
            const glyph = this.add.text(cursor, y + (isSpace ? 0 : ((i % 2 === 0) ? -5 : 6)), ch, {
                fontFamily: 'monospace',
                fontSize: '74px',
                color: '#ffffff',
                stroke: '#0b1020',
                strokeThickness: 8
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

            if (!isSpace) {
                const rot = ((i % 3) - 1) * 0.06;
                glyph.setRotation(rot);
            }

            cursor += isSpace ? 26 : (glyph.width - 8);
        });
    }

    createMenuBackground(w, h) {
        this.previewWidth = 1800;
        this.menuCycleDuration = 32000;
        this.shootingStars = [];
        this.nextShootingStarAt = 0;
        this.skyTopLayer = this.add.rectangle(0, 0, this.previewWidth, h, 0x22315a, 1).setOrigin(0);
        this.skyBottomLayer = this.add.rectangle(0, 0, this.previewWidth, h, 0x4f6ea2, 0.45).setOrigin(0);
        this.horizonGlow = this.add.ellipse(this.previewWidth * 0.5, h * 0.70, this.previewWidth * 1.25, 260, 0xffa66b, 0.25)
            .setBlendMode(Phaser.BlendModes.SCREEN);
        this.skyTintLayer = this.add.rectangle(0, 0, this.previewWidth, h, 0x0a1020, 0.12).setOrigin(0);
        this.groundFade = this.add.rectangle(0, h * 0.74, this.previewWidth, h * 0.26, 0x101827, 0.58).setOrigin(0);

        this.sun = this.add.circle(180, 460, 44, 0xffcc70, 0.95).setDepth(1);
        this.sunHalo = this.add.circle(180, 460, 85, 0xffa74d, 0.22).setDepth(1);
        this.moon = this.add.circle(this.previewWidth - 220, 160, 30, 0xdde7ff, 0.9).setDepth(1).setAlpha(0);
        this.moonHalo = this.add.circle(this.previewWidth - 220, 160, 62, 0xa4b7ff, 0.16).setDepth(1).setAlpha(0);

        this.menuClouds = [];
        for (let i = 0; i < 4; i += 1) {
            const cx = 220 + (i * 470);
            const cy = 180 + ((i % 2) * 90);
            const cloud = this.add.ellipse(cx, cy, 340, 110, 0x4d7db8, 0.12).setBlendMode(Phaser.BlendModes.SCREEN);
            cloud.setData('speed', 0.1 + (i * 0.05));
            this.menuClouds.push(cloud);
        }

        this.menuStars = [];
        for (let i = 0; i < 90; i += 1) {
            const x = Phaser.Math.Between(20, this.previewWidth - 20);
            const y = Phaser.Math.Between(22, 360);
            const r = Phaser.Math.Between(1, 2);
            const a = Phaser.Math.FloatBetween(0.35, 0.95);
            const star = this.add.circle(x, y, r, 0xcfe1ff, a);
            star.setData('baseAlpha', a);
            star.setData('phase', Phaser.Math.FloatBetween(0, Math.PI * 2));
            this.menuStars.push(star);
        }

        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.previewWidth, h);
        cam.setZoom(1);
        cam.stopFollow();
        cam.setScroll(0, 0);
    }

    spawnShootingStar() {
        const startX = Phaser.Math.Between(Math.floor(this.previewWidth * 0.55), this.previewWidth - 120);
        const startY = Phaser.Math.Between(36, 180);
        const star = this.add.container(startX, startY).setDepth(6);
        const tail = this.add.rectangle(-28, 10, 64, 3, 0xbfd7ff, 0.45).setOrigin(0, 0.5);
        const head = this.add.circle(0, 0, 3, 0xffffff, 1);
        star.add([tail, head]);
        star.setRotation(-0.62);
        this.shootingStars.push(star);

        this.tweens.add({
            targets: star,
            x: startX - Phaser.Math.Between(260, 420),
            y: startY + Phaser.Math.Between(170, 250),
            alpha: 0,
            duration: Phaser.Math.Between(520, 820),
            ease: 'Cubic.easeIn',
            onComplete: () => {
                const idx = this.shootingStars.indexOf(star);
                if (idx >= 0) {
                    this.shootingStars.splice(idx, 1);
                }
                star.destroy();
            }
        });
    }

    lerpColor(c1, c2, t) {
        return Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(c1),
            Phaser.Display.Color.ValueToColor(c2),
            1,
            Phaser.Math.Clamp(t, 0, 1)
        ).color;
    }

    applySkyCycle(time) {
        const p = (time % this.menuCycleDuration) / this.menuCycleDuration;
        let skyTop;
        let skyBottom;
        let horizon;
        let nightFactor;

        if (p < 0.25) {
            const t = p / 0.25;
            skyTop = this.lerpColor(0x1b2147, 0x6a8fd6, t);
            skyBottom = this.lerpColor(0x6d4260, 0xffc991, t);
            horizon = this.lerpColor(0xff8a66, 0xffd9a0, t);
            nightFactor = 1 - t;
        } else if (p < 0.55) {
            const t = (p - 0.25) / 0.30;
            skyTop = this.lerpColor(0x6a8fd6, 0x84b7ff, t);
            skyBottom = this.lerpColor(0xffc991, 0xffe7bc, t);
            horizon = this.lerpColor(0xffd9a0, 0xfff1cc, t);
            nightFactor = 0;
        } else if (p < 0.80) {
            const t = (p - 0.55) / 0.25;
            skyTop = this.lerpColor(0x84b7ff, 0x3d4a7f, t);
            skyBottom = this.lerpColor(0xffe7bc, 0xff9a73, t);
            horizon = this.lerpColor(0xfff1cc, 0xff8162, t);
            nightFactor = t * 0.6;
        } else {
            const t = (p - 0.80) / 0.20;
            skyTop = this.lerpColor(0x3d4a7f, 0x11182f, t);
            skyBottom = this.lerpColor(0xff9a73, 0x2f355f, t);
            horizon = this.lerpColor(0xff8162, 0x5968a8, t);
            nightFactor = 0.6 + (0.4 * t);
        }

        this.skyTopLayer.setFillStyle(skyTop, 1);
        this.skyBottomLayer.setFillStyle(skyBottom, 0.50 + ((1 - nightFactor) * 0.18));
        this.horizonGlow.setFillStyle(horizon, 0.22 + ((1 - nightFactor) * 0.14));
        this.skyTintLayer.setFillStyle(0x0a1020, 0.08 + (nightFactor * 0.36));
        this.groundFade.setFillStyle(0x101827, 0.40 + (nightFactor * 0.35));

        const sunX = 140 + (p * (this.previewWidth - 280));
        const sunY = 500 - Math.sin(p * Math.PI) * 320;
        this.sun.setPosition(sunX, sunY);
        this.sunHalo.setPosition(sunX, sunY);
        const sunAlpha = Phaser.Math.Clamp(Math.sin(p * Math.PI) * 1.2, 0, 1);
        this.sun.setAlpha(sunAlpha);
        this.sunHalo.setAlpha(sunAlpha * 0.35);

        const moonP = (p + 0.5) % 1;
        const moonX = 140 + (moonP * (this.previewWidth - 280));
        const moonY = 500 - Math.sin(moonP * Math.PI) * 320;
        this.moon.setPosition(moonX, moonY);
        this.moonHalo.setPosition(moonX, moonY);
        const moonAlpha = Phaser.Math.Clamp((nightFactor - 0.25) * 1.8, 0, 0.9);
        this.moon.setAlpha(moonAlpha);
        this.moonHalo.setAlpha(moonAlpha * 0.35);

        return nightFactor;
    }

    createMenuText(x, y, label, onClick) {
        const chars = label.split('');
        const glyphs = [];
        let cursor = x;

        chars.forEach((ch, i) => {
            const gy = y + ((i % 2 === 0) ? -4 : 6) + (Phaser.Math.Between(-2, 2));
            const glyph = this.add.text(cursor, gy, ch, {
                fontFamily: 'monospace',
                fontSize: '58px',
                color: '#f2f4ff',
                stroke: '#0b1020',
                strokeThickness: 6
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(30);

            const baseRotation = ((i % 3) - 1) * 0.045;
            glyph.setRotation(baseRotation);
            glyph.setData('baseY', gy);
            glyph.setData('baseRotation', baseRotation);
            glyphs.push(glyph);

            this.tweens.add({
                targets: glyph,
                y: gy + ((i % 2 === 0) ? -0.5 : 0.5),
                angle: glyph.angle + ((i % 2 === 0) ? -2 : 2),
                duration: 850 + (i * 70),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            cursor += glyph.width - 8;
        });

        const hitWidth = cursor - x + 12;
        const hit = this.add.rectangle(x - 4, y, hitWidth, 78, 0xffffff, 0.001)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(29)
            .setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
            glyphs.forEach((glyph, i) => {
                glyph.setColor('#ffe39a');
                this.tweens.add({
                    targets: glyph,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    y: glyph.getData('baseY') - 0.6,
                    duration: 120,
                    ease: 'Quad.easeOut'
                });
            });
        });

        hit.on('pointerout', () => {
            glyphs.forEach((glyph) => {
                glyph.setColor('#f2f4ff');
                this.tweens.add({
                    targets: glyph,
                    scaleX: 1,
                    scaleY: 1,
                    y: glyph.getData('baseY'),
                    angle: glyph.getData('baseRotation') * (180 / Math.PI),
                    duration: 120,
                    ease: 'Quad.easeOut'
                });
            });
        });

        hit.on('pointerdown', () => {
            if (this.menuTransitioning) {
                return;
            }
            this.playMenuClickSound();
            glyphs.forEach((glyph) => {
                this.tweens.add({
                    targets: glyph,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 70,
                    yoyo: true,
                    ease: 'Quad.easeOut'
                });
            });
            this.time.delayedCall(60, () => onClick());
        });

        this.menuLetterGroups.push({ glyphs, hit });
    }

    playMenuEntryAnimation() {
        this.menuLetterGroups.forEach((group, groupIndex) => {
            const baseDelay = groupIndex * 120;
            group.glyphs.forEach((glyph, i) => {
                const targetY = glyph.y;
                glyph.setAlpha(0);
                glyph.setY(targetY + 24);
                this.tweens.add({
                    targets: glyph,
                    alpha: 1,
                    y: targetY,
                    duration: 280,
                    delay: baseDelay + (i * 35),
                    ease: 'Back.easeOut'
                });
            });
            group.hit.disableInteractive();
            this.time.delayedCall(baseDelay + 420, () => {
                if (group.hit && group.hit.scene) {
                    group.hit.setInteractive({ useHandCursor: true });
                }
            });
        });
    }

    createSidePanel(w, h) {
        this.panelWidth = 520;
        this.panelHeight = 520;
        this.panelY = Math.floor((h - this.panelHeight) * 0.5);
        this.panelOpenX = w - this.panelWidth - 28;
        this.panelClosedX = w + 40;
        this.panel = this.add.container(this.panelClosedX, this.panelY).setScrollFactor(0).setDepth(40);
        this.panel.setVisible(false);
        const shadow = this.add.rectangle(10, 14, this.panelWidth, this.panelHeight, 0x000000, 0.35).setOrigin(0);
        const bg = this.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0xf2d87a, 0.98).setOrigin(0);
        const innerFill = this.add.rectangle(10, 18, this.panelWidth - 20, this.panelHeight - 28, 0xf7e7a8, 0.95).setOrigin(0);
        const border = this.add.rectangle(0, 0, this.panelWidth, this.panelHeight).setOrigin(0).setStrokeStyle(5, 0x000000, 1);
        const borderInner = this.add.rectangle(6, 6, this.panelWidth - 12, this.panelHeight - 12).setOrigin(0).setStrokeStyle(2, 0x000000, 0.85);
        this.panelContent = this.add.container(24, 68);
        this.panelCloseHit = this.add.rectangle(this.panelWidth - 34, 34, 56, 56, 0xe8c85a, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x000000, 1)
            .setInteractive({ useHandCursor: true });
        this.panelClose = this.add.text(this.panelWidth - 34, 34, 'X', {
            fontFamily: 'monospace',
            fontSize: '34px',
            color: '#111111'
        }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

        const closeAction = () => {
            if (this.panelOpen) {
                this.playMenuClickSound();
            }
            this.closeSidePanel();
        };
        this.panelCloseHit.on('pointerover', () => this.panelCloseHit.setFillStyle(0xf2db87, 1));
        this.panelCloseHit.on('pointerout', () => this.panelCloseHit.setFillStyle(0xe8c85a, 1));
        this.panelCloseHit.on('pointerdown', closeAction);
        this.panelCloseHit.on('pointerup', closeAction);
        this.panelClose.on('pointerdown', closeAction);
        this.panelClose.on('pointerup', closeAction);
        this.panel.add([shadow, bg, innerFill, border, borderInner, this.panelContent, this.panelCloseHit, this.panelClose]);

        this.tweens.add({
            targets: border,
            alpha: 0.75,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.tweens.add({
            targets: this.panelCloseHit,
            scaleX: 1.06,
            scaleY: 1.06,
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    clearPanel() {
        this.panelContent.removeAll(true);
    }

    createScrambledPanelText(x, y, label, fontSize, color) {
        const chars = label.split('');
        const glyphs = [];
        let cursor = x;
        chars.forEach((ch, i) => {
            const isSpace = ch === ' ';
            const gy = y + (isSpace ? 0 : ((i % 2 === 0) ? -2 : 3));
            const glyph = this.add.text(cursor, gy, ch, {
                fontFamily: 'monospace',
                fontSize: `${fontSize}px`,
                color,
                stroke: '#0b1020',
                strokeThickness: Math.max(2, Math.floor(fontSize * 0.11))
            }).setOrigin(0, 0.5);

            if (!isSpace) {
                const rot = ((i % 3) - 1) * 0.035;
                glyph.setRotation(rot);
                glyph.setData('baseY', gy);
                this.tweens.add({
                    targets: glyph,
                    y: gy + ((i % 2 === 0) ? -2 : 2),
                    duration: 900 + (i * 50),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            this.panelContent.add(glyph);
            glyphs.push(glyph);
            cursor += isSpace ? Math.ceil(fontSize * 0.42) : (glyph.width - Math.ceil(fontSize * 0.08));
        });

        return { glyphs, width: cursor - x };
    }

    createPanelTitle(title) {
        this.createScrambledPanelText(0, 18, title.toUpperCase(), 38, '#1a1711');
        const sub = this.add.text(2, 38, 'TROLL BASE', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#3f351f'
        });
        this.panelContent.add(sub);
    }

    createPanelButton(y, label, palette, onClick) {
        const bg = this.add.rectangle(0, y, 472, 58, palette.base, 1).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        const border = this.add.rectangle(0, y, 472, 58).setOrigin(0).setStrokeStyle(2, 0x000000, 1);
        this.panelContent.add(bg);
        this.panelContent.add(border);
        const labelParts = this.createScrambledPanelText(18, y + 29, label.toUpperCase(), 24, palette.text);

        bg.on('pointerover', () => {
            bg.setFillStyle(palette.hover, 1);
            this.tweens.add({ targets: [bg, border, ...labelParts.glyphs], x: '+=2', duration: 90, ease: 'Quad.easeOut' });
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(palette.base, 1);
            this.tweens.add({ targets: [bg, border, ...labelParts.glyphs], x: '-=2', duration: 90, ease: 'Quad.easeOut' });
        });
        bg.on('pointerdown', () => {
            this.playMenuClickSound();
            this.tweens.add({
                targets: [bg, border, ...labelParts.glyphs],
                scaleX: 0.98,
                scaleY: 0.98,
                duration: 70,
                yoyo: true
            });
            onClick();
        });
    }

    openSidePanel(mode) {
        this.clearPanel();
        this.currentPanelMode = mode;
        if (mode === 'play') {
            this.renderPlayPanel();
        } else if (mode === 'levels') {
            this.renderLevelSelectorPanel();
        } else if (mode === 'shop') {
            this.renderShopPanel();
        } else {
            this.renderOptionsPanel();
        }
        this.panelOpen = true;
        this.panel.setVisible(true);
        this.tweens.killTweensOf(this.panel);
        this.panel.setAlpha(0.85);
        this.panel.setScale(0.96);
        this.panel.list[0].setScale(0.88, 0.88); // shadow
        this.panel.list[0].setAlpha(0.22);
        this.tweens.add({
            targets: this.panel,
            x: this.panelOpenX,
            duration: 260,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: this.panel,
            scaleX: 1,
            scaleY: 1,
            duration: 260,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: this.panel,
            alpha: 1,
            duration: 180,
            ease: 'Quad.easeOut'
        });
        this.tweens.add({
            targets: this.panel.list[0],
            scaleX: 1,
            scaleY: 1,
            alpha: 0.35,
            duration: 260,
            ease: 'Back.easeOut'
        });
    }

    closeSidePanel() {
        if (!this.panelOpen) {
            return;
        }
        this.panelOpen = false;
        this.tweens.killTweensOf(this.panel);
        this.tweens.add({
            targets: this.panel,
            x: this.panelClosedX,
            duration: 200,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this.panel.setVisible(false);
            }
        });
    }

    renderPlayPanel() {
        this.createPanelTitle('Jogar');
        this.createPanelButton(96, `Continuar (Fase ${this.progress.lastLevel + 1})`, {
            base: 0xedd78f,
            hover: 0xf5e3ac,
            border: 0x000000,
            text: '#1e1b13'
        }, () => this.startGame(this.progress.lastLevel, 'normal'));
        this.createPanelButton(172, 'Novo Jogo (Fase 1)', {
            base: 0xe4cb78,
            hover: 0xf0db95,
            border: 0x000000,
            text: '#1e1b13'
        }, () => this.startGame(0, 'normal'));
        this.createPanelButton(248, 'Modo Speedrun', {
            base: 0xe1ca77,
            hover: 0xedd992,
            border: 0x000000,
            text: '#1e1b13'
        }, () => this.startGame(0, 'speedrun'));
        this.createPanelButton(324, 'Modo Hardcore', {
            base: 0xdcaf71,
            hover: 0xe6bf83,
            border: 0x000000,
            text: '#1e1b13'
        }, () => this.startGame(0, 'hardcore'));

        const best = this.progress.bestSpeedrunMs > 0
            ? `${formatDurationMs(this.progress.bestSpeedrunMs)} | mortes ${this.progress.bestSpeedrunDeaths}`
            : 'SEM RECORDE';
        const bestText = this.add.text(2, 406, `SPEEDRUN: ${best}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#3a2f18'
        });
        this.panelContent.add(bestText);
    }

    renderLevelSelectorPanel() {
        this.createPanelTitle('Seletor');

        for (let i = 0; i < this.progress.totalLevels; i += 1) {
            const unlocked = i <= this.progress.unlockedLevel;
            const col = i % 2;
            const row = Math.floor(i / 2);
            const itemW = 228;
            const itemH = 56;
            const gapX = 16;
            const gapY = 10;
            const x = col === 0 ? 0 : (itemW + gapX);
            const y = 96 + (row * (itemH + gapY));
            const bg = this.add.rectangle(x, y, itemW, itemH, unlocked ? 0xedd78f : 0xb3aa8c, 1).setOrigin(0, 0);
            const border = this.add.rectangle(x, y, itemW, itemH).setOrigin(0).setStrokeStyle(2, 0x000000, 1);
            const label = unlocked ? `Fase ${i + 1}` : `Fase ${i + 1} (bloqueada)`;
            const color = unlocked ? '#1e1b13' : '#3f3b30';
            this.panelContent.add(bg);
            this.panelContent.add(border);
            const compactLabel = unlocked ? `Fase ${i + 1}` : `Fase ${i + 1} X`;
            const textParts = this.createScrambledPanelText(x + 10, y + 29, compactLabel.toUpperCase(), 22, color);
            if (unlocked) {
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerover', () => {
                    bg.setFillStyle(0xf5e3ac, 1);
                    this.tweens.add({ targets: [bg, border, ...textParts.glyphs], x: '+=3', duration: 120, ease: 'Quad.easeOut' });
                });
                bg.on('pointerout', () => {
                    bg.setFillStyle(0xedd78f, 1);
                    this.tweens.add({ targets: [bg, border, ...textParts.glyphs], x: '-=3', duration: 120, ease: 'Quad.easeOut' });
                });
                bg.on('pointerdown', () => {
                    this.playMenuClickSound();
                    this.startGame(i);
                });
            }
        }
    }

    renderOptionsPanel() {
        this.createPanelTitle('Opcoes');

        this.createPanelButton(96, 'Alternar Tela Cheia', {
            base: 0xedd78f,
            hover: 0xf5e3ac,
            border: 0x000000,
            text: '#1e1b13'
        }, () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });

        this.createPanelButton(172, 'Resetar Progresso', {
            base: 0xe4cb78,
            hover: 0xf0db95,
            border: 0x000000,
            text: '#1e1b13'
        }, () => {
            this.progress = saveProgress(createDefaultProgress(TOTAL_LEVELS), TOTAL_LEVELS);
            this.refreshMenuCoinsDisplay();
            this.closeSidePanel();
        });

        const musicTitle = this.add.text(2, 258, 'MUSICA', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#2e2514'
        });
        this.panelContent.add(musicTitle);

        const barX = 54;
        const barY = 294;
        const barWidth = 360;
        const barHeight = 16;

        const minus = this.add.rectangle(0, barY - 18, 42, 36, 0xe4cb78, 1)
            .setOrigin(0)
            .setStrokeStyle(2, 0x000000, 1)
            .setInteractive({ useHandCursor: true });
        const minusLabel = this.add.text(16, barY, '-', {
            fontFamily: 'monospace',
            fontSize: '34px',
            color: '#201a10'
        }).setOrigin(0.5);

        const plus = this.add.rectangle(430, barY - 18, 42, 36, 0xe4cb78, 1)
            .setOrigin(0)
            .setStrokeStyle(2, 0x000000, 1)
            .setInteractive({ useHandCursor: true });
        const plusLabel = this.add.text(451, barY, '+', {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#201a10'
        }).setOrigin(0.5);

        const track = this.add.rectangle(barX, barY, barWidth, barHeight, 0xa99660, 0.8)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0x000000, 1)
            .setInteractive({ useHandCursor: true });
        const fill = this.add.rectangle(barX + 2, barY, 2, barHeight - 6, 0x2f6535, 1).setOrigin(0, 0.5);
        const knob = this.add.circle(barX, barY, 9, 0xf5e3ac, 1).setStrokeStyle(2, 0x000000, 1);
        const valueText = this.add.text(2, 312, '', {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#3a2f18'
        });

        this.panelContent.add(minus);
        this.panelContent.add(minusLabel);
        this.panelContent.add(plus);
        this.panelContent.add(plusLabel);
        this.panelContent.add(track);
        this.panelContent.add(fill);
        this.panelContent.add(knob);
        this.panelContent.add(valueText);

        const applyTrackVolumeFromPointer = (pointer) => {
            const b = track.getBounds();
            const ratio = Phaser.Math.Clamp((pointer.x - b.left) / b.width, 0, 1);
            this.setMenuMusicVolume(ratio);
        };

        this.updateOptionsMusicUi = () => {
            const innerWidth = barWidth - 4;
            const progressWidth = Math.max(2, Math.round(innerWidth * this.menuMusicVolume));
            fill.displayWidth = progressWidth;
            knob.x = barX + (barWidth * this.menuMusicVolume);
            valueText.setText(`VOLUME: ${Math.round(this.menuMusicVolume * 100)}%`);
        };
        this.updateOptionsMusicUi();

        track.on('pointerdown', (pointer) => {
            this.playMenuClickSound();
            applyTrackVolumeFromPointer(pointer);
        });
        minus.on('pointerdown', () => {
            this.playMenuClickSound();
            this.setMenuMusicVolume(this.menuMusicVolume - 0.1);
        });
        plus.on('pointerdown', () => {
            this.playMenuClickSound();
            this.setMenuMusicVolume(this.menuMusicVolume + 0.1);
        });

        const m = this.progress.dailyMission;
        const missionLine = this.add.text(2, 354, `MISSAO DIARIA: ${m.progress}/${m.target} FASES`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#3a2f18'
        });
        this.panelContent.add(missionLine);
        const missionState = m.rewarded ? 'RECOMPENSA JA PEGA' : (m.completed ? `RECOMPENSA: +${m.rewardCoins}` : 'COMPLETE PARA GANHAR');
        const missionStateText = this.add.text(2, 378, missionState, {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#3a2f18'
        });
        this.panelContent.add(missionStateText);
    }

    rerenderCurrentPanel() {
        if (!this.panelOpen || !this.currentPanelMode) {
            return;
        }
        this.updateOptionsMusicUi = null;
        this.clearPanel();
        if (this.currentPanelMode === 'play') {
            this.renderPlayPanel();
        } else if (this.currentPanelMode === 'levels') {
            this.renderLevelSelectorPanel();
        } else if (this.currentPanelMode === 'shop') {
            this.renderShopPanel();
        } else {
            this.renderOptionsPanel();
        }
    }

    renderShopPanel() {
        this.createPanelTitle('Loja');

        const coinsLabel = this.add.text(2, 70, `MOEDAS: ${this.progress.coins}`, {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#302712'
        });
        this.panelContent.add(coinsLabel);

        let y = 106;
        PLAYER_COLORS.forEach((colorDef) => {
            const owned = !!this.progress.ownedColors[colorDef.id];
            const equipped = this.progress.selectedColor === colorDef.id;
            const action = equipped ? 'EQUIPADO' : (owned ? 'USAR' : `COMPRAR ${colorDef.cost}`);
            this.createPanelButton(y, `${colorDef.name} - ${action}`, {
                base: owned ? 0xedd78f : 0xe2cc86,
                hover: owned ? 0xf5e3ac : 0xeddc9f,
                border: 0x000000,
                text: '#1e1b13'
            }, () => {
                if (equipped) {
                    return;
                }
                if (owned) {
                    this.saveMenuProgressPatch({ selectedColor: colorDef.id });
                    this.rerenderCurrentPanel();
                    return;
                }
                if (this.progress.coins < colorDef.cost) {
                    coinsLabel.setText('MOEDAS INSUFICIENTES');
                    return;
                }
                this.saveMenuProgressPatch({
                    coins: this.progress.coins - colorDef.cost,
                    ownedColors: { ...this.progress.ownedColors, [colorDef.id]: true },
                    selectedColor: colorDef.id
                });
                this.rerenderCurrentPanel();
            });
            y += 66;
        });

    }

    startGame(levelIndex, mode = 'normal') {
        if (this.menuTransitioning) {
            return;
        }
        this.menuTransitioning = true;
        const maxLevel = this.progress.unlockedLevel;
        const clamped = (mode === 'normal')
            ? Phaser.Math.Clamp(levelIndex, 0, maxLevel)
            : 0;
        this.progress = saveProgress({
            ...this.progress,
            lastLevel: clamped
        }, TOTAL_LEVELS);
        const startGameplayScene = () => {
            this.scene.start('Start', { startLevel: clamped, introZoom: true, mode });
        };

        this.cameras.main.fadeOut(900, 0, 0, 0);
        if (this.menuMusic && this.menuMusic.isPlaying) {
            this.tweens.add({
                targets: this.menuMusic,
                volume: 0,
                duration: 900,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    if (this.menuMusic) {
                        this.menuMusic.stop();
                    }
                    startGameplayScene();
                }
            });
            return;
        }

        this.time.delayedCall(900, () => startGameplayScene());
    }

    update(time) {
        if (this.panelOpen && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
            this.closeSidePanel();
        }
        const nightFactor = this.applySkyCycle(time);
        if (nightFactor > 0.5 && time > this.nextShootingStarAt) {
            this.spawnShootingStar();
            this.nextShootingStarAt = time + Phaser.Math.Between(2200, 5200);
        }
        if (this.menuClouds) {
            this.menuClouds.forEach((cloud) => {
                cloud.x += cloud.getData('speed');
                if (cloud.x > this.previewWidth + 200) {
                    cloud.x = -200;
                }
                cloud.setAlpha(0.08 + (0.12 * (1 - nightFactor)));
            });
        }
        if (this.menuStars) {
            this.menuStars.forEach((star) => {
                const base = star.getData('baseAlpha');
                const phase = star.getData('phase');
                const twinkle = base + Math.sin(time * 0.0024 + phase) * 0.16;
                star.setAlpha(twinkle * Phaser.Math.Clamp(nightFactor * 1.2, 0, 1));
            });
        }
    }
}

class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        if (!this.cache.audio.exists('death-sfx')) {
            this.load.audio('death-sfx', 'assets/Morte.mp3');
        }
        if (!this.cache.audio.exists('phase-sfx')) {
            this.load.audio('phase-sfx', 'assets/fase.mp3');
        }
    }

    init(data) {
        this.requestedStartLevel = (data && Number.isInteger(data.startLevel)) ? data.startLevel : null;
        this.introZoomPending = !!(data && data.introZoom);
        this.gameMode = (data && typeof data.mode === 'string') ? data.mode : 'normal';
    }

    create() {
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        this.mobileControls = new window.MobileControls(this);
        this.useMobileControls = this.mobileControls.enabled;
        this.playPhaseSound();

        this.createRuntimeTextures();
        this.createInput();
        this.createWorld();
        this.createUi();

        this.levels = this.buildLevels();
        this.progress = loadProgress(this.levels.length);
        const maxStart = Math.min(this.progress.unlockedLevel, this.levels.length - 1);
        const chosenStart = this.requestedStartLevel === null ? this.progress.lastLevel : this.requestedStartLevel;
        this.currentLevel = Phaser.Math.Clamp(chosenStart, 0, maxStart);
        this.levelBusy = false;
        this.gameWon = false;
        this.activeTimers = [];
        this.firstEntryAnimPlaying = false;
        this.narratorLastLine = '';
        this.runDeaths = 0;
        this.speedrunStartMs = this.time.now;

        this.setupLevel(this.currentLevel);
        this.setupNarrator();
        this.maybePlayFirstEntryAnimation();

        this.events.once('shutdown', () => {
            if (this.narratorLoop) {
                this.narratorLoop.remove(false);
                this.narratorLoop = null;
            }
        });
    }

    createRuntimeTextures() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.clear();
        g.fillStyle(0x2f2f38, 1);
        g.fillRect(0, 0, 64, 20);
        g.fillStyle(0x4b4b57, 1);
        g.fillRect(0, 0, 64, 3);
        g.generateTexture('platform', 64, 20);

        g.clear();
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 30, 46);
        g.generateTexture('player', 30, 46);

        g.clear();
        g.fillStyle(0x161616, 1);
        g.fillRect(0, 8, 30, 6);
        g.fillStyle(0xca2c2c, 1);
        g.fillRect(8, 1, 16, 8);
        g.fillStyle(0x2a2a2a, 1);
        g.fillRect(10, 3, 12, 4);
        g.generateTexture('hat-bone', 30, 16);

        g.clear();
        g.fillStyle(0x51c8ff, 1);
        g.fillRect(0, 0, 40, 64);
        g.fillStyle(0x10263b, 1);
        g.fillRect(6, 8, 28, 48);
        g.fillStyle(0xd7f4ff, 1);
        g.fillRect(10, 24, 20, 8);
        g.generateTexture('door', 40, 64);

        g.clear();
        g.fillStyle(0xff5a70, 1);
        g.fillTriangle(0, 24, 12, 0, 24, 24);
        g.generateTexture('spike', 24, 24);

        g.clear();
        g.fillStyle(0xe4c36a, 1);
        g.fillRect(0, 0, 42, 54);
        g.fillStyle(0x2c2515, 1);
        g.fillRect(6, 8, 30, 38);
        g.generateTexture('fake-door', 42, 54);
    }

    playPhaseSound() {
        if (!this.cache.audio.exists('phase-sfx')) {
            return;
        }
        this.sound.play('phase-sfx', { volume: 0.7 });
    }

    createInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.restart = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.menuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this.mobileControls.initializeInput();
    }

    createWorld() {
        this.bgGradientTop = this.add.rectangle(0, 0, this.gameWidth, Math.floor(this.gameHeight * 0.62), 0x0d0d12, 1)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(-6);
        this.bgGradientBottom = this.add.rectangle(0, Math.floor(this.gameHeight * 0.42), this.gameWidth, Math.ceil(this.gameHeight * 0.58), 0x13131a, 1)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(-5);
        this.bgHorizonGlow = this.add.ellipse(
            this.gameWidth * 0.5,
            this.gameHeight * 0.60,
            this.gameWidth * 1.3,
            Math.floor(this.gameHeight * 0.34),
            0x2a3248,
            0.24
        ).setScrollFactor(0).setDepth(-4).setBlendMode(Phaser.BlendModes.SCREEN);
        this.currentGradientColors = { top: 0x0d0d12, bottom: 0x13131a, horizon: 0x2a3248 };
        this.gradientTween = null;

        this.player = this.physics.add.sprite(160, 450, 'player');
        this.player.setCollideWorldBounds(false);
        this.player.body.setSize(22, 42).setOffset(4, 2);
        this.playerHat = this.add.sprite(160, 430, 'hat-bone')
            .setOrigin(0.5, 1)
            .setDepth(12)
            .setVisible(false);

        this.platforms = this.physics.add.staticGroup();
        this.staticHazards = this.physics.add.staticGroup();
        this.dynamicHazards = this.physics.add.group({ allowGravity: true, immovable: false });
        this.fakeDoors = this.physics.add.group({ allowGravity: false, immovable: true });

        this.door = this.physics.add.sprite(1000, 510, 'door');
        this.door.body.setAllowGravity(false);
        this.door.setImmovable(true);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.dynamicHazards, this.platforms);
        this.physics.add.collider(this.player, this.dynamicHazards, () => this.onDeath('Algo caiu na sua cabeca.'), null, this);
        this.physics.add.overlap(this.player, this.staticHazards, () => this.onDeath('Espinhos apareceram do nada.'), null, this);
        this.physics.add.overlap(this.player, this.fakeDoors, () => this.onDeath('Porta falsa. Troll total.'), null, this);
        this.physics.add.overlap(this.player, this.door, () => this.onReachDoor(), null, this);

        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    }

    syncPlayerHat() {
        if (!this.playerHat || !this.player) {
            return;
        }
        const topY = this.player.body ? this.player.body.y : (this.player.y - 21);
        this.playerHat.setPosition(this.player.x, topY + 2);
        this.playerHat.setFlipX(this.player.flipX);
        this.playerHat.setDepth(this.player.depth + 1);
    }

    applyPlayerCosmetics() {
        const colorDef = getPlayerColorById(this.progress.selectedColor);
        this.player.clearTint();
        this.player.setTint(colorDef.tint);

        this.playerHat.setVisible(false);
        this.syncPlayerHat();
    }

    interpolateColor(c1, c2, t) {
        return Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(c1),
            Phaser.Display.Color.ValueToColor(c2),
            1,
            Phaser.Math.Clamp(t, 0, 1)
        ).color;
    }

    applyGameplayGradient(gradient) {
        this.bgGradientTop.setFillStyle(gradient.top, 1);
        this.bgGradientBottom.setFillStyle(gradient.bottom, 1);
        this.bgHorizonGlow.setFillStyle(gradient.horizon, 0.24);
    }

    animateGameplayGradient(levelColors, duration) {
        const target = {
            top: levelColors.top || levelColors.bg,
            bottom: levelColors.bg,
            horizon: this.interpolateColor(levelColors.top || levelColors.bg, levelColors.bg, 0.38)
        };

        if (!this.currentGradientColors || duration <= 0) {
            this.currentGradientColors = target;
            this.applyGameplayGradient(target);
            return;
        }

        if (this.gradientTween) {
            this.gradientTween.remove();
            this.gradientTween = null;
        }

        const start = { ...this.currentGradientColors };
        const driver = { t: 0 };
        this.gradientTween = this.tweens.add({
            targets: driver,
            t: 1,
            duration,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                const mix = {
                    top: this.interpolateColor(start.top, target.top, driver.t),
                    bottom: this.interpolateColor(start.bottom, target.bottom, driver.t),
                    horizon: this.interpolateColor(start.horizon, target.horizon, driver.t)
                };
                this.applyGameplayGradient(mix);
            },
            onComplete: () => {
                this.currentGradientColors = target;
                this.gradientTween = null;
            }
        });
    }

    createUi() {
        this.levelText = this.add.text(this.gameWidth * 0.5, 12, '', {
            fontFamily: 'monospace',
            fontSize: '22px',
            color: '#f3f3f3'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        const hintTextLabel = this.useMobileControls
            ? 'Controles touch: esquerda, direita, pulo | R reinicia | M menu'
            : 'A/D ou Setas | W/Cima/Espaco pula | R reinicia | M menu';
        this.hintText = this.add.text(this.gameWidth * 0.5, 38, hintTextLabel, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#9fa6b8'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.eventText = this.add.text(this.gameWidth * 0.5, 60, '', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffd36f',
            align: 'center'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.narratorText = this.add.text(this.gameWidth * 0.5, 86, '', {
            fontFamily: 'monospace',
            fontSize: '17px',
            color: '#ffe9b8',
            stroke: '#0b1020',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5, 0).setScrollFactor(0).setAlpha(0);

        this.coinText = this.add.text(this.gameWidth - 12, 12, '', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffe6a1',
            stroke: '#0b1020',
            strokeThickness: 5
        }).setOrigin(1, 0).setScrollFactor(0);
        this.refreshCoinsUi();

        this.modeText = this.add.text(12, 12, '', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#dbe7ff',
            stroke: '#0b1020',
            strokeThickness: 4
        }).setOrigin(0, 0).setScrollFactor(0);

        this.speedrunText = this.add.text(12, 34, '', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffe9b8',
            stroke: '#0b1020',
            strokeThickness: 4
        }).setOrigin(0, 0).setScrollFactor(0);
        this.refreshModeUi();

        if (this.useMobileControls) {
            this.mobileControls.createUi(this.gameWidth, this.gameHeight);
        }
    }

    refreshCoinsUi() {
        if (this.coinText) {
            const coins = this.progress ? this.progress.coins : 0;
            this.coinText.setText(`MOEDAS ${coins}`);
        }
    }

    refreshModeUi() {
        if (!this.modeText || !this.speedrunText) {
            return;
        }
        const modeLabel = this.gameMode === 'speedrun'
            ? 'MODO SPEEDRUN'
            : (this.gameMode === 'hardcore' ? 'MODO HARDCORE' : 'MODO NORMAL');
        this.modeText.setText(modeLabel);
        this.speedrunText.setVisible(this.gameMode === 'speedrun');
    }

    setupNarrator() {
        this.narratorGeneralLines = [
            'isso. confia nesse chao ai.',
            'ta quase... ou nao.',
            'boa tentativa, jogador.',
            'essa fase sorri antes de morder.',
            'anda mais. vai dar nada...'
        ];
        this.narratorDeathLines = [
            'ops. era armadilha.',
            'eu avisei (nao avisei).',
            'morreu bonito.',
            'mais uma pro contador.',
            'essa doeu daqui.'
        ];
        this.narratorDoorLines = [
            'porta vista. paz nunca.',
            'chegou na porta? bom sinal ruim.',
            'nao relaxa agora.',
            'porta encontrada. caos confirmado.'
        ];
        this.narratorRestartLines = [
            'reiniciar e estilo.',
            'vamos fingir que foi teste.',
            'agora vai. talvez.',
            'mais uma run limpa. confia.'
        ];

        this.narratorLoop = this.time.addEvent({
            delay: 7000,
            loop: true,
            callback: () => {
                if (this.firstEntryAnimPlaying || this.levelBusy || this.gameWon) {
                    return;
                }
                this.speakNarrator(this.pickNarratorLine(this.narratorGeneralLines));
            }
        });
    }

    pickNarratorLine(list) {
        if (!list || list.length === 0) {
            return '';
        }
        if (list.length === 1) {
            this.narratorLastLine = list[0];
            return list[0];
        }
        let next = list[Phaser.Math.Between(0, list.length - 1)];
        let guard = 0;
        while (next === this.narratorLastLine && guard < 8) {
            next = list[Phaser.Math.Between(0, list.length - 1)];
            guard += 1;
        }
        this.narratorLastLine = next;
        return next;
    }

    speakNarrator(text) {
        if (!text || !this.narratorText) {
            return;
        }
        this.tweens.killTweensOf(this.narratorText);
        this.narratorText.setText(text.toUpperCase());
        this.narratorText.setY(86);
        this.narratorText.setAlpha(0);
        this.tweens.add({
            targets: this.narratorText,
            alpha: 1,
            y: 82,
            duration: 150,
            ease: 'Quad.easeOut'
        });
        this.tweens.add({
            targets: this.narratorText,
            alpha: 0,
            y: 78,
            delay: 1700,
            duration: 300,
            ease: 'Quad.easeIn'
        });
    }

    buildLevels() {
        if (typeof window.getTrollBaseLevels === 'function') {
            return window.getTrollBaseLevels();
        }
        return [];
    }

    setupLevel(index) {
        this.clearTimers();
        this.levelBusy = false;
        this.gameWon = false;
        this.clearLevelObjects();

        const level = this.levels[index];
        this.currentLevelData = level;

        this.physics.world.gravity.y = level.gravity;
        this.controlMirror = !!level.alwaysMirror;

        this.physics.world.setBounds(0, 0, level.width, this.gameHeight);
        this.cameras.main.setBounds(0, 0, level.width, this.gameHeight);
        this.animateGameplayGradient(level.colors, 360);
        this.eventText.setColor(level.colors.event);

        Object.keys(level.events).forEach((key) => {
            level.events[key] = false;
        });

        level.platformObjects = {};
        level.platforms.forEach((p) => {
            const obj = this.platforms.create(p.x, p.y, 'platform');
            obj.setDisplaySize(p.w, p.h);
            obj.setTint(level.colors.platform);
            obj.refreshBody();
            // Expand static body a bit so platform edges don't miss collisions.
            obj.body.setSize(p.w + 18, p.h + 10, true);
            if (p.id) {
                level.platformObjects[p.id] = obj;
            }
        });

        this.door.setPosition(level.door.x, level.door.y);
        this.door.body.enable = true;

        this.player.setVelocity(0, 0);
        this.player.setPosition(level.start.x, level.start.y);
        this.applyPlayerCosmetics();
        this.saveProgressPatch({ lastLevel: index });
        this.refreshCoinsUi();

        const chapter = (index + 1) >= 10 ? 'MEDIO' : 'FACIL';
        this.levelText.setText(`${level.name} | capitulo ${chapter} | objetivo: chegar na porta`);
        this.showEvent('');
        if (this.introZoomPending) {
            this.cameras.main.setZoom(0.56);
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 1,
                duration: 850,
                ease: 'Cubic.easeOut'
            });
            this.introZoomPending = false;
        } else {
            this.cameras.main.setZoom(1);
        }
        this.cameras.main.fadeIn(150, 0, 0, 0);
    }

    clearLevelObjects() {
        this.platforms.clear(true, true);
        this.staticHazards.clear(true, true);
        this.dynamicHazards.clear(true, true);
        this.fakeDoors.clear(true, true);
    }

    clearTimers() {
        this.activeTimers.forEach((t) => t.remove(false));
        this.activeTimers = [];
    }

    schedule(delay, cb) {
        const t = this.time.delayedCall(delay, cb);
        this.activeTimers.push(t);
        return t;
    }

    saveProgressPatch(patch) {
        this.progress = saveProgress({
            ...this.progress,
            ...patch
        }, this.levels.length);
        this.refreshCoinsUi();
    }

    advanceDailyMissionOnClear() {
        const m = normalizeDailyMission(this.progress.dailyMission);
        if (m.completed) {
            this.saveProgressPatch({ dailyMission: m });
            return { missionCompletedNow: false, rewardGranted: 0 };
        }
        const nextProgress = Phaser.Math.Clamp(m.progress + 1, 0, m.target);
        const completedNow = nextProgress >= m.target;
        const updated = {
            ...m,
            progress: nextProgress,
            completed: completedNow || m.completed
        };
        let rewardGranted = 0;
        if (completedNow && !updated.rewarded) {
            updated.rewarded = true;
            rewardGranted = updated.rewardCoins;
        }
        this.saveProgressPatch({
            dailyMission: updated,
            coins: this.progress.coins + rewardGranted
        });
        return { missionCompletedNow: completedNow, rewardGranted };
    }

    finishSpeedrunIfNeeded() {
        if (this.gameMode !== 'speedrun') {
            return;
        }
        const elapsed = Math.max(0, this.time.now - this.speedrunStartMs);
        const currentBest = this.progress.bestSpeedrunMs || 0;
        const isBest = currentBest === 0 || elapsed < currentBest;
        if (isBest) {
            this.saveProgressPatch({
                bestSpeedrunMs: elapsed,
                bestSpeedrunDeaths: this.runDeaths
            });
            this.showEvent(`NOVO RECORDE: ${formatDurationMs(elapsed)} | mortes ${this.runDeaths}`);
        } else {
            this.showEvent(`Tempo: ${formatDurationMs(elapsed)} | mortes ${this.runDeaths}`);
        }
    }

    grantLevelReward(levelIndex) {
        const key = String(levelIndex);
        if (this.progress.rewardedLevels[key]) {
            return 0;
        }
        const rewardedLevels = {
            ...this.progress.rewardedLevels,
            [key]: true
        };
        this.saveProgressPatch({
            coins: this.progress.coins + LEVEL_CLEAR_COIN_REWARD,
            rewardedLevels
        });
        return LEVEL_CLEAR_COIN_REWARD;
    }

    update() {
        this.syncPlayerHat();

        if (this.gameMode === 'speedrun' && this.speedrunText) {
            const elapsed = Math.max(0, this.time.now - this.speedrunStartMs);
            this.speedrunText.setText(`TEMPO ${formatDurationMs(elapsed)} | MORTES ${this.runDeaths}`);
        }

        if (this.firstEntryAnimPlaying) {
            return;
        }

        const menuPressed = Phaser.Input.Keyboard.JustDown(this.menuKey) || this.mobileControls.consume('menuQueued');
        if (menuPressed) {
            this.saveProgressPatch({ lastLevel: this.currentLevel });
            this.scene.start('MenuScene');
            return;
        }

        const restartPressed = Phaser.Input.Keyboard.JustDown(this.restart) || this.mobileControls.consume('restartQueued');
        if (restartPressed) {
            this.speakNarrator(this.pickNarratorLine(this.narratorRestartLines));
            if (this.gameWon) {
                this.currentLevel = 0;
            }
            this.setupLevel(this.currentLevel);
            return;
        }

        if (this.levelBusy) {
            return;
        }

        this.handleMovement();
        this.runLevelEvents();

        if (this.player.y > this.gameHeight + 120 || this.player.y < -120) {
            this.onDeath('Caiu fora da fase.');
        }
    }

    handleMovement() {
        const leftPressed = this.cursors.left.isDown || this.wasd.A.isDown || this.mobileControls.state.left;
        const rightPressed = this.cursors.right.isDown || this.wasd.D.isDown || this.mobileControls.state.right;
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
            || Phaser.Input.Keyboard.JustDown(this.wasd.W)
            || Phaser.Input.Keyboard.JustDown(this.space)
            || this.mobileControls.consume('jumpQueued');

        let direction = 0;
        if (leftPressed) {
            direction -= 1;
        }
        if (rightPressed) {
            direction += 1;
        }

        if (this.controlMirror) {
            direction *= -1;
        }

        this.player.setVelocityX(direction * 290);

        const gravityUp = this.physics.world.gravity.y < 0;
        const grounded = gravityUp ? this.player.body.blocked.up : this.player.body.blocked.down;
        const jumpForce = gravityUp ? 590 : -590;

        if (jumpPressed && grounded) {
            this.player.setVelocityY(jumpForce);
        }

        this.player.setFlipX(direction < 0);
    }

    setPlatformEnabled(platformObj, enabled) {
        if (!platformObj) {
            return;
        }
        if (enabled) {
            platformObj.enableBody(false, platformObj.x, platformObj.y, true, true);
            platformObj.refreshBody();
            return;
        }
        platformObj.disableBody(true, true);
    }

    tweenStaticPlatformY(platformObj, targetY, duration) {
        if (!platformObj) {
            return;
        }
        this.tweens.add({
            targets: platformObj,
            y: targetY,
            duration,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                platformObj.refreshBody();
            }
        });
    }

    startClockTrap(level) {
        if (level.events.clockLoopRunning) {
            return;
        }
        level.events.clockLoopRunning = true;
        const ids = ['clock1', 'clock2', 'clock3', 'clock4'];
        let step = 0;

        const tick = () => {
            if (this.currentLevelData !== level) {
                return;
            }
            const hideIndex = step % ids.length;
            ids.forEach((id, i) => {
                this.setPlatformEnabled(level.platformObjects[id], i !== hideIndex);
            });
            if (step % 2 === 1) {
                this.showEvent('Relogio girou.');
            }
            step += 1;
            this.schedule(620, tick);
        };

        tick();
    }

    startBossDoorSequence(level) {
        if (level.events.bossSequenceRunning) {
            return;
        }
        level.events.bossSequenceRunning = true;
        this.showEvent('Sobreviva por 12 segundos...');
        this.door.body.enable = false;

        const rounds = 8;
        const fixedSpikeXs = [1420, 1680, 1940, 2200, 2460, 2720, 2360, 2880];
        for (let i = 0; i < rounds; i += 1) {
            this.schedule(1200 * i, () => {
                if (this.currentLevelData !== level) {
                    return;
                }
                const spikeX = fixedSpikeXs[i] || fixedSpikeXs[fixedSpikeXs.length - 1];
                this.spawnFloorSpikes(spikeX, 3);
                this.showEvent(`CAOS ${i + 1}/${rounds}`);
            });
        }

        this.schedule((rounds * 1200) + 200, () => {
            if (this.currentLevelData !== level) {
                return;
            }
            level.events.bossDone = true;
            this.door.setPosition(level.door.x, level.door.y);
            this.door.body.enable = true;
            this.showEvent('Porta verdadeira liberada.');
        });
    }

    runLevelEvents() {
        const level = this.currentLevelData;
        const x = this.player.x;

        if (this.currentLevel === 0) {
            if (!level.events.popSpike && x > 700) {
                level.events.popSpike = true;
                this.spawnFloorSpikes(820, 5);
                this.showEvent('Espinhos do nada.');
            }
            if (!level.events.vanishStep && x > 880) {
                level.events.vanishStep = true;
                const step = level.platformObjects.trapStep;
                if (step) {
                    step.disableBody(true, true);
                }
                this.showEvent('Chao falso removido.');
            }
            if (!level.events.teleportDoor && x > 1460) {
                level.events.teleportDoor = true;
                this.door.setX(1200);
                this.spawnFloorSpikes(1120, 4);
                this.showEvent('Porta teleportou.');
            }
        }

        if (this.currentLevel === 1) {
            if (!level.events.dropFloor && x > 1020) {
                level.events.dropFloor = true;
                const fakeFloor = level.platformObjects.fakeFloor;
                if (fakeFloor) {
                    fakeFloor.disableBody(true, true);
                }
                this.showEvent('Piso do espelho caiu.');
            }
            if (!level.events.wallSpike && x > 1360) {
                level.events.wallSpike = true;
                for (let i = 0; i < 5; i += 1) {
                    this.createSpike(1510, 542 - (i * 24), -Math.PI / 2);
                }
                this.showEvent('Parede com espinho.');
            }
            if (!level.events.mirrorBlink && x > 1700) {
                level.events.mirrorBlink = true;
                this.controlMirror = false;
                this.schedule(350, () => {
                    this.controlMirror = true;
                    this.showEvent('Espelho voltou.');
                });
                this.showEvent('Controles normais... por 0.3s.');
            }
        }

        if (this.currentLevel === 2) {
            if (!level.events.gravityFlip && x > 1100) {
                level.events.gravityFlip = true;
                this.physics.world.gravity.y = -1200;
                this.spawnFloorSpikes(1180, 3);
                this.showEvent('Gravidade invertida.');
            }
            if (!level.events.skySpikes && x > 1500) {
                level.events.skySpikes = true;
                for (let i = 0; i < 4; i += 1) {
                    this.createSpike(1600 + 24 * i, 144, Math.PI);
                }
                this.showEvent('Espinhos no teto.');
            }
            if (!level.events.gravityBack && x > 1880) {
                level.events.gravityBack = true;
                this.physics.world.gravity.y = 1200;
                this.showEvent('Gravidade normal de novo.');
            }
        }

        if (this.currentLevel === 3) {
            if (!level.events.swapDoorPlayer && x > 1000) {
                level.events.swapDoorPlayer = true;
                const px = this.player.x;
                const py = this.player.y;
                this.player.setPosition(this.door.x - 40, this.door.y);
                this.door.setPosition(px + 220, py - 20);
                this.showEvent('Voce trocou de lugar com a porta.');
            }
            if (!level.events.fakeDoor && x > 1350) {
                level.events.fakeDoor = true;
                const fake = this.fakeDoors.create(1820, 512, 'fake-door');
                fake.body.setSize(42, 54, true);
                this.showEvent('Porta extra (falsa).');
            }
            if (!level.events.collapseLate && x > 1740) {
                level.events.collapseLate = true;
                const s = level.platformObjects.swapStep;
                if (s) {
                    s.disableBody(true, true);
                }
                this.spawnFloorSpikes(1880, 4);
                this.showEvent('Chao sumiu no final.');
            }
        }

        if (this.currentLevel === 4) {
            if (!level.events.spikeRain && x > 1180) {
                level.events.spikeRain = true;
                for (let i = 0; i < 7; i += 1) {
                    this.schedule(220 * i, () => {
                        const fall = this.dynamicHazards.create(1320 + (i * 95), 150, 'spike');
                        fall.body.setAllowGravity(true);
                        fall.setVelocity(-60, 130);
                        fall.setRotation(Math.PI);
                    });
                }
                this.showEvent('Chuva de espinhos.');
            }
            if (!level.events.controlsTroll && x > 1620) {
                level.events.controlsTroll = true;
                this.controlMirror = true;
                this.schedule(2600, () => {
                    this.controlMirror = false;
                });
                this.showEvent('Espelho temporario.');
            }
            if (!level.events.doorRun && x > 2040) {
                level.events.doorRun = true;
                this.tweens.add({
                    targets: this.door,
                    x: 2400,
                    duration: 360,
                    ease: 'Sine.easeInOut'
                });
                this.showEvent('A porta correu.');
            }
            if (!level.events.finalCollapse && x > 2160) {
                level.events.finalCollapse = true;
                const b = level.platformObjects.finalBridge;
                if (b) {
                    b.disableBody(true, true);
                }
                this.spawnFloorSpikes(2200, 4);
                this.showEvent('Ultimo troll.');
            }
        }

        if (this.currentLevel === 5) {
            if (!level.events.crumbleA && x > 1040) {
                level.events.crumbleA = true;
                const s = level.platformObjects.fragileA;
                this.showEvent('Piso fragil tremendo...');
                if (s) {
                    this.tweens.add({
                        targets: s,
                        angle: 4,
                        duration: 70,
                        yoyo: true,
                        repeat: 7,
                        ease: 'Sine.easeInOut'
                    });
                    this.schedule(1100, () => {
                        if (this.currentLevel !== 5) {
                            return;
                        }
                        s.disableBody(true, true);
                        this.showEvent('Plataforma falsa caiu.');
                    });
                }
            }
            if (!level.events.spikeLane && x > 1620) {
                level.events.spikeLane = true;
                this.spawnFloorSpikes(1760, 6);
                this.showEvent('Corredor de espinhos.');
            }
            if (!level.events.fakeEndDoor && x > 2140) {
                level.events.fakeEndDoor = true;
                const fake = this.fakeDoors.create(2480, 452, 'fake-door');
                fake.body.setSize(42, 54, true);
                this.showEvent('A porta errada apareceu.');
            }
        }

        if (this.currentLevel === 6) {
            if (!level.events.startClock && x > 700) {
                level.events.startClock = true;
                this.startClockTrap(level);
                this.showEvent('Fase relogio ativada.');
            }
            if (!level.events.panicSpikes && x > 2160) {
                level.events.panicSpikes = true;
                this.spawnFloorSpikes(2420, 5);
                this.showEvent('Ultimo giro do relogio.');
            }
        }

        if (this.currentLevel === 7) {
            if (!level.events.firstLift && x > 940) {
                level.events.firstLift = true;
                this.tweenStaticPlatformY(level.platformObjects.liftA, 430, 520);
                this.showEvent('Elevador subiu.');
            }
            if (!level.events.secondLift && x > 1600) {
                level.events.secondLift = true;
                this.tweenStaticPlatformY(level.platformObjects.liftB, 450, 420);
                this.tweenStaticPlatformY(level.platformObjects.liftC, 420, 560);
                this.showEvent('Elevadores trocaram.');
            }
            if (!level.events.ceilingTrap && x > 2380) {
                level.events.ceilingTrap = true;
                for (let i = 0; i < 4; i += 1) {
                    this.createSpike(2520 + (i * 24), 528, Math.PI);
                }
                this.showEvent('Teto vivo ativado.');
            }
        }

        if (this.currentLevel === 8) {
            if (!level.events.echoSpike && x > 1080) {
                level.events.echoSpike = true;
                const echoX = this.player.x;
                this.showEvent('Seu eco foi salvo...');
                this.schedule(1500, () => {
                    if (this.currentLevel !== 8) {
                        return;
                    }
                    this.spawnFloorSpikes(echoX - 40, 4);
                    this.showEvent('Eco atacou o passado.');
                });
            }
            if (!level.events.echoMirror && x > 1680) {
                level.events.echoMirror = true;
                this.schedule(900, () => {
                    if (this.currentLevel !== 8) {
                        return;
                    }
                    this.controlMirror = true;
                    this.showEvent('Eco inverteu os controles.');
                    this.schedule(1200, () => {
                        if (this.currentLevel !== 8) {
                            return;
                        }
                        this.controlMirror = false;
                        this.showEvent('Eco desligado.');
                    });
                });
            }
            if (!level.events.echoCollapse && x > 2360) {
                level.events.echoCollapse = true;
                const s = level.platformObjects.echoStep;
                if (s) {
                    s.disableBody(true, true);
                }
                this.showEvent('Eco removeu o ultimo piso.');
            }
        }

        if (this.currentLevel === 9) {
            if (!level.events.bossStart && x > 1120) {
                level.events.bossStart = true;
                this.startBossDoorSequence(level);
            }
            if (!level.events.collapseA && x > 1260) {
                level.events.collapseA = true;
                const a = level.platformObjects.chaosA;
                if (a) {
                    this.tweenStaticPlatformY(a, 650, 520);
                }
                this.showEvent('O caos comecou.');
            }
            if (!level.events.collapseB && x > 2140) {
                level.events.collapseB = true;
                const b = level.platformObjects.chaosB;
                if (b) {
                    this.tweenStaticPlatformY(b, 650, 520);
                }
                this.showEvent('Mais uma plataforma cedeu.');
            }
            if (!level.events.collapseC && x > 2920) {
                level.events.collapseC = true;
                const c = level.platformObjects.chaosC;
                if (c) {
                    this.tweenStaticPlatformY(c, 650, 520);
                }
                this.showEvent('Ultima queda antes da porta.');
            }
        }
    }

    spawnFloorSpikes(startX, count) {
        for (let i = 0; i < count; i += 1) {
            this.createSpike(startX + (24 * i), 536, 0);
        }
    }

    createSpike(x, y, rotation) {
        const spike = this.staticHazards.create(x, y, 'spike');
        spike.setRotation(rotation);
        spike.body.setSize(22, 20, true);
    }

    onDeath(message) {
        if (this.levelBusy) {
            return;
        }
        if (this.cache.audio.exists('death-sfx')) {
            this.sound.play('death-sfx', { volume: 0.75 });
        }
        this.runDeaths += 1;

        if (this.gameMode === 'hardcore') {
            this.levelBusy = true;
            this.showEvent('Hardcore: morreu, run encerrada.');
            this.speakNarrator('hardcore acabou. tente de novo.');
            this.player.setVelocity(0, 0);
            this.player.setTint(0xff5a70);
            this.cameras.main.shake(160, 0.012);
            this.schedule(880, () => {
                this.scene.start('MenuScene');
            });
            return;
        }

        this.levelBusy = true;
        this.showEvent(message + ' Reiniciando...');
        this.speakNarrator(this.pickNarratorLine(this.narratorDeathLines));
        this.player.setVelocity(0, 0);
        this.player.setTint(0xff5a70);
        this.cameras.main.shake(130, 0.01);

        this.schedule(520, () => {
            this.player.clearTint();
            this.setupLevel(this.currentLevel);
        });
    }

    onReachDoor() {
        if (this.levelBusy) {
            return;
        }
        this.playPhaseSound();
        this.speakNarrator(this.pickNarratorLine(this.narratorDoorLines));
        const reward = this.grantLevelReward(this.currentLevel);
        const rewardText = reward > 0 ? ` +${reward} moedas.` : '';
        const daily = this.advanceDailyMissionOnClear();
        const missionText = daily.rewardGranted > 0 ? ` MISSAO +${daily.rewardGranted}.` : '';

        if (this.currentLevel < this.levels.length - 1) {
            this.levelBusy = true;
            this.player.setVelocity(0, 0);
            this.playLevelClearCelebration(() => {
                this.showEvent(`Fase concluida.${rewardText}${missionText} Carregando proxima...`);
                this.transitionToNextLevel();
            });
            return;
        }

        this.levelBusy = true;
        this.gameWon = true;
        this.saveProgressPatch({
            unlockedLevel: this.levels.length - 1,
            lastLevel: this.levels.length - 1
        });
        this.player.setVelocity(0, 0);
        if (reward > 0) {
            this.showEvent(`+${reward} moedas na final!${missionText}`);
        }
        this.finishSpeedrunIfNeeded();
        this.playFinalWinCinematic();
    }

    showEvent(text) {
        // Eventos em texto desativados: manter apenas narracao por voz.
        return;
    }

    playLevelClearCelebration(onComplete) {
        const px = this.player.x;
        const py = this.player.y - 18;
        const burst = [];
        const confettiColors = [0xffe28a, 0x9fe5ff, 0xff9cab, 0xc4f2a6, 0xd4b8ff];

        for (let i = 0; i < 18; i += 1) {
            const p = this.add.rectangle(px, py, 8, 8, confettiColors[i % confettiColors.length], 1);
            p.setDepth(90);
            p.setAngle(Phaser.Math.Between(0, 180));
            burst.push(p);
            this.tweens.add({
                targets: p,
                x: px + Phaser.Math.Between(-190, 190),
                y: py - Phaser.Math.Between(70, 220),
                angle: p.angle + Phaser.Math.Between(-160, 160),
                alpha: 0,
                duration: 480 + Phaser.Math.Between(0, 260),
                ease: 'Cubic.easeOut',
                onComplete: () => p.destroy()
            });
        }

        const pulse = this.add.circle(px, py, 18, 0xffffff, 0.18).setDepth(89);
        this.tweens.add({
            targets: pulse,
            radius: 140,
            alpha: 0,
            duration: 460,
            ease: 'Cubic.easeOut',
            onComplete: () => pulse.destroy()
        });

        const levelClear = this.add.text(this.gameWidth * 0.5, this.gameHeight * 0.30, 'FASE LIMPA!', {
            fontFamily: 'monospace',
            fontSize: '52px',
            color: '#fff2c2',
            stroke: '#0b1020',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(120).setAlpha(0).setScale(0.84);

        this.tweens.add({
            targets: levelClear,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 220,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: levelClear,
            alpha: 0,
            y: levelClear.y - 16,
            delay: 360,
            duration: 260,
            ease: 'Quad.easeIn',
            onComplete: () => levelClear.destroy()
        });

        this.cameras.main.shake(120, 0.004);
        this.time.delayedCall(620, () => {
            if (typeof onComplete === 'function') {
                onComplete();
            }
        });
    }

    playFinalWinCinematic() {
        this.showEvent('A porta final abriu...');

        const overlay = this.add.rectangle(
            this.gameWidth * 0.5,
            this.gameHeight * 0.5,
            this.gameWidth,
            this.gameHeight,
            0x000000,
            0
        ).setScrollFactor(0).setDepth(510);

        const topBand = this.add.rectangle(
            this.gameWidth * 0.5,
            -this.gameHeight * 0.24,
            this.gameWidth,
            this.gameHeight * 0.48,
            0x000000,
            1
        ).setScrollFactor(0).setDepth(511);

        const bottomBand = this.add.rectangle(
            this.gameWidth * 0.5,
            this.gameHeight + (this.gameHeight * 0.24),
            this.gameWidth,
            this.gameHeight * 0.48,
            0x000000,
            1
        ).setScrollFactor(0).setDepth(511);

        const msg = this.add.text(this.gameWidth * 0.5, this.gameHeight * 0.5, 'FIM?', {
            fontFamily: 'monospace',
            fontSize: '58px',
            color: '#f5f5f5',
            stroke: '#0b1020',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(512).setAlpha(0).setScale(0.9);

        const revealFinalCard = () => {
            overlay.destroy();
            topBand.destroy();
            bottomBand.destroy();
            msg.destroy();

            const card = this.add.rectangle(this.gameWidth * 0.5, this.gameHeight * 0.5, 640, 182, 0x0c0c10, 0.92)
                .setScrollFactor(0)
                .setDepth(520)
                .setScale(0.92)
                .setAlpha(0);

            const title = this.add.text(this.gameWidth * 0.5, this.gameHeight * 0.5 - 20, 'TROLL BASE CONCLUIDO', {
                fontFamily: 'monospace',
                fontSize: '30px',
                color: '#f7f7f7',
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(521).setAlpha(0);

            const hint = this.add.text(this.gameWidth * 0.5, this.gameHeight * 0.5 + 24, 'R para recomecar | M para menu', {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#9fa6b8'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(521).setAlpha(0);

            this.tweens.add({
                targets: [card, title, hint],
                alpha: 1,
                duration: 320,
                ease: 'Quad.easeOut'
            });
            this.tweens.add({
                targets: card,
                scaleX: 1,
                scaleY: 1,
                duration: 320,
                ease: 'Back.easeOut'
            });
            this.showEvent('Voce zerou TROLL BASE!');
        };

        this.tweens.add({
            targets: overlay,
            alpha: 0.5,
            duration: 220,
            ease: 'Quad.easeOut'
        });
        this.tweens.add({
            targets: topBand,
            y: this.gameHeight * 0.24,
            duration: 300,
            ease: 'Cubic.easeInOut'
        });
        this.tweens.add({
            targets: bottomBand,
            y: this.gameHeight * 0.76,
            duration: 300,
            ease: 'Cubic.easeInOut'
        });

        this.time.delayedCall(240, () => {
            this.tweens.add({
                targets: msg,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 220,
                ease: 'Back.easeOut'
            });
        });

        this.time.delayedCall(820, () => {
            msg.setText('...NAO.');
            msg.setColor('#ffcf9c');
            this.cameras.main.shake(120, 0.004);
        });

        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: [msg, overlay],
                alpha: 0,
                duration: 260,
                ease: 'Quad.easeIn'
            });
            this.tweens.add({
                targets: topBand,
                y: -this.gameHeight * 0.24,
                duration: 280,
                ease: 'Cubic.easeInOut'
            });
            this.tweens.add({
                targets: bottomBand,
                y: this.gameHeight + (this.gameHeight * 0.24),
                duration: 280,
                ease: 'Cubic.easeInOut',
                onComplete: revealFinalCard
            });
        });
    }

    transitionToNextLevel() {
        const nextLevelIndex = this.currentLevel + 1;
        const nextLevelName = this.levels[nextLevelIndex] ? this.levels[nextLevelIndex].name : `Fase ${nextLevelIndex + 1}`;

        const fadeLayer = this.add.rectangle(
            this.gameWidth * 0.5,
            this.gameHeight * 0.5,
            this.gameWidth,
            this.gameHeight,
            0x000000,
            0
        ).setScrollFactor(0).setDepth(499);

        const topCurtain = this.add.rectangle(
            this.gameWidth * 0.5,
            -this.gameHeight * 0.25,
            this.gameWidth,
            this.gameHeight * 0.5,
            0x000000,
            1
        ).setScrollFactor(0).setDepth(500);

        const bottomCurtain = this.add.rectangle(
            this.gameWidth * 0.5,
            this.gameHeight + (this.gameHeight * 0.25),
            this.gameWidth,
            this.gameHeight * 0.5,
            0x000000,
            1
        ).setScrollFactor(0).setDepth(500);

        const nextLabel = this.add.text(this.gameWidth * 0.5, this.gameHeight * 0.5, nextLevelName.toUpperCase(), {
            fontFamily: 'monospace',
            fontSize: '34px',
            color: '#f2f2f2',
            stroke: '#0b1020',
            strokeThickness: 7
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501).setAlpha(0).setScale(0.86);

        this.cameras.main.shake(100, 0.003);
        this.tweens.add({
            targets: fadeLayer,
            alpha: 0.42,
            duration: 180,
            ease: 'Quad.easeOut'
        });
        this.tweens.add({
            targets: topCurtain,
            y: this.gameHeight * 0.25,
            duration: 340,
            ease: 'Back.easeIn'
        });
        this.tweens.add({
            targets: bottomCurtain,
            y: this.gameHeight * 0.75,
            duration: 340,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.tweens.add({
                    targets: nextLabel,
                    alpha: 1,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 180,
                    ease: 'Back.easeOut'
                });

                this.currentLevel += 1;
                this.saveProgressPatch({
                    unlockedLevel: Math.max(this.progress.unlockedLevel, this.currentLevel),
                    lastLevel: this.currentLevel
                });
                this.setupLevel(this.currentLevel);
                this.levelBusy = true;
                this.cameras.main.shake(90, 0.002);

                this.time.delayedCall(180, () => {
                    this.tweens.add({
                        targets: topCurtain,
                        y: -this.gameHeight * 0.25,
                        duration: 340,
                        ease: 'Back.easeOut'
                    });
                    this.tweens.add({
                        targets: bottomCurtain,
                        y: this.gameHeight + (this.gameHeight * 0.25),
                        duration: 340,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            fadeLayer.destroy();
                            topCurtain.destroy();
                            bottomCurtain.destroy();
                            nextLabel.destroy();
                            this.levelBusy = false;
                        }
                    });
                    this.tweens.add({
                        targets: [fadeLayer, nextLabel],
                        alpha: 0,
                        duration: 220,
                        ease: 'Quad.easeIn'
                    });
                });
            }
        });
    }

    maybePlayFirstEntryAnimation() {
        let alreadySeen = false;
        try {
            alreadySeen = window.localStorage.getItem(FIRST_ENTRY_KEY) === '1';
        } catch (_err) {
            alreadySeen = false;
        }
        if (alreadySeen) {
            return;
        }

        this.firstEntryAnimPlaying = true;
        this.physics.world.pause();

        const title = this.add.text(this.gameWidth * 0.5, this.gameHeight * 0.5 - 24, 'TROLL BASE', {
            fontFamily: 'monospace',
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0);

        const subtitle = this.add.text(this.gameWidth * 0.5, this.gameHeight * 0.5 + 36, 'sobreviva as trollagens', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#c8d2f1'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0);

        this.tweens.add({ targets: title, alpha: 1, duration: 320, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: subtitle, alpha: 1, duration: 360, delay: 140, ease: 'Quad.easeOut' });
        this.tweens.add({
            targets: [title, subtitle],
            alpha: 0,
            duration: 420,
            delay: 1050,
            ease: 'Quad.easeIn',
            onComplete: () => {
                title.destroy();
                subtitle.destroy();
                this.physics.world.resume();
                this.firstEntryAnimPlaying = false;
                try {
                    window.localStorage.setItem(FIRST_ENTRY_KEY, '1');
                } catch (_err) {
                    // ignore storage errors
                }
            }
        });
    }
}

window.MenuScene = MenuScene;
window.Start = Start;
