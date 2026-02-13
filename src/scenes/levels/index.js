(function () {
    function cloneLevel(level) {
        return {
            ...level,
            colors: { ...level.colors },
            start: { ...level.start },
            door: { ...level.door },
            platforms: level.platforms.map((p) => ({ ...p })),
            events: { ...level.events }
        };
    }

    window.getTrollBaseLevels = function getTrollBaseLevels() {
        const levels = [
            window.TrollBaseLevel01,
            window.TrollBaseLevel02,
            window.TrollBaseLevel03,
            window.TrollBaseLevel04,
            window.TrollBaseLevel05,
            window.TrollBaseLevel06,
            window.TrollBaseLevel07,
            window.TrollBaseLevel08,
            window.TrollBaseLevel09,
            window.TrollBaseLevel10
        ];
        return levels.filter(Boolean).map(cloneLevel);
    };
})();
