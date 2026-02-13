(function () {
    window.TrollBaseLevel08 = {
        name: 'Fase 8 - Elevador Troll',
        colors: { bg: 0x1f1616, top: 0x170f0f, platform: 0xa3746a, event: '#ffd2c5' },
        width: 3000,
        gravity: 1200,
        alwaysMirror: false,
        start: { x: 260, y: 520 },
        door: { x: 2780, y: 510 },
        platforms: [
            { x: 420, y: 560, w: 320, h: 24 },
            { x: 920, y: 560, w: 220, h: 22, id: 'liftA' },
            { x: 1260, y: 520, w: 180, h: 20 },
            { x: 1560, y: 560, w: 220, h: 22, id: 'liftB' },
            { x: 1880, y: 500, w: 180, h: 20 },
            { x: 2200, y: 560, w: 220, h: 22, id: 'liftC' },
            { x: 2520, y: 520, w: 180, h: 20 },
            { x: 2780, y: 560, w: 220, h: 24 }
        ],
        events: { firstLift: false, secondLift: false, ceilingTrap: false }
    };
})();

