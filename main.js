document.addEventListener('DOMContentLoaded', () => {
  // DOM Element References
  const link1Element = document.getElementById('link1');
  const link2Element = document.getElementById('link2');
  const armBaseElement = document.getElementById('arm-base'); 
  const robotArmElement = document.getElementById('robot-arm');
  const cubeElements = [
    document.getElementById('cube1'),
    document.getElementById('cube2'),
    document.getElementById('cube3')
  ];

  // Arm Parameters
  const l1 = 240; 
  const l2 = 200; 
  const LINK_THICKNESS = 40; // From CSS height

  // Table and Cube Dimensions
  const TABLE_WIDTH = 300;
  const TABLE_HEIGHT = 150;
  const TABLE_TOP_HEIGHT = 30;
  const CUBE_SIZE = 30;

  // Global state variables
  let baseX, baseY; // Screen coordinates of arm's pivot point
  let tableScreenX, tableTopScreenY; // Screen coordinates of table
  let tableRect = { x: 0, y: 0, width: TABLE_WIDTH, height: TABLE_TOP_HEIGHT };
  let cubes = [];

  // Last known good angles for arm-table collision avoidance
  let lastGoodTheta1 = -Math.PI / 2; // Initial: pointing straight up
  let lastGoodTheta2_relative = 0;

  // Physics Constants
  const GRAVITY = 0.5;
  const FRICTION = 0.9; 
  const CUBE_BOUNCE = 0.3;
  const ARM_PUSH_FORCE = 2;
  const CUBE_COLLISION_EPSILON = 0.1; // For cube-cube collision distance check
  const POSITIONAL_CORRECTION_FACTOR = 0.3; // For cube-cube positional correction

  // --- Helper Functions ---
  function checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  function rotatePoint(point, angle, around) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const px = point.x - around.x;
    const py = point.y - around.y;
    const nx = px * c - py * s;
    const ny = px * s + py * c;
    return { x: nx + around.x, y: ny + around.y };
  }

  function getLinkCorners(linkAngle, linkLength, linkThickness, originPoint) {
    // Corners relative to the link's own origin (0,0) before rotation
    const corners = [
      { x: 0, y: -linkThickness / 2 },              // Top-left
      { x: linkLength, y: -linkThickness / 2 },      // Top-right
      { x: linkLength, y: linkThickness / 2 },       // Bottom-right
      { x: 0, y: linkThickness / 2 }                // Bottom-left
    ];
    // Rotate these corners around (0,0) and then translate by originPoint
    return corners.map(corner => {
      const rotated = rotatePoint(corner, linkAngle, {x:0, y:0});
      return { x: rotated.x + originPoint.x, y: rotated.y + originPoint.y };
    });
  }

  function isLinkCollidingWithTable(linkCorners, currentTableRect) {
    for (const corner of linkCorners) {
      // Check if corner is below table top AND within table's X bounds
      if (corner.y > currentTableRect.y && 
          corner.x > currentTableRect.x && 
          corner.x < currentTableRect.x + currentTableRect.width) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }


  function updateScreenCoordinatesAndLayout() {
    tableScreenX = (window.innerWidth - TABLE_WIDTH) / 2;
    const physicsContainer = document.getElementById('physics-elements-container');
    const containerRect = physicsContainer.getBoundingClientRect();
    tableTopScreenY = containerRect.top + (containerRect.height - TABLE_HEIGHT); 

    baseX = tableScreenX + TABLE_WIDTH / 2; // Arm pivot X (center of table)
    
    // New positioning for #robot-arm and baseY (IK pivot)
    // Position #robot-arm so the BOTTOM of armBaseElement sits on tableTopScreenY
    robotArmElement.style.left = `${baseX - (armBaseElement.offsetWidth / 2)}px`; // Stays the same
    robotArmElement.style.top = `${tableTopScreenY - armBaseElement.offsetHeight}px`;
    
    // Set baseY (IK pivot) to be the CENTER of armBaseElement
    baseY = tableTopScreenY - armBaseElement.offsetHeight / 2;
    
    tableRect.x = tableScreenX;
    tableRect.y = tableTopScreenY;

    cubes.forEach((cube, index) => {
      // Set initial positions directly on the cube object first
      cube.initialX = tableRect.x + tableRect.width / 2 - CUBE_SIZE / 2; 
      cube.initialY = tableRect.y - (index + 1) * CUBE_SIZE; // index 0 is the top cube
      
      cube.x = cube.initialX;
      cube.y = cube.initialY;
      
      cube.element.style.left = `${cube.x}px`;
      cube.element.style.top = `${cube.y}px`;
      cube.vx = 0; cube.vy = 0;
    });
  }
  
  // Initialize cube objects
  for (let i = 0; i < cubeElements.length; i++) {
    cubes.push({
      element: cubeElements[i],
      x: 0, y: 0, // These will be properly set by updateScreenCoordinatesAndLayout
      initialX: 0, initialY: 0, // Initialize properties
      width: CUBE_SIZE, height: CUBE_SIZE,
      vx: 0, vy: 0
    });
  }

  updateScreenCoordinatesAndLayout(); // This will now set initialX, initialY, x, y for all cubes

  function updateArmPosition(mouseX, mouseY) {
    const targetX = mouseX - baseX;
    const targetY = mouseY - baseY;
    const dist = Math.sqrt(targetX * targetX + targetY * targetY);

    let desiredTheta1, desiredTheta2_relative;
    const angleToMouse = Math.atan2(targetY, targetX);

    if (dist > l1 + l2) {
      desiredTheta1 = angleToMouse; desiredTheta2_relative = 0; 
    } else if (dist < Math.abs(l1 - l2)) {
      desiredTheta1 = angleToMouse; desiredTheta2_relative = 0; 
    } else {
      let cosGammaArg = (dist * dist + l1 * l1 - l2 * l2) / (2 * dist * l1);
      cosGammaArg = Math.max(-1, Math.min(1, cosGammaArg));
      let gamma = Math.acos(cosGammaArg);
      desiredTheta1 = angleToMouse - gamma;

      let cosDeltaArg = (l1 * l1 + l2 * l2 - dist * dist) / (2 * l1 * l2);
      cosDeltaArg = Math.max(-1, Math.min(1, cosDeltaArg));
      let delta = Math.acos(cosDeltaArg);
      desiredTheta2_relative = Math.PI - delta;
    }
    
    // Predictive Collision Check
    const link1Origin = { x: baseX, y: baseY };
    const predictedLink1Corners = getLinkCorners(desiredTheta1, l1, LINK_THICKNESS, link1Origin);
    
    const link1EndX = baseX + l1 * Math.cos(desiredTheta1);
    const link1EndY = baseY + l1 * Math.sin(desiredTheta1);
    const link2Origin = { x: link1EndX, y: link1EndY };
    const predictedLink2Corners = getLinkCorners(desiredTheta1 + desiredTheta2_relative, l2, LINK_THICKNESS, link2Origin);

    let collisionPredicted = false;
    if (isLinkCollidingWithTable(predictedLink1Corners, tableRect) || 
        isLinkCollidingWithTable(predictedLink2Corners, tableRect)) {
      collisionPredicted = true;
    }

    let finalTheta1, finalTheta2_relative;
    if (collisionPredicted) {
      finalTheta1 = lastGoodTheta1;
      finalTheta2_relative = lastGoodTheta2_relative;
    } else {
      finalTheta1 = desiredTheta1;
      finalTheta2_relative = desiredTheta2_relative;
      lastGoodTheta1 = finalTheta1;
      lastGoodTheta2_relative = finalTheta2_relative;
    }

    // Apply final angles to arm
    const finalTheta1Deg = finalTheta1 * (180 / Math.PI);
    link1Element.style.transform = `translateY(-50%) rotate(${finalTheta1Deg}deg)`;
    
    const endOfFinalLink1X = l1 * Math.cos(finalTheta1);
    const endOfFinalLink1Y = l1 * Math.sin(finalTheta1); 
    
    link2Element.style.left = `${endOfFinalLink1X}px`;
    link2Element.style.top = `calc(50% + ${endOfFinalLink1Y}px)`; 
    link2Element.style.transform = `translateY(-50%) rotate(${(finalTheta1 + finalTheta2_relative) * (180 / Math.PI)}deg)`;
  }

  // --- Physics Loop ---
  function updatePhysics() {
    // 1. Get arm link bounding boxes (after CSS transforms are applied)
    const link1Rect = link1Element.getBoundingClientRect();
    const link2Rect = link2Element.getBoundingClientRect();

    // Loop 1: Apply gravity, then handle Arm-Cube Collisions
    cubes.forEach(cube => {
      cube.vy += GRAVITY; // Apply gravity

      const cubeRect = { x: cube.x, y: cube.y, width: cube.width, height: cube.height };
      
      // Arm-Cube Collision (restored)
      if (checkRectCollision(link1Rect, cubeRect)) {
        let pushDirX = cubeRect.x + cubeRect.width/2 - (link1Rect.left + link1Rect.width/2);
        let pushDirY = cubeRect.y + cubeRect.height/2 - (link1Rect.top + link1Rect.height/2);
        let len = Math.sqrt(pushDirX*pushDirX + pushDirY*pushDirY);
        if (len > 0) { pushDirX /= len; pushDirY /= len; }
        cube.vx += pushDirX * ARM_PUSH_FORCE;
        cube.vy += pushDirY * ARM_PUSH_FORCE / 2; // Less vertical push
        cube.y -= 0.5; // Positional correction to reduce sinking
      }
      if (checkRectCollision(link2Rect, cubeRect)) {
        let pushDirX = cubeRect.x + cubeRect.width/2 - (link2Rect.left + link2Rect.width/2);
        let pushDirY = cubeRect.y + cubeRect.height/2 - (link2Rect.top + link2Rect.height/2);
        let len = Math.sqrt(pushDirX*pushDirX + pushDirY*pushDirY);
        if (len > 0) { pushDirX /= len; pushDirY /= len; }
        cube.vx += pushDirX * ARM_PUSH_FORCE;
        cube.vy += pushDirY * ARM_PUSH_FORCE / 2;
        cube.y -= 0.5; // Positional correction
      }
    });

    // Loop 2: Cube-Cube Collisions (restored)
    for (let i = 0; i < cubes.length; i++) {
      for (let j = i + 1; j < cubes.length; j++) {
        const cubeA = cubes[i]; const cubeB = cubes[j];
        // For cube-cube, we use their current physics positions (cubeA.x, cubeA.y)
        // not their rendered positions via getBoundingClientRect(),
        // as those might lag or be affected by non-physics transforms.
        const cubeARect = { x: cubeA.x, y: cubeA.y, width: cubeA.width, height: cubeA.height };
        const cubeBRect = { x: cubeB.x, y: cubeB.y, width: cubeB.width, height: cubeB.height };

        if (checkRectCollision(cubeARect, cubeBRect)) {
          let dx = (cubeA.x + cubeA.width/2) - (cubeB.x + cubeB.width/2);
          let dy = (cubeA.y + cubeA.height/2) - (cubeB.y + cubeB.height/2);
          let dist = Math.sqrt(dx*dx + dy*dy);

          let normalX, normalY;
          if (dist < CUBE_COLLISION_EPSILON) {
            // If cubes are too close or perfectly overlapped, assign a default normal
            // This prevents division by zero or very small numbers if dist is tiny.
            // A common strategy is to separate along a fixed axis or a random one.
            // We'll use a fixed axis (e.g., X-axis) or skip if truly problematic.
            // For simplicity, if dist is very small, we just use a default normal.
            // Or, if dx and dy are both zero, assign a default normal.
            normalX = 1; 
            normalY = 0;
            if (dx === 0 && dy === 0) { // If centers are identical
                // no clear direction, could skip or apply a default push
            } else if (dist < CUBE_COLLISION_EPSILON && dist > 0) { // If very close but not zero
                 normalX = dx / dist; // Still try to use direction if possible
                 normalY = dy / dist;
            }
            // If dist was truly 0 and became epsilon, dx/dist might still be an issue if dx was also 0.
            // Let's refine: if dist is near zero, but dx,dy give some direction, use it.
            // If dx,dy are also zero, then default.
            if (dist < CUBE_COLLISION_EPSILON) {
                if (dx === 0 && dy === 0) { // Truly overlapped
                    normalX = 1; normalY = 0; // Default separation axis
                    dist = CUBE_COLLISION_EPSILON; // Ensure dist is not zero for overlap calculation
                } else { // Very close, use calculated normal but ensure dist isn't too small for division
                    let actualDist = dist < 0.0001 ? 0.0001 : dist; // Guard against true zero for division
                    normalX = dx / actualDist;
                    normalY = dy / actualDist;
                }
            }

          } else {
            normalX = dx / dist;
            normalY = dy / dist;
          }
          
          let relativeVelocityX = cubeA.vx - cubeB.vx;
          let relativeVelocityY = cubeA.vy - cubeB.vy;
          let speed = relativeVelocityX * normalX + relativeVelocityY * normalY;

          if (speed < 0) { // Cubes are moving towards each other
            let impulse = speed; 
            cubeA.vx -= impulse * normalX; cubeA.vy -= impulse * normalY;
            cubeB.vx += impulse * normalX; cubeB.vy += impulse * normalY;
          }
          
          // Positional Correction
          // Note: CUBE_SIZE is diameter. Collision occurs when dist < CUBE_SIZE.
          let overlap = CUBE_SIZE - dist; 
          if (overlap > 0.01) { // Only correct if overlap is significant
            // Apply a fraction of the overlap for smoother correction
            let correctionStep = (overlap * POSITIONAL_CORRECTION_FACTOR) / 2.0;
            
            cubeA.x += correctionStep * normalX; 
            cubeA.y += correctionStep * normalY;
            cubeB.x -= correctionStep * normalX; 
            cubeB.y -= correctionStep * normalY;
          }
        }
      }
    }

    // Loop 3: Update Positions, Table Collision, Render
    cubes.forEach(cube => {
      cube.x += cube.vx; 
      cube.y += cube.vy;

      // Apply basic friction (damping) to horizontal movement
      cube.vx *= FRICTION; 
      if (Math.abs(cube.vx) < 0.1) cube.vx = 0;

      // Cube-Table Collision
      if (cube.y + cube.height > tableRect.y &&
          cube.x + cube.width > tableRect.x &&
          cube.x < tableRect.x + tableRect.width) {
        
        if (cube.vy > 0) { // Only apply collision if moving downwards
            cube.y = tableRect.y - cube.height;
            cube.vy *= -CUBE_BOUNCE; // Bounce
            if (Math.abs(cube.vy) < 1) cube.vy = 0; // Rest threshold
            
            // Apply friction when on table
            if (cube.vy === 0) { 
                cube.vx *= FRICTION;
                if (Math.abs(cube.vx) < 0.1) cube.vx = 0;
            }
        }
      }

      // Reset cube if it falls off the bottom of the screen
      if (cube.y + cube.height > window.innerHeight + CUBE_SIZE) { // Give a little buffer
        cube.x = cube.initialX;
        cube.y = cube.initialY;
        cube.vx = 0;
        cube.vy = 0;
      }
      
      // Render Cube Position
      cube.element.style.left = `${cube.x}px`;
      cube.element.style.top = `${cube.y}px`;
    });

    requestAnimationFrame(updatePhysics);
  }

  // Event Listeners
  window.addEventListener('mousemove', (event) => {
    updateArmPosition(event.clientX, event.clientY);
  });

  window.addEventListener('resize', () => {
    updateScreenCoordinatesAndLayout();
    // Reset arm to a safe, non-colliding position on resize
    lastGoodTheta1 = -Math.PI / 2; // Pointing up
    lastGoodTheta2_relative = 0;
    updateArmPosition(baseX, baseY - (l1 + l2)); // Target point up
  });

  // Initial Setup
  // Initialize last good angles based on initial arm position
  // Initial arm position is pointing up, so theta1 = -PI/2, theta2_relative = 0
  lastGoodTheta1 = -Math.PI / 2;
  lastGoodTheta2_relative = 0;
  updateArmPosition(baseX, baseY - (l1 + l2)); // Target point up
  
  requestAnimationFrame(updatePhysics);
});
