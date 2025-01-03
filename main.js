const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit its container
function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Ball object with Verlet properties
class Ball {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.radius = radius;
        this.color = randomColor();
        this.ax = 0; // Acceleration in X
        this.ay = 0.1; // Gravity (constant downward acceleration)
        this.growing = true; // Indicates growth during mouse hold
    }

    update() {
        if (this.growing && this.radius < 50) {
            this.radius += 0.5; // Growth rate
        } else {
            this.growing = false;
            // Verlet Integration
            const vx = this.x - this.oldX;
            const vy = this.y - this.oldY;

            this.oldX = this.x;
            this.oldY = this.y;

            this.x += vx + this.ax;
            this.y += vy + this.ay;

            // Reset acceleration after update
            this.ax = 0;
            this.ay = 0.1;
        }
    }

    resolveBoundaries() {
        // Horizontal boundaries
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.oldX = this.x; // Stop horizontal movement
        } else if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.oldX = this.x; // Stop horizontal movement
        }

        // Elastic ground
        if (this.y + this.radius > canvas.height) {
            const penetration = this.y + this.radius - canvas.height; // Compression into the ground
            const springConstant = 0.5; // Adjust spring strength
            const dampingFactor = 0.7; // Adjust damping to reduce energy loss

            const restoringForce = -springConstant * penetration; // Hooke's law
            const vy = this.y - this.oldY; // Calculate vertical velocity

            this.y = canvas.height - this.radius; // Reset ball above the ground
            this.oldY = this.y + vy * dampingFactor + restoringForce; // Apply restoring force and damping
        }

        // Top boundary
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            const vy = this.y - this.oldY;
            this.oldY = this.y + vy * -0.8; // Reverse and dampen vertical velocity
        }
    }

    draw() {
        // Draw the ball
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// Generate random color
function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

// Check and resolve collisions between two balls
function resolveCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ball1.radius + ball2.radius) {
        // Overlap resolution
        const overlap = ball1.radius + ball2.radius - dist;
        const correctionFactor = 0.5; // Split the correction equally between the two balls
        const nx = dx / dist; // Normalized direction vector
        const ny = dy / dist;

        // Adjust positions to resolve overlap
        ball1.x -= nx * overlap * correctionFactor;
        ball1.y -= ny * overlap * correctionFactor;
        ball2.x += nx * overlap * correctionFactor;
        ball2.y += ny * overlap * correctionFactor;

        // Calculate masses proportional to radii
        const mass1 = ball1.radius;
        const mass2 = ball2.radius;

        // Relative velocity
        const vx = ball2.x - ball2.oldX - (ball1.x - ball1.oldX);
        const vy = ball2.y - ball2.oldY - (ball1.y - ball1.oldY);

        // Relative velocity along the normal
        const dotProduct = vx * nx + vy * ny;

        // Do not resolve if velocities are separating
        if (dotProduct > 0) return;

        // Impulse scalar
        const impulse = (2 * dotProduct) / (mass1 + mass2);

        // Apply impulse to each ball
        ball1.oldX -= (impulse * mass2 * nx);
        ball1.oldY -= (impulse * mass2 * ny);
        ball2.oldX += (impulse * mass1 * nx);
        ball2.oldY += (impulse * mass1 * ny);
    }
}


// Ball list and current growing ball
const balls = [];
let growingBall = null;

// Start growing a new ball on mouse down
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (!growingBall) {
        growingBall = new Ball(mouseX, mouseY, 10); // Initial small radius
        balls.push(growingBall);
    }
});

// Stop growing the ball on mouse up
canvas.addEventListener('mouseup', () => {
    if (growingBall) {
        growingBall.growing = false; // Stop growth
        growingBall = null;
    }
});

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < balls.length; i++) {
        balls[i].update();
        balls[i].resolveBoundaries();

        // Check collisions with other balls
        for (let j = i + 1; j < balls.length; j++) {
            resolveCollision(balls[i], balls[j]);
        }

        balls[i].draw();
    }

    requestAnimationFrame(animate);
}

animate();
