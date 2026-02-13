(function () {
    window.TrollBaseLevel07 = {
        name: 'Fase 7 - Relogio',
        colors: { bg: 0x1a1f13, top: 0x11160d, platform: 0x90a85c, event: '#eaffb2' },
        width: 2900,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 260, y: 520 },
        door: { x: 2680, y: 510 },
        platforms: [
            { x: 420, y: 560, w: 340, h: 24 },
            { x: 880, y: 560, w: 180, h: 20, id: 'clock1' },
            { x: 1160, y: 520, w: 160, h: 20, id: 'clock2' },
            { x: 1450, y: 560, w: 180, h: 20, id: 'clock3' },
            { x: 1760, y: 520, w: 160, h: 20 },
            { x: 2060, y: 560, w: 180, h: 20, id: 'clock4' },
            { x: 2360, y: 520, w: 180, h: 20 },
            { x: 2660, y: 560, w: 220, h: 24 }
        ],
        events: { startClock: false, panicSpikes: false }
    };
})();

