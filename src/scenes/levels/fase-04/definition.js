(function () {
    window.TrollBaseLevel04 = {
        name: 'Fase 4 - Troca',
        colors: { bg: 0x162013, top: 0x0f160d, platform: 0x6f9a52, event: '#d7ff9a' },
        width: 2200,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 260, y: 520 },
        door: { x: 1980, y: 510 },
        platforms: [
            { x: 430, y: 560, w: 340, h: 24 },
            { x: 910, y: 560, w: 340, h: 24 },
            { x: 1390, y: 560, w: 340, h: 24 },
            { x: 1880, y: 560, w: 260, h: 24 },
            { x: 1150, y: 500, w: 130, h: 16, id: 'swapStep' }
        ],
        events: { swapDoorPlayer: false, fakeDoor: false, collapseLate: false }
    };
})();

