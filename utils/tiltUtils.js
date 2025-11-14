// utils/tiltUtils.js
// ORIGINAL aggressive tilt control + NEW animation mapping

export function enableTiltControls(scene, player) {
    let smoothedTilt = 0;
    const smoothing = 0.2;

    window.addEventListener("deviceorientation", (event) => {
        let tilt;

        const isLandscape = window.innerWidth > window.innerHeight;
        const clockwise = screen.orientation.angle === 90;

        tilt = isLandscape ? event.beta : event.gamma;
        if (tilt == null) return;

        const maxTilt = isLandscape ? 20 : 90;
        const deadZone = 6;
        const baseVelocity = 320;
        const velocityMultiplier = isLandscape ? 1 : 1.75;

        tilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));
        if (isLandscape && !clockwise) tilt = -tilt;

        smoothedTilt += (tilt - smoothedTilt) * smoothing;

        const abs = Math.abs(smoothedTilt);
        const velocity = ((abs - deadZone) / (maxTilt - deadZone)) * (baseVelocity * velocityMultiplier);

        if (abs > deadZone) {
            if (smoothedTilt > 0) {
                player.setVelocityX(velocity);
                player.setFlipX(false);
                playWalk(player);
            } else {
                player.setVelocityX(-velocity);
                player.setFlipX(true);
                playWalk(player);
            }
        } else {
            player.setVelocityX(0);
            playIdle(player);
        }
    });
}

// Animation mapping
function playIdle(player) {
    const key = player.texture.key;
    if (key.startsWith("turbo")) player.play("turboStanding", true);
    else if (key.startsWith("rere")) player.play("rereIdle", true);
}

function playWalk(player) {
    const key = player.texture.key;
    if (key.startsWith("turbo")) player.play("turboWalk", true);
    else if (key.startsWith("rere")) player.play("rereWalk", true);
}
