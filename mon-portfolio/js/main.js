/* ============================================================
   js/main.js
   Cursor · Loader · Scroll smooth · Reveal · Nav · Dots
============================================================ */

/* ============================================================
   0. HELPERS
============================================================ */
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

/* Fix 100vh mobile */
function setVH() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
setVH();
window.addEventListener('resize', setVH);

/* ============================================================
   1. LOADER
============================================================ */
(function initLoader() {
  const loader     = document.getElementById('loader');
  const loaderFill = document.getElementById('loader-fill');
  const loaderLbl  = document.getElementById('loader-label');

  let progress = 0;
  let done     = false;

  const interval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) { progress = 100; done = true; }

    loaderFill.style.width = progress + '%';
    loaderLbl.textContent  = `CHARGEMENT — ${Math.floor(progress)}%`;

    if (done) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        /* Trigger reveal sur le hero dès l'ouverture */
        triggerReveal(document.getElementById('hero'));
      }, 300);
    }
  }, 60);
})();

/* ============================================================
   2. CURSOR
============================================================ */
(function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  let mx = 0, my = 0; // mouse target
  let rx = 0, ry = 0; // ring position (lagged)

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

  /* Hover states */
  const hoverEls = 'a, button, .project-item, .skill-col li, .contact-link, .dot, .s-nav-btn';
  document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  /* Link click pulse */
  document.querySelectorAll('a').forEach(a => {
    a.addEventListener('mouseenter', () => document.body.classList.add('cursor-link'));
    a.addEventListener('mouseleave', () => document.body.classList.remove('cursor-link'));
  });

  /* Hide when out of window */
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });
})();

/* ============================================================
   3. NAVIGATION
============================================================ */
(function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const menu   = document.getElementById('mobile-menu');

  /* Scroll → ajoute classe scrolled */
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* Burger toggle */
  burger.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  /* Fermer menu mobile au clic lien */
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => menu.classList.remove('open'));
  });
})();

/* ============================================================
   4. SMOOTH SCROLL & SECTION TRACKING
============================================================ */
(function initScroll() {
  const sections  = Array.from(document.querySelectorAll('.fp-section'));
  const navLinks  = document.querySelectorAll('.nav-links a, .mobile-menu a');
  const dots      = document.querySelectorAll('.dot');
  const progressB = document.getElementById('progress-bar');

  let currentIdx = 0;
  let isScrolling = false;

  /* ----- Go to section ----- */
  function goTo(idx) {
    idx = clamp(idx, 0, sections.length - 1);
    if (idx === currentIdx) return;
    currentIdx = idx;

    sections[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateUI(idx);
    triggerReveal(sections[idx]);

    /* WebGL palette */
    if (typeof window.glSetSection === 'function') {
      window.glSetSection(idx);
    }
  }

  /* ----- Update nav / dots / progress ----- */
  function updateUI(idx) {
    /* Progress bar */
    const pct = (idx / (sections.length - 1)) * 100;
    progressB.style.width = pct + '%';

    /* Nav active link */
    navLinks.forEach(a => {
      a.classList.toggle('active', parseInt(a.dataset.section, 10) === idx);
    });

    /* Dots */
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  /* ----- Wheel scroll ----- */
  let wheelLock = false;
  window.addEventListener('wheel', e => {
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(() => wheelLock = false, 900);
    if (e.deltaY > 0) goTo(currentIdx + 1);
    else              goTo(currentIdx - 1);
  }, { passive: true });

  /* ----- Keyboard ----- */
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') goTo(currentIdx + 1);
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   goTo(currentIdx - 1);
  });

  /* ----- Touch swipe ----- */
  let touchY = 0;
  window.addEventListener('touchstart', e => {
    touchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', e => {
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) {
      if (dy > 0) goTo(currentIdx + 1);
      else        goTo(currentIdx - 1);
    }
  }, { passive: true });

  /* ----- Dot click ----- */
  dots.forEach(d => {
    d.addEventListener('click', () => goTo(parseInt(d.dataset.target, 10)));
  });

  /* ----- Nav link click ----- */
  document.querySelectorAll('[data-section]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      goTo(parseInt(a.dataset.section, 10));
    });
  });

  /* ----- Intersection Observer pour fallback scroll natif ----- */
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

  /* Init */
  updateUI(0);
})();

/* ============================================================
   5. REVEAL ANIMATIONS
============================================================ */
function triggerReveal(section) {
  if (!section) return;
  const els = section.querySelectorAll('.reveal');
  els.forEach(el => {
    /* Reset pour re-animer à chaque visite de section */
    el.classList.remove('visible');
    void el.offsetWidth; // reflow
    el.classList.add('visible');
  });
}

/* Observer pour la section hero (au cas où le loader est déjà passé) */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      triggerReveal(e.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.fp-section').forEach(s => revealObserver.observe(s));

/* ============================================================
   6. MARQUEE — pause au hover
============================================================ */
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
})();

/* ============================================================
   7. PROJECT ITEMS — micro-interaction magnétique curseur
============================================================ */
(function initMagnet() {
  document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('mousemove', e => {
      const rect   = item.getBoundingClientRect();
      const relX   = e.clientX - rect.left;
      const relY   = e.clientY - rect.top;
      const pctX   = (relX / rect.width  - 0.5) * 8;
      const pctY   = (relY / rect.height - 0.5) * 6;
      item.style.transform = `translate(${pctX}px, ${pctY}px)`;
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = '';
    });
  });
})();

/* ============================================================
   8. TITLE LETTERS SPLIT (hero)
============================================================ */
(function initSplitTitle() {
  /* On split les spans .title-line en caractères animés */
  document.querySelectorAll('.title-line').forEach(line => {
    /* On prend uniquement le texte direct, on garde les spans enfants */
    const childNodes = Array.from(line.childNodes);
    childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const chars = node.textContent.split('');
        const frag  = document.createDocumentFragment();
        chars.forEach((ch, i) => {
          const s = document.createElement('span');
          s.textContent = ch === ' ' ? '\u00A0' : ch;
          s.style.display = 'inline-block';
          s.style.transitionDelay = `${0.5 + i * 0.03}s`;
          frag.appendChild(s);
        });
        node.replaceWith(frag);
      }
    });
  });
})();

console.log('%c [ DEV ] Portfolio chargé ✦', 'color:#a8ff3e;font-family:monospace;font-size:14px;');