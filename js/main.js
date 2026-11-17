// Hospital Visão — interações leves (sem dependências)
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header com borda ao rolar
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menu mobile
  const burger = document.getElementById('burger');
  burger.addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.querySelectorAll('#nav a').forEach(a =>
    a.addEventListener('click', () => document.body.classList.remove('nav-open')));

  // Reveal ao entrar na tela (com leve escalonamento entre irmãos)
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const siblings = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
      e.target.style.transitionDelay = `${Math.min(siblings.indexOf(e.target), 5) * 80}ms`;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Contadores
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      const t0 = performance.now(), dur = reduce ? 0 : 1400;
      const tick = now => {
        const p = dur ? Math.min((now - t0) / dur, 1) : 1;
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => countIO.observe(el));

  // Parallax sutil
  if (!reduce) {
    const items = [...document.querySelectorAll('[data-parallax]')];
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const offset = (r.top + r.height / 2 - vh / 2) * +el.dataset.parallax;
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  // Banners do hero
  const hero = document.getElementById('hero');
  const slides = [...hero.querySelectorAll('.slide')];
  const dots = [...hero.querySelectorAll('.hero__dots button')];
  const DURATION = 7000;
  let current = 0, timer;
  const go = i => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === current));
    dots.forEach((d, k) => {
      d.classList.remove('is-active');
      if (k === current) { void d.offsetWidth; d.classList.add('is-active'); } // reinicia a barra
    });
    restart();
  };
  const restart = () => {
    clearTimeout(timer);
    if (!reduce && !hero.classList.contains('is-paused')) timer = setTimeout(() => go(current + 1), DURATION);
  };
  dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
  hero.querySelector('.hero__prev').addEventListener('click', () => go(current - 1));
  hero.querySelector('.hero__next').addEventListener('click', () => go(current + 1));
  hero.addEventListener('mouseenter', () => { hero.classList.add('is-paused'); clearTimeout(timer); });
  hero.addEventListener('mouseleave', () => { hero.classList.remove('is-paused'); go(current); });
  document.addEventListener('keydown', e => {
    if (hero.getBoundingClientRect().bottom < 0) return;
    if (e.key === 'ArrowRight') go(current + 1);
    if (e.key === 'ArrowLeft') go(current - 1);
  });
  let x0 = null;
  hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  restart();

  // Carrossel do corpo clínico
  document.querySelectorAll('[data-carousel]').forEach(root => {
    const track = root.querySelector('.carousel__track');
    const prev = root.querySelector('.carousel__prev');
    const next = root.querySelector('.carousel__next');
    const bar = root.querySelector('.carousel__bar span');
    const step = () => {
      const card = track.firstElementChild;
      return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    };
    const maxScroll = () => track.scrollWidth - track.clientWidth;
    const update = () => {
      const max = maxScroll();
      const visible = track.clientWidth / track.scrollWidth;
      bar.style.width = `${visible * 100}%`;
      bar.style.marginLeft = `${max ? (track.scrollLeft / max) * (1 - visible) * 100 : 0}%`;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    };
    const go = dir => {
      if (dir > 0 && track.scrollLeft >= maxScroll() - 2) track.scrollTo({ left: 0 });
      else track.scrollBy({ left: dir * step() });
    };
    prev.addEventListener('click', () => { go(-1); hold(); });
    next.addEventListener('click', () => { go(1); hold(); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    // Arrastar com o mouse
    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false; track.classList.remove('is-dragging');
      if (moved) { const s = step(); track.scrollTo({ left: Math.round(track.scrollLeft / s) * s }); hold(); }
    });

    // Avanço automático, pausado durante a interação
    let auto, paused = false;
    const play = () => { clearInterval(auto); if (!reduce) auto = setInterval(() => { if (!paused) go(1); }, 4000); };
    const hold = () => { play(); };
    root.addEventListener('mouseenter', () => { paused = true; });
    root.addEventListener('mouseleave', () => { paused = false; });
    track.addEventListener('touchstart', () => { paused = true; }, { passive: true });
    track.addEventListener('touchend', () => { setTimeout(() => { paused = false; }, 3000); });
    play();
  });

  // Procedimentos: coluna expande ao clicar (ou Enter/Espaço no teclado)
  document.querySelectorAll('.panels').forEach(group => {
    const panels = [...group.querySelectorAll('.panel')];
    const open = p => panels.forEach(x => {
      x.classList.toggle('is-open', x === p);
      x.setAttribute('aria-expanded', x === p);
    });
    panels.forEach(p => {
      p.setAttribute('role', 'button');
      p.setAttribute('aria-expanded', p.classList.contains('is-open'));
      p.addEventListener('click', e => { if (!e.target.closest('a')) open(p); });
      p.addEventListener('keydown', e => {
        const i = panels.indexOf(p);
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(p); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); panels[(i + 1) % panels.length].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); panels[(i - 1 + panels.length) % panels.length].focus(); }
      });
    });

    const scrollToPanel = p => {
      open(p);
      requestAnimationFrame(() => {
        const headerH = document.querySelector('.header')?.offsetHeight || 72;
        const targetTop = p.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      });
    };

    const checkHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const target = panels.find(p => p.id === hash);
      if (target) scrollToPanel(target);
    };

    window.addEventListener('hashchange', checkHash);
    if (window.location.hash) {
      setTimeout(checkHash, 150);
    }

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      const targetId = a.getAttribute('href').slice(1);
      const panel = panels.find(p => p.id === targetId);
      if (panel) {
        a.addEventListener('click', e => {
          e.preventDefault();
          history.pushState(null, '', `#${targetId}`);
          scrollToPanel(panel);
        });
      }
    });
  });

  // Vídeo: carrega o player do YouTube só ao clicar (página mais leve)
  document.querySelectorAll('[data-video]').forEach(box => {
    box.addEventListener('click', () => {
      if (box.classList.contains('is-playing')) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${box.dataset.video}?autoplay=1&rel=0`;
      iframe.title = 'Vídeo institucional do Hospital Visão';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      box.appendChild(iframe);
      box.classList.add('is-playing');
    });
  });

  // Foco: os óculos descem com o scroll; o texto fica nítido através das lentes
  const focus = document.getElementById('foco');
  if (focus && !reduce) {
    const words = focus.querySelector('.focus__words');
    const glasses = focus.querySelector('.focus__glasses');
    const lenses = glasses.dataset.lens.split('|').map(l => l.split(',').map(Number));
    const clamp = v => Math.min(1, Math.max(0, v));
    const ease = t => 1 - Math.pow(1 - t, 3);
    const ramp = (p, a, b) => clamp((p - a) / (b - a));
    let ticking = false;

    const render = () => {
      ticking = false;
      const r = focus.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp(-r.top / (r.height - vh));

      const down = ease(ramp(p, 0.06, 0.48));        // descida
      const lift = ease(ramp(p, 0.66, 0.86));        // os óculos saem
      const clear = ramp(p, 0.56, 0.72);             // o texto todo fica nítido

      const ty = -vh * 0.85 * (1 - down) - vh * 0.9 * lift;
      const rot = -22 * (1 - down) + 10 * lift;
      const sc = 1.25 - 0.25 * down;
      glasses.style.transform = `translate(0px, ${ty.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      glasses.style.opacity = (Math.min(1, down * 3) * (1 - lift)).toFixed(3);

      // posição das lentes em relação ao bloco de texto
      const gw = glasses.offsetWidth, gh = glasses.offsetHeight;
      const cx0 = words.clientWidth / 2;
      const cy0 = words.clientHeight / 2 + ty;
      const a = rot * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
      const masks = lenses.map(([lx, ly, rx, ry]) => {
        const ox = (lx - 0.5) * gw * sc, oy = (ly - 0.5) * gh * sc;
        const x = cx0 + ox * cos - oy * sin, y = cy0 + ox * sin + oy * cos;
        return `radial-gradient(${(rx * gw * sc).toFixed(1)}px ${(ry * gh * sc).toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, #000 94%, transparent 100%)`;
      });
      focus.style.setProperty('--mask', masks.join(', '));
      focus.style.setProperty('--mask-out', down > 0.05 && lift < 0.98 ? masks.join(', ') + ', linear-gradient(#000, #000)' : 'none');
      focus.style.setProperty('--blur', `${(16 * (1 - clear)).toFixed(2)}px`);
      focus.style.setProperty('--blurop', (0.55 + 0.45 * clear).toFixed(3));
      focus.style.setProperty('--p2', lift.toFixed(3));

      const c1 = ramp(p, 0.36, 0.46) * (1 - ramp(p, 0.6, 0.68));
      const c2 = ramp(p, 0.78, 0.88);
      focus.style.setProperty('--c1', c1.toFixed(3));
      focus.style.setProperty('--c2', c2.toFixed(3));
      focus.style.setProperty('--c2pe', c2 > 0.5 ? 'auto' : 'none');
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    glasses.addEventListener('load', req);
    render();
  }

  // Formulário → WhatsApp
  const form = document.getElementById('form');
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const d = new FormData(form);
    const msg = `Olá! Sou ${d.get('nome')} (${d.get('email')}).\n\n${d.get('mensagem')}`;
    window.open(`https://wa.me/556536242434?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    document.getElementById('formOk').hidden = false;
    form.reset();
  });
})();
