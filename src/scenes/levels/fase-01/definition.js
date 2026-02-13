(function () {
    window.TrollBaseLevel01 = {
        name: 'Fase 1 - Base',
        colors: { bg: 0x13131a, top: 0x0d0d12, platform: 0x4b5f88, event: '#ffd36f' },
        width: 1800,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 220, y: 520 },
        door: { x: 1600, y: 510 },
        platforms: [
            { x: 360, y: 560, w: 440, h: 34 },
            { x: 760, y: 560, w: 300, h: 24 },
            { x: 1160, y: 560, w: 300, h: 24 },
            { x: 1560, y: 560, w: 220, h: 24 },
            { x: 930, y: 500, w: 130, h: 16, id: 'trapStep' }
        ],
        events: { popSpike: false, vanishStep: false, teleportDoor: false }
    };
})();
