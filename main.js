// main.js

// 1. Select or create DOM elements
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

// 2. Handle resizing the canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // run once on load

// 3. Define variables for your animation
let x = 50, y = 50;    // position
let vx = 2, vy = 2;    // velocity
let radius = 25;       // circle radius

// 4. Animation loop using requestAnimationFrame
function animate() {
  requestAnimationFrame(animate);

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update position
  x += vx;
  y += vy;
  // Bounce off edges
  if (x + radius > canvas.width || x - radius < 0) vx *= -1;
  if (y + radius > canvas.height || y - radius < 0) vy *= -1;

  // Draw something (e.g., a circle)
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'crimson';
  ctx.fill();
}

// 5. Start the animation
animate();
