// Select the canvas and get context
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit the .fun section
function resizeCanvas() {
    const funSection = document.querySelector('.fun');
    canvas.width = funSection.offsetWidth;
    canvas.height = funSection.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial sizing

// An array to store all circles
let circles = [];
let growingCircle = null; // Track the circle being grown

// A function to create a new circle object
function createCircle(x, y) {
    return {
        x: x,
        y: y,
        vx: 0, // No horizontal speed initially
        vy: 0, // No vertical speed initially
        radius: 10, // Initial radius
        color: randomColor(),
        growing: true, // Indicates it's currently growing
    };
}

// Generate a random color
function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

// Handle mouse down to start growing a circle
canvas.addEventListener('mousedown', (event) => {
    if (!growingCircle) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        growingCircle = createCircle(mouseX, mouseY);
        circles.push(growingCircle);
    }
});

// Handle mouse up to stop growing the circle
canvas.addEventListener('mouseup', () => {
    if (growingCircle) {
        growingCircle.growing = false; // Stop growing
        growingCircle = null;
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw each circle
    for (let c of circles) {
        if (c.growing) {
            c.radius += 0.5; // Increase radius while growing
        } else {
            c.vy += 0.1; // Apply gravity
            c.x += c.vx;
            c.y += c.vy;

            // Bounce off the bottom edge
            if (c.y + c.radius > canvas.height) {
                c.y = canvas.height - c.radius;
                c.vy *= -0.7; // Reduce speed and reverse direction
            }
        }

        // Draw the circle
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
        ctx.fillStyle = c.color;
        ctx.fill();
    }
}

animate();
