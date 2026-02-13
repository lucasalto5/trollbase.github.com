(function () {
    window.TrollBaseLevel10 = {
        name: 'Fase 10 - Ultimo Caos',
        colors: { bg: 0x23191c, top: 0x160f11, platform: 0xad7a86, event: '#ffd5e0' },
        width: 3400,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 280, y: 520 },
        door: { x: 3220, y: 510 },
        platforms: [
            { x: 460, y: 560, w: 420, h: 24 },
            { x: 1040, y: 560, w: 360, h: 24, id: 'chaosA' },
            { x: 1540, y: 560, w: 320, h: 24 },
            { x: 1980, y: 560, w: 320, h: 24, id: 'chaosB' },
            { x: 2440, y: 560, w: 360, h: 24 },
            { x: 2920, y: 560, w: 360, h: 24, id: 'chaosC' },
            { x: 3220, y: 560, w: 220, h: 24, id: 'bossGate' }
        ],
        events: { bossStart: false, collapseA: false, collapseB: false, collapseC: false, bossDone: false }
    };
})();

