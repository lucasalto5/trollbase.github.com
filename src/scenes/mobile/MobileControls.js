class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.state = {
            left: false,
            right: false,
            jumpQueued: false,
            restartQueued: false,
            menuQueued: false
        };
        this.elements = [];
        this.enabled = this.detectEnabled();
    }

    detectEnabled() {
        const device = this.scene && this.scene.sys && this.scene.sys.game
            ? this.scene.sys.game.device
            : null;
        const hasTouch = !!(device && device.input && device.input.touch);
        const isDesktop = !!(device && device.os && device.os.desktop);
        const coarsePointer = typeof window.matchMedia === 'function'
            ? window.matchMedia('(pointer: coarse)').matches
            : false;
        return hasTouch && (!isDesktop || coarsePointer);
    }

    initializeInput() {
        if (!this.enabled) {
            return;
        }
        this.scene.input.addPointer(2);
    }

    consume(flagName) {
        if (!this.state[flagName]) {
            return false;
        }
        this.state[flagName] = false;
        return true;
    }

    createUi(gameWidth, gameHeight) {
        if (!this.enabled) {
            return;
        }

        const bottomY = gameHeight - 86;
        const left = this.createButton(
            102,
            bottomY,
            54,
            0x5373c7,
            '<',
            () => { this.state.left = true; },
            () => { this.state.left = false; }
        );
        const right = this.createButton(
            228,
            bottomY,
            54,
            0x5373c7,
            '>',
            () => { this.state.right = true; },
            () => { this.state.right = false; }
        );
        const jump = this.createButton(
            gameWidth - 112,
            bottomY - 10,
            62,
            0x56b977,
            '^',
            () => { this.state.jumpQueued = true; },
            null
        );
        const restart = this.createButton(
            gameWidth - 200,
            74,
            30,
            0xbf6e2c,
            'R',
            () => { this.state.restartQueued = true; },
            null
        );
        const menu = this.createButton(
            gameWidth - 120,
            74,
            30,
            0xa74aa5,
            'M',
            () => { this.state.menuQueued = true; },
            null
        );

        this.elements.push(left, right, jump, restart, menu);
    }

    createButton(x, y, radius, fillColor, label, onPress, onRelease) {
        const button = this.scene.add.circle(x, y, radius, fillColor, 0.32)
            .setStrokeStyle(3, 0xffffff, 0.5)
            .setScrollFactor(0)
            .setDepth(300)
            .setInteractive();

        const text = this.scene.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: `${Math.floor(radius * 0.7)}px`,
            color: '#ffffff',
            stroke: '#0b1020',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        const press = () => {
            button.setFillStyle(fillColor, 0.56);
            if (typeof onPress === 'function') {
                onPress();
            }
        };
        const release = () => {
            button.setFillStyle(fillColor, 0.32);
            if (typeof onRelease === 'function') {
                onRelease();
            }
        };

        button.on('pointerdown', press);
        button.on('pointerup', release);
        button.on('pointerout', release);
        button.on('pointerupoutside', release);

        return { button, text };
    }
}

window.MobileControls = MobileControls;
