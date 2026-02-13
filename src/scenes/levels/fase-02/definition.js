(function () {
    window.TrollBaseLevel02 = {
        name: 'Fase 2 - Espelho',
        colors: { bg: 0x111823, top: 0x0a111a, platform: 0x4c7a99, event: '#9fe5ff' },
        width: 2000,
        gravity: 1200,
        alwaysMirror: true,
        start: { x: 240, y: 520 },
        door: { x: 1800, y: 510 },
        platforms: [
            { x: 390, y: 560, w: 330, h: 24 },
            { x: 840, y: 560, w: 330, h: 24 },
            { x: 1290, y: 560, w: 330, h: 24 },
            { x: 1780, y: 560, w: 220, h: 24 },
            { x: 1080, y: 500, w: 130, h: 16, id: 'fakeFloor' }
        ],
        events: { dropFloor: false, wallSpike: false, mirrorBlink: false }
    };
})();

