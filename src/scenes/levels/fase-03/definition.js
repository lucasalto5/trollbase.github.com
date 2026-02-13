(function () {
    window.TrollBaseLevel03 = {
        name: 'Fase 3 - Gravidade',
        colors: { bg: 0x171325, top: 0x100d18, platform: 0x7b61a8, event: '#f0c5ff' },
        width: 2200,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 260, y: 520 },
        door: { x: 1990, y: 160 },
        platforms: [
            { x: 430, y: 560, w: 340, h: 24 },
            { x: 910, y: 560, w: 340, h: 24 },
            { x: 1390, y: 560, w: 340, h: 24 },
            { x: 1840, y: 560, w: 280, h: 24 },
            { x: 1840, y: 120, w: 300, h: 24, id: 'ceilingGoal' },
            { x: 1450, y: 170, w: 160, h: 16 },
            { x: 1220, y: 210, w: 160, h: 16 }
        ],
        events: { gravityFlip: false, gravityBack: false, skySpikes: false }
    };
})();

