const config = {
    type: Phaser.AUTO,
    title: 'TROLL BASE',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#171327',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scene: [MenuScene, Start],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

window.trollBaseGame = new Phaser.Game(config);
