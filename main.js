// Select the canvas and get context
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // initial sizing

// An array to store all circles
let circles = [];

// A function to create a new circle object
function createCircle(x, y) {
  return {
    x: x,
    y: y,
    vx: (Math.random() * 4) - 2,   // random speed X between -2 and 2
    vy: (Math.random() * 4) - 2,   // random speed Y between -2 and 2
    radius: 20,
    color: randomColor(),
  };
}

// Generate a random color
function randomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

// Listen for clicks on the canvas
canvas.addEventListener('click', (event) => {
  // Get the mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Create a new circle at that position
  const newCircle = createCircle(mouseX, mouseY);
  circles.push(newCircle);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update and draw each circle
  for (let c of circles) {
    // Update position
    c.x += c.vx;
    c.y += c.vy;

    // Bounce off left/right edges
    if (c.x - c.radius < 0 || c.x + c.radius > canvas.width) {
      c.vx *= -1;
    }
    // Bounce off top/bottom edges
    if (c.y - c.radius < 0 || c.y + c.radius > canvas.height) {
      c.vy *= -1;
    }

    // Draw the circle
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
    ctx.fillStyle = c.color;
    ctx.fill();
  }
}

// Start the animation
animate();
