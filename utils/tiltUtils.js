// utils/tiltUtils.js
// Smooth tilt → fighter movement only, no animations here

let tiltEnabled = false;
let tiltState = {
    scene: null,
    player: null,
    initialized: false,
    smoothedTilt: 0
};

export function enableTiltControls(scene, player) {
    tiltState.scene = scene;
    tiltState.player = player;

    if (tiltState.initialized) return;
    tiltState.initialized = true;

    window.addEventListener('deviceorientation', (event) => {
        if (!tiltEnabled) return;

        const p = tiltState.player;
        if (!p || !p.body) return;

        const isLandscape = window.innerWidth > window.innerHeight;
        const angle = screen.orientation?.angle ?? window.orientation ?? 0;
        const clockwise = angle === 90;

        let tilt = isLandscape ? event.beta : event.gamma;
        if (tilt == null) return;

        // Option 3 midpoint sensitivity
        const maxTilt = isLandscape ? 35 : 75;
        const dead = 8;
        const smoothing = 0.2;

        tilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));
        if (isLandscape && !clockwise) tilt = -tilt;

        tiltState.smoothedTilt += (tilt - tiltState.smoothedTilt)*smoothing;
        const sm = tiltState.smoothedTilt;

        const abs = Math.abs(sm);
        const onGround = p.body.blocked.down || p.body.touching.down;

        if (abs > dead) {
            if (sm > 0) p.moveRight();
            else p.moveLeft();
        } else {
            p.stopMoving();
        }
    });
}

export function setTiltEnabled(val) {
    tiltEnabled = !!val;
    if (!tiltEnabled && tiltState.player) {
        tiltState.player.stopMoving();
    }
}
