// Set current year in footer
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Image rotator for simple slideshows (e.g., Rover)
// Usage: <div class="media-rotator" data-interval="3000"> <img ...> <img ...> </div>
(function initMediaRotators() {
  const rotators = Array.from(document.querySelectorAll('.media-rotator'));
  if (!rotators.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  rotators.forEach((el) => {
    const slides = Array.from(el.querySelectorAll('img, video'));
    if (slides.length === 0) return;

    // Ensure videos are muted/inline for autoplay
    slides.forEach((s) => {
      if (s.tagName === 'VIDEO') {
        s.muted = true; s.playsInline = true; s.setAttribute('playsinline', '');
      }
    });

    // Show first slide
    let idx = 0;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    if (slides[idx].tagName === 'VIDEO') {
      slides[idx].currentTime = 0;
      slides[idx].play().catch(() => {});
    }

    if (prefersReducedMotion || slides.length < 2) return; // no auto-rotate

    const interval = Math.max(1200, parseInt(el.getAttribute('data-interval') || '3000', 10));
    let timer = setInterval(next, interval);

    function next() {
      const current = slides[idx];
      if (current.tagName === 'VIDEO') {
        current.pause();
        try { current.currentTime = 0; } catch (_) {}
      }
      current.classList.remove('is-active');

      idx = (idx + 1) % slides.length;
      const nextEl = slides[idx];
      nextEl.classList.add('is-active');
      if (nextEl.tagName === 'VIDEO') {
        nextEl.currentTime = 0;
        nextEl.play().catch(() => {});
      }
    }

    function pause() {
      clearInterval(timer);
      const current = slides[idx];
      if (current && current.tagName === 'VIDEO') current.pause();
    }
    function resume() {
      clearInterval(timer);
      const current = slides[idx];
      if (current && current.tagName === 'VIDEO') current.play().catch(() => {});
      timer = setInterval(next, interval);
    }

    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('focusin', pause);
    el.addEventListener('focusout', resume);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause(); else resume();
    });
  });
})();
