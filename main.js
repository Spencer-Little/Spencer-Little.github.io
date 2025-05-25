document.addEventListener('DOMContentLoaded', () => {
  const link1 = document.getElementById('link1');
  const link2 = document.getElementById('link2');
  const armBase = document.getElementById('arm-base'); // Referenced as per task

  const l1 = 120; // Length of link1, matches CSS
  const l2 = 100; // Length of link2, matches CSS

  let baseX = 0; // Arm base is at the left edge of the screen due to #robot-arm fixed left:0
  let baseY = window.innerHeight / 2; // Arm base is vertically centered

  function updateArmPosition(mouseX, mouseY) {
    const targetX = mouseX - baseX;
    const targetY = mouseY - baseY;
    const dist = Math.sqrt(targetX * targetX + targetY * targetY);

    let theta1, theta2;

    // Angle of the mouse relative to the base
    const angleToMouse = Math.atan2(targetY, targetX);

    if (dist > l1 + l2) {
      // Target is too far, straighten arm towards mouse
      theta1 = angleToMouse;
      theta2 = 0; // Link2 is straight relative to Link1
    } else if (dist < Math.abs(l1 - l2)) {
      // Target is too close, straighten arm towards mouse (or other configuration)
      // For simplicity, also point towards mouse. Could also "fold" by setting theta2 to PI.
      theta1 = angleToMouse;
      theta2 = 0; 
    } else {
      // Target is reachable, calculate angles using Inverse Kinematics
      let cosGammaArg = (dist * dist + l1 * l1 - l2 * l2) / (2 * dist * l1);
      cosGammaArg = Math.max(-1, Math.min(1, cosGammaArg)); // Clamp to avoid acos domain errors
      let gamma = Math.acos(cosGammaArg);

      theta1 = angleToMouse - gamma; // Elbow "up" or "right" configuration

      let cosDeltaArg = (l1 * l1 + l2 * l2 - dist * dist) / (2 * l1 * l2);
      cosDeltaArg = Math.max(-1, Math.min(1, cosDeltaArg)); // Clamp
      let delta = Math.acos(cosDeltaArg);

      theta2 = Math.PI - delta; // Angle of link2 relative to link1 (makes elbow bend "outward")
    }

    const theta1Deg = theta1 * (180 / Math.PI);
    // const theta2Deg = theta2 * (180 / Math.PI); // Not directly used for link2's final rotation if world angle is used

    // Position link2 at the end of link1. 
    // Its 'left' in CSS is relative to #robot-arm.
    // Its transform-origin is 'left center'.
    // The rotation theta2Deg is relative to link1's orientation.
    // This requires link2's coordinate system to be established correctly.
    // The CSS for link2 has `left: 120px;`, which means its origin IS at the end of link1 if link1 has 0 rotation.
    // So, the rotation `theta2Deg` should be its world angle, not relative.
    // Let's adjust the logic for theta2. theta2 is the angle of Link2 relative to Link1.
    // So, the world angle for link2 is theta1 + theta2.

    // const link2WorldAngleDeg = (theta1 + theta2) * (180 / Math.PI); // Calculated later directly in transform

    // To make link2 correctly attach and rotate:
    // 1. Position link2's origin (its left center) at the end of link1.
    //    The end of link1 is at (l1 * cos(theta1), l1 * sin(theta1)) relative to the base of link1.
    //    Since link1 and link2 are siblings, and #robot-arm is their container:
    //    link1's base is (0, baseY_of_robot_arm_container) which is (0, 50% of container height).
    //    link2's `left` and `top` are relative to #robot-arm.
    //    The `translateY(-50%)` in transform centers them vertically around their own horizontal axis.
    
    // Apply transform to link1
    link1.style.transform = `translateY(-50%) rotate(${theta1Deg}deg)`;
    
    // Calculate the end position of link1
    const endOfLink1X = l1 * Math.cos(theta1);
    const endOfLink1Y = l1 * Math.sin(theta1); // This is relative to link1's pivot's y-axis

    // Position link2's pivot point (left edge) at the end of link1
    // link2's `left` is relative to #robot-arm.
    // link2's `top` is also relative to #robot-arm (which is 50% of viewport height).
    // The initial `top: 50%` on link2 refers to 50% of #robot-arm's height.
    // The `translateY(-50%)` on link2 then centers it on its own horizontal axis.
    // So, we need to adjust link2's `top` style to account for endOfLink1Y.
    link2.style.left = `${endOfLink1X}px`;
    link2.style.top = `calc(50% + ${endOfLink1Y}px)`; // 50% is its own vertical center, then offset by link1's end Y.

    // The rotation for link2 is its angle relative to link1, because its position is now set
    // as if it's a child of link1. Its transform-origin is 'left center'.
    // No, this is not correct. `theta2` from `Math.PI - delta` IS the angle relative to link1.
    // The transform `rotate` on link2 will be its own world angle.
    // The world angle of link2 is theta1 (angle of link1) + theta2 (relative angle of link2 to link1).
    link2.style.transform = `translateY(-50%) rotate(${(theta1 + theta2) * (180 / Math.PI)}deg)`;

  }

  window.addEventListener('mousemove', (event) => {
    updateArmPosition(event.clientX, event.clientY);
  });

  window.addEventListener('resize', () => {
    baseY = window.innerHeight / 2;
    // Optionally, re-calculate arm position based on current mouse or a default
    // For now, it will just update baseY for the next mousemove.
  });

  // Initial position: Arm pointing straight right
  // Target a point exactly at the maximum reach along the x-axis.
  updateArmPosition(baseX + l1 + l2, baseY); 

  // Alternative initial position (explicit angles)
  // link1.style.transform = 'translateY(-50%) rotate(0deg)';
  // link2.style.left = `${l1}px`; // Position at end of link1
  // link2.style.top = '50%'; // Vertically centered with link1
  // link2.style.transform = 'translateY(-50%) rotate(0deg)'; // Link2 straight relative to link1

});
