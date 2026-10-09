/* Iyad Hadjour — portfolio : interactions, sans aucune dépendance */
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navigation : fond et trait une fois la page défilée ---------- */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Les pensées dans le nuage ---------- */
  const live = $('.typed-live');
  const ghost = $('.typed-ghost');
  if (live && ghost && !reduceMotion) {
    const phrases = [
      'Et si ce capteur parlait directement à l’interface\u00a0?',
      'Et si ce site avait enfin une âme\u00a0?',
      'Et si l’IA rendait tout ça plus simple\u00a0?',
      'Et si on construisait ça ensemble\u00a0?',
    ];
    const wait = async (ms) => {
      await new Promise((r) => setTimeout(r, ms));
      while (document.hidden) await new Promise((r) => addEventListener('visibilitychange', r, { once: true }));
    };
    const run = async () => {
      let i = 0;
      live.classList.add('is-typing');
      for (;;) {
        await wait(i === 0 ? 3600 : 2800);                       // laisse lire la pensée
        for (let n = phrases[i].length; n > 0; n -= 2) {         // efface vite
          live.textContent = phrases[i].slice(0, Math.max(n - 2, 0));
          await wait(14);
        }
        await wait(350);
        i = (i + 1) % phrases.length;
        ghost.textContent = phrases[i];                          // réserve la place (pas de saut de mise en page)
        for (let n = 1; n <= phrases[i].length; n++) {           // écrit la suivante
          live.textContent = phrases[i].slice(0, n);
          await wait(34 + Math.random() * 40);
        }
      }
    };
    run();
  }

  /* ---------- Copier l'adresse e-mail ---------- */
  const copyBtn = $('[data-copy]');
  if (copyBtn) {
    const label = $('[data-copy-label]', copyBtn);
    const idle = label.textContent;
    let timer;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        label.textContent = 'Adresse copiée';
      } catch {
        label.textContent = copyBtn.dataset.copy;                // à défaut, on affiche l'adresse
      }
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = idle; }, 2200);
    });
  }
})();