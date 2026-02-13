(function () {
    window.TrollBaseLevel09 = {
        name: 'Fase 9 - Eco',
        colors: { bg: 0x141927, top: 0x0f121c, platform: 0x6070b1, event: '#ccd3ff' },
        width: 3100,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 260, y: 520 },
        door: { x: 2880, y: 510 },
        platforms: [
            { x: 420, y: 560, w: 320, h: 24 },
            { x: 900, y: 560, w: 260, h: 22 },
            { x: 1280, y: 520, w: 160, h: 18 },
            { x: 1540, y: 560, w: 260, h: 22 },
            { x: 1900, y: 520, w: 180, h: 18, id: 'echoStep' },
            { x: 2200, y: 560, w: 260, h: 22 },
            { x: 2540, y: 520, w: 170, h: 18 },
            { x: 2860, y: 560, w: 220, h: 24 }
        ],
        events: { echoSpike: false, echoMirror: false, echoCollapse: false }
    };
})();

