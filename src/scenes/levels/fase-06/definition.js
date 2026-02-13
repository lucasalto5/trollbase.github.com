(function () {
    window.TrollBaseLevel06 = {
        name: 'Fase 6 - Sem Chao',
        colors: { bg: 0x111b20, top: 0x0b1216, platform: 0x5d8fa0, event: '#bcecff' },
        width: 2800,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 280, y: 510 },
        door: { x: 2580, y: 470 },
        platforms: [
            { x: 320, y: 560, w: 170, h: 22 },
            { x: 590, y: 540, w: 120, h: 20 },
            { x: 830, y: 510, w: 120, h: 20 },
            { x: 1060, y: 540, w: 120, h: 20, id: 'fragileA' },
            { x: 1320, y: 500, w: 140, h: 20 },
            { x: 1600, y: 540, w: 120, h: 20 },
            { x: 1840, y: 500, w: 120, h: 20 },
            { x: 2120, y: 540, w: 130, h: 20 },
            { x: 2380, y: 500, w: 140, h: 20 },
            { x: 2580, y: 520, w: 180, h: 20 }
        ],
        events: { crumbleA: false, spikeLane: false, fakeEndDoor: false }
    };
})();
