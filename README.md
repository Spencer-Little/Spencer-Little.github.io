<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Engineering Project Board and Resume</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <!-- Navbar -->
  <nav>
    <div class="container mx-auto px-6 py-3">
      <div class="flex justify-between items-center">
        <div class="text-lg font-semibold">
          <a href="#" class="text-gray-800">My Portfolio</a>
        </div>
        <div class="flex space-x-4">
          <a href="#resume" class="text-gray-600 hover:text-gray-800">Resume</a>
          <a href="#projects" class="text-gray-600 hover:text-gray-800">Projects</a>
          <a href="#contact" class="text-gray-600 hover:text-gray-800">Contact</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header>
    <div class="container mx-auto px-6 text-center">
      <h1 class="text-4xl font-bold">Hello, I'm John Doe</h1>
      <p class="mt-4 text-lg">Software Engineer | Full Stack Developer</p>
    </div>
  </header>

  <!-- Resume Section -->
  <section id="resume">
    <div class="container mx-auto px-6">
      <h2>Resume</h2>
      <div class="grid">
        <div>
          <h3>Education</h3>
          <p>Bachelor of Science in Computer Science</p>
          <p>University of XYZ, 2016-2020</p>
        </div>
        <div>
          <h3>Experience</h3>
          <p>Software Engineer at ABC Corp</p>
          <p>2020-Present</p>
        </div>
        <div>
          <h3>Skills</h3>
          <p>JavaScript, React, Node.js, Python, Django, SQL</p>
        </div>
        <div>
          <h3>Contact</h3>
          <p>Email: john.doe@example.com</p>
          <p>Phone: (123) 456-7890</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Projects Section -->
  <section id="projects">
    <div class="container mx-auto px-6">
      <h2>Projects</h2>
      <div class="grid">
        <div>
          <h3>Project One</h3>
          <p>Description of project one.</p>
          <a href="https://github.com/username/project-one" class="text-blue-500 hover:underline">GitHub Repo</a>
        </div>
        <div>
          <h3>Project Two</h3>
          <p>Description of project two.</p>
          <a href="https://github.com/username/project-two" class="text-blue-500 hover:underline">GitHub Repo</a>
        </div>
        <!-- Add more projects as needed -->
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container mx-auto px-6 text-center">
      <p>&copy; 2024 John Doe. All rights reserved.</p>
      <div class="flex justify-center space-x-4 mt-4">
        <a href="https://linkedin.com/in/username" class="text-gray-400 hover:text-white">LinkedIn</a>
        <a href="https://github.com/username" class="text-gray-400 hover:text-white">GitHub</a>
        <a href="mailto:john.doe@example.com" class="text-gray-400 hover:text-white">Email</a>
      </div>
    </div>
  </footer>

</body>
</html>
