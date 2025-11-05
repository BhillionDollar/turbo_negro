export function enableTiltControls(scene, player) {
    let smoothedTilt = 0; // Smoothed tilt value for stabilization
    const smoothingFactor = 0.2; // Adjust for tilt responsiveness (higher is slower smoothing)

    window.addEventListener('deviceorientation', (event) => {
        let tilt;
        const isLandscape = window.innerWidth > window.innerHeight; // Check if device is in landscape mode
        const isClockwise = screen.orientation.angle === 90;


        // Use gamma for portrait and beta for landscape
        tilt = isLandscape ? event.beta : event.gamma;

        if (tilt !== null) {
            const maxTilt = isLandscape ? 20 : 90; // Normalize tilt ranges: beta (landscape) vs gamma (portrait)
            const deadZone = 6; // Dead zone for movement initiation
            const baseVelocity = 320; 
            const velocityMultiplier = isLandscape ? 1 : 1.75; // Increase speed in portrait mode
            const adjustedVelocity = baseVelocity * velocityMultiplier; // Adjust velocity based on orientation

            // Clamp tilt values to ensure responsiveness within the defined range
            tilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));

            // Reverse tilt for counterclockwise landscape mode
            if (isLandscape && !isClockwise) {
                tilt = -tilt;
            }

            // Apply smoothing to the tilt value
            smoothedTilt += (tilt - smoothedTilt) * smoothingFactor;

            // Handle movement logic based on smoothed tilt
            if (smoothedTilt > deadZone) {
                // Move right
                player.setVelocityX((smoothedTilt - deadZone) / (maxTilt - deadZone) * adjustedVelocity);
                player.setFlipX(false);

                // Trigger animation only if it has changed
                if (player.anims.currentAnim?.key !== 'walk') {
                    player.play('walk', true);
                }
            } else if (smoothedTilt < -deadZone) {
                // Move left
                player.setVelocityX((smoothedTilt + deadZone) / (maxTilt - deadZone) * adjustedVelocity);
                player.setFlipX(true);

                // Trigger animation only if it has changed
                if (player.anims.currentAnim?.key !== 'walk') {
                    player.play('walk', true);
                }
            } else {
                // Stay idle if tilt is within the dead zone
                player.setVelocityX(0);

                // Trigger animation only if it has changed
                if (player.anims.currentAnim?.key !== 'idle') {
                    player.play('idle', true);
                }
            }
        }
    });
}
