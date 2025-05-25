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
    baseY = tableTopScreenY;                // Arm pivot Y (surface of table top)

    robotArmElement.style.left = `${baseX - (armBaseElement.offsetWidth / 2)}px`;
    robotArmElement.style.top = `${baseY - (armBaseElement.offsetHeight / 2)}px`;
    
    tableRect.x = tableScreenX;
    tableRect.y = tableTopScreenY;

    cubes.forEach((cube, index) => {
      cube.x = tableRect.x + tableRect.width / 2 - CUBE_SIZE / 2; 
      cube.y = tableRect.y - (index + 1) * CUBE_SIZE; 
      cube.element.style.left = `${cube.x}px`;
      cube.element.style.top = `${cube.y}px`;
      cube.vx = 0; cube.vy = 0;
    });
  }
  
  for (let i = 0; i < cubeElements.length; i++) {
    cubes.push({
      element: cubeElements[i],
      x: 0, y: 0, width: CUBE_SIZE, height: CUBE_SIZE,
      vx: 0, vy: 0
    });
  }

  updateScreenCoordinatesAndLayout();

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
    const link1Rect = link1Element.getBoundingClientRect();
    const link2Rect = link2Element.getBoundingClientRect();

    cubes.forEach(cube => {
      cube.vy += GRAVITY;
      const cubeRect = { x: cube.x, y: cube.y, width: cube.width, height: cube.height };
      if (checkRectCollision(link1Rect, cubeRect)) {
        let pushDirX = cubeRect.x + cubeRect.width/2 - (link1Rect.left + link1Rect.width/2);
        let pushDirY = cubeRect.y + cubeRect.height/2 - (link1Rect.top + link1Rect.height/2);
        let len = Math.sqrt(pushDirX*pushDirX + pushDirY*pushDirY);
        if (len > 0) { pushDirX /= len; pushDirY /= len; }
        cube.vx += pushDirX * ARM_PUSH_FORCE;
        cube.vy += pushDirY * ARM_PUSH_FORCE / 2; 
        cube.y -= 0.5; 
      }
      if (checkRectCollision(link2Rect, cubeRect)) {
        let pushDirX = cubeRect.x + cubeRect.width/2 - (link2Rect.left + link2Rect.width/2);
        let pushDirY = cubeRect.y + cubeRect.height/2 - (link2Rect.top + link2Rect.height/2);
        let len = Math.sqrt(pushDirX*pushDirX + pushDirY*pushDirY);
        if (len > 0) { pushDirX /= len; pushDirY /= len; }
        cube.vx += pushDirX * ARM_PUSH_FORCE;
        cube.vy += pushDirY * ARM_PUSH_FORCE / 2;
        cube.y -= 0.5; 
      }
    });

    for (let i = 0; i < cubes.length; i++) {
      for (let j = i + 1; j < cubes.length; j++) {
        const cubeA = cubes[i]; const cubeB = cubes[j];
        const cubeARect = { x: cubeA.x, y: cubeA.y, width: cubeA.width, height: cubeA.height };
        const cubeBRect = { x: cubeB.x, y: cubeB.y, width: cubeB.width, height: cubeB.height };
        if (checkRectCollision(cubeARect, cubeBRect)) {
          let dx = (cubeA.x + cubeA.width/2) - (cubeB.x + cubeB.width/2);
          let dy = (cubeA.y + cubeA.height/2) - (cubeB.y + cubeB.height/2);
          let dist = Math.sqrt(dx*dx + dy*dy);
          if (dist === 0) dist = 0.001; 
          let normalX = dx / dist; let normalY = dy / dist;
          let relativeVelocityX = cubeA.vx - cubeB.vx;
          let relativeVelocityY = cubeA.vy - cubeB.vy;
          let speed = relativeVelocityX * normalX + relativeVelocityY * normalY;
          if (speed < 0) { // Cubes are moving towards each other
            // For equal mass objects, the collision response simplifies:
            // they effectively swap momentum components along the collision normal.
            // impulse = speed (derived from the 1D elastic collision formula for equal masses)
            let impulse = speed; 
            cubeA.vx -= impulse * normalX; cubeA.vy -= impulse * normalY;
            cubeB.vx += impulse * normalX; cubeB.vy += impulse * normalY;
          }
          let overlap = CUBE_SIZE - dist; 
          if (overlap > 0.01) {
            let correctionX = (overlap / 2) * normalX; let correctionY = (overlap / 2) * normalY;
            cubeA.x += correctionX; cubeA.y += correctionY;
            cubeB.x -= correctionX; cubeB.y -= correctionY;
          }
        }
      }
    }

    cubes.forEach(cube => {
      cube.x += cube.vx; cube.y += cube.vy;
      cube.vx *= FRICTION; 
      if (Math.abs(cube.vx) < 0.1) cube.vx = 0;
      if (cube.y + cube.height > tableRect.y &&
          cube.x + cube.width > tableRect.x &&
          cube.x < tableRect.x + tableRect.width) {
        if (cube.vy > 0) {
            cube.y = tableRect.y - cube.height;
            cube.vy *= -CUBE_BOUNCE;
            if (Math.abs(cube.vy) < 1) cube.vy = 0;
            cube.vx *= FRICTION;
            if (Math.abs(cube.vx) < 0.1) cube.vx = 0;
        }
      }
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
