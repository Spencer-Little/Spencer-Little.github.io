// ── Year ───────────────────────────────────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Media rotators ─────────────────────────────────────────────────────────────
(function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.media-rotator').forEach(function (el) {
    var slides = Array.from(el.querySelectorAll('img, video'));
    if (!slides.length) return;

    slides.forEach(function (s) {
      if (s.tagName === 'VIDEO') { s.muted = true; s.playsInline = true; }
    });

    var idx = 0;
    var interval = Math.max(1200, parseInt(el.dataset.interval || '3000', 10));
    var timer = null;

    function show(i) {
      slides.forEach(function (s, k) {
        if (k === i) {
          s.classList.add('is-active');
          if (s.tagName === 'VIDEO') { s.currentTime = 0; s.play().catch(function(){}); }
        } else {
          s.classList.remove('is-active');
          if (s.tagName === 'VIDEO') { s.pause(); s.currentTime = 0; }
        }
      });
    }

    function next() {
      idx = (idx + 1) % slides.length;
      show(idx);
    }

    function startTimer() {
      if (prefersReduced || slides.length < 2) return;
      timer = setInterval(next, interval);
    }

    function stopTimer() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    show(0);
    startTimer();

    el.addEventListener('mouseenter', stopTimer);
    el.addEventListener('mouseleave', startTimer);
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stopTimer() : startTimer();
    });
  });
})();

// ── Cursor preview ─────────────────────────────────────────────────────────────
(function () {
  var cursor = document.getElementById('previewCursor');
  var imgEl  = document.getElementById('previewImg');
  var vidEl  = document.getElementById('previewVid');
  if (!cursor || !imgEl || !vidEl) return;
  if (window.matchMedia('(hover: none)').matches) return;

  var mx = 0, my = 0, visible = false;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (visible) {
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    }
  });

  function show(src) {
    var isVid = src.slice(-4) === '.mp4';
    imgEl.style.display = isVid ? 'none' : 'block';
    vidEl.style.display = isVid ? 'block' : 'none';
    if (isVid) { if (vidEl.getAttribute('src') !== src) vidEl.src = src; vidEl.play().catch(function(){}); }
    else        { if (imgEl.getAttribute('src') !== src) imgEl.src = src; vidEl.pause(); }
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    cursor.classList.add('is-active');
    visible = true;
  }

  function hide() {
    cursor.classList.remove('is-active');
    visible = false;
    vidEl.pause();
  }

  document.querySelectorAll('.proj-item[data-preview]').forEach(function (item) {
    item.addEventListener('mouseenter', function () {
      show(item.dataset.preview);
    });
    item.addEventListener('mouseleave', hide);
  });

  document.addEventListener('mouseleave', hide);
})();
