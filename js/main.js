/* ============================================================
   js/main.js
   Cursor · Loader · Scroll smooth · Reveal · Nav · Dots
============================================================ */

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

function setVH() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
setVH();
window.addEventListener('resize', setVH);

/* Détection mobile */
function isMobile() {
  return window.innerWidth <= 1024;
}

/* ============================================================
   1. LOADER
============================================================ */
(function initLoader() {
  const loader     = document.getElementById('loader');
  const loaderFill = document.getElementById('loader-fill');
  const loaderLbl  = document.getElementById('loader-label');
  let progress = 0, done = false;

  const interval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) { progress = 100; done = true; }
    loaderFill.style.width = progress + '%';
    loaderLbl.textContent  = `CHARGEMENT — ${Math.floor(progress)}%`;
    if (done) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        triggerReveal(document.getElementById('hero'));
      }, 300);
    }
  }, 60);
})();

/* ============================================================
   2. CURSOR (desktop uniquement)
============================================================ */
(function initCursor() {
  if (isMobile()) return;
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let mx=0, my=0, rx=0, ry=0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function animRing() {
    rx = lerp(rx, mx, 0.13);
    ry = lerp(ry, my, 0.13);
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  const hoverEls = 'a, button, .project-item, .skill-col li, .contact-link, .dot';
  document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
  document.querySelectorAll('a').forEach(a => {
    a.addEventListener('mouseenter', () => document.body.classList.add('cursor-link'));
    a.addEventListener('mouseleave', () => document.body.classList.remove('cursor-link'));
  });
  document.addEventListener('mouseleave', () => { dot.style.opacity='0'; ring.style.opacity='0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity='1'; ring.style.opacity='1'; });
})();

/* ============================================================
   3. NAVIGATION
============================================================ */
(function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const menu   = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  burger.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => menu.classList.remove('open'));
  });
})();

/* ============================================================
   4. SCROLL — FULLPAGE sur desktop, LIBRE sur mobile
============================================================ */
(function initScroll() {
  const sections  = Array.from(document.querySelectorAll('.fp-section'));
  const navLinks  = document.querySelectorAll('.nav-links a, .mobile-menu a');
  const dots      = document.querySelectorAll('.dot');
  const progressB = document.getElementById('progress-bar');

  let currentIdx = 0;

  /* ----- Update nav / dots / progress ----- */
  function updateUI(idx) {
    const pct = (idx / (sections.length - 1)) * 100;
    progressB.style.width = pct + '%';
    navLinks.forEach(a => {
      a.classList.toggle('active', parseInt(a.dataset.section, 10) === idx);
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  /* ══════════════════════════════════════
     MOBILE — scroll libre natif
  ══════════════════════════════════════ */
  if (isMobile()) {
    // Sur mobile : scroll natif, on suit juste la section visible
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
          const idx = sections.indexOf(entry.target);
          if (idx !== -1) {
            currentIdx = idx;
            updateUI(idx);
            if (typeof window.glSetSection === 'function') window.glSetSection(idx);
          }
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(s => io.observe(s));

    // Liens nav sur mobile → scroll natif vers la section
    document.querySelectorAll('[data-section]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const idx = parseInt(a.dataset.section, 10);
        sections[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    dots.forEach(d => {
      d.addEventListener('click', () => {
        const idx = parseInt(d.dataset.target, 10);
        sections[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    updateUI(0);
    return; // On s'arrête ici pour mobile
  }

  /* ══════════════════════════════════════
     DESKTOP — fullpage scroll par section
  ══════════════════════════════════════ */
  function goTo(idx) {
    idx = clamp(idx, 0, sections.length - 1);
    if (idx === currentIdx) return;
    currentIdx = idx;
    sections[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateUI(idx);
    triggerReveal(sections[idx]);
    if (typeof window.glSetSection === 'function') window.glSetSection(idx);
  }

  // Wheel
  let wheelLock = false;
  window.addEventListener('wheel', e => {
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(() => wheelLock = false, 900);
    if (e.deltaY > 0) goTo(currentIdx + 1);
    else              goTo(currentIdx - 1);
  }, { passive: true });

  // Keyboard
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') goTo(currentIdx + 1);
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   goTo(currentIdx - 1);
  });

  // Touch desktop (tablette en mode desktop)
  let touchY = 0;
  window.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', e => {
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) {
      if (dy > 0) goTo(currentIdx + 1);
      else        goTo(currentIdx - 1);
    }
  }, { passive: true });

  // Dots
  dots.forEach(d => {
    d.addEventListener('click', () => goTo(parseInt(d.dataset.target, 10)));
  });

  // Nav links
  document.querySelectorAll('[data-section]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      goTo(parseInt(a.dataset.section, 10));
    });
  });

  // Intersection observer fallback
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        const idx = sections.indexOf(entry.target);
        if (idx !== currentIdx) {
          currentIdx = idx;
          updateUI(idx);
          if (typeof window.glSetSection === 'function') window.glSetSection(idx);
        }
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(s => io.observe(s));
  updateUI(0);
})();

/* ============================================================
   5. REVEAL ANIMATIONS
============================================================ */
function triggerReveal(section) {
  if (!section) return;
  const els = section.querySelectorAll('.reveal');
  els.forEach(el => {
    el.classList.remove('visible');
    void el.offsetWidth;
    el.classList.add('visible');
  });
}

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) triggerReveal(e.target);
  });
}, { threshold: 0.15 });

document.querySelectorAll('.fp-section').forEach(s => revealObserver.observe(s));

/* ============================================================
   6. MARQUEE
============================================================ */
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
})();

/* ============================================================
   7. PROJECT ITEMS — magnétique (desktop uniquement)
============================================================ */
(function initMagnet() {
  if (isMobile()) return;
  document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('mousemove', e => {
      const rect = item.getBoundingClientRect();
      const pctX = (e.clientX - rect.left) / rect.width  - 0.5;
      const pctY = (e.clientY - rect.top)  / rect.height - 0.5;
      item.style.transform = `translate(${pctX*8}px, ${pctY*6}px)`;
    });
    item.addEventListener('mouseleave', () => { item.style.transform = ''; });
  });
})();

console.log('%c [ IH ] Portfolio Iyad Hadjour ✦', 'color:#a8ff3e;font-family:monospace;font-size:14px;');