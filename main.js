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

    let idx = 0;
    let timer = null;
    let onEnded = null;
    const baseInterval = Math.max(1200, parseInt(el.getAttribute('data-interval') || '3000', 10));

    function show(i) {
      // Hide current
      slides.forEach((s, k) => {
        if (k !== i && s.classList.contains('is-active')) {
          if (s.tagName === 'VIDEO') {
            try { s.pause(); s.currentTime = 0; } catch (_) {}
          }
          s.classList.remove('is-active');
        }
      });
      // Show new
      const nextEl = slides[i];
      nextEl.classList.add('is-active');
      if (nextEl.tagName === 'VIDEO') {
        try { nextEl.currentTime = 0; } catch (_) {}
        nextEl.play().catch(() => {});
      }
    }

    function clearTimers() {
      if (timer) { clearInterval(timer); timer = null; }
      const current = slides[idx];
      if (onEnded && current && current.tagName === 'VIDEO') {
        current.removeEventListener('ended', onEnded);
        onEnded = null;
      }
    }

    function schedule() {
      clearTimers();
      const current = slides[idx];

      // If current is a non-looping video, wait for it to finish
      if (current && current.tagName === 'VIDEO' && !current.loop) {
        onEnded = () => { next(); };
        current.addEventListener('ended', onEnded, { once: true });
        return;
      }

      // Otherwise use time-based rotation
      timer = setInterval(next, baseInterval);
    }

    function next() {
      const current = slides[idx];
      if (current && current.tagName === 'VIDEO') {
        try { current.pause(); current.currentTime = 0; } catch (_) {}
      }
      current && current.classList.remove('is-active');

      idx = (idx + 1) % slides.length;
      show(idx);
      if (!(prefersReducedMotion || slides.length < 2)) schedule();
    }

    function pause() {
      clearTimers();
      const current = slides[idx];
      if (current && current.tagName === 'VIDEO') current.pause();
    }
    function resume() {
      const current = slides[idx];
      if (current && current.tagName === 'VIDEO') current.play().catch(() => {});
      if (!(prefersReducedMotion || slides.length < 2)) schedule();
    }

    // Initialize
    show(idx);
    if (!(prefersReducedMotion || slides.length < 2)) schedule();

    // Interaction hooks
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('focusin', pause);
    el.addEventListener('focusout', resume);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause(); else resume();
    });
  });
})();
