(function () {
    window.TrollBaseLevel05 = {
        name: 'Fase 5 - Devil Mix',
        colors: { bg: 0x221512, top: 0x1a0f0d, platform: 0xa56a52, event: '#ffca9f' },
        width: 2500,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 280, y: 520 },
        door: { x: 2280, y: 510 },
        platforms: [
            { x: 460, y: 560, w: 360, h: 24 },
            { x: 960, y: 560, w: 360, h: 24 },
            { x: 1460, y: 560, w: 360, h: 24 },
            { x: 1960, y: 560, w: 360, h: 24 },
            { x: 2280, y: 560, w: 220, h: 24 },
            { x: 1730, y: 500, w: 130, h: 16, id: 'finalBridge' }
        ],
        events: { spikeRain: false, doorRun: false, finalCollapse: false, controlsTroll: false }
    };
})();

