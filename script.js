/* =====================================================================
   SERVIORINOQUIA SAS — Interacciones
   Vanilla JS · sin dependencias
   ===================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     1. LOADER
     --------------------------------------------------------------- */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    const hide = () => {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 700);
    };
    window.addEventListener('load', () => setTimeout(hide, 500));
    // Red de seguridad: nunca dejar la página bloqueada
    setTimeout(hide, 3500);
  }

  /* ---------------------------------------------------------------
     2. NAVBAR — sombra al hacer scroll + menú móvil + link activo
     --------------------------------------------------------------- */
  function initNavbar() {
    const navbar   = $('#navbar');
    const nav      = $('#mainNav');
    const toggle   = $('#navToggle');
    const links    = $$('.nav__link');
    const toTop    = $('#toTop');

    // Backdrop para el menú móvil
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    const closeMenu = () => {
      nav.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      document.body.classList.remove('no-scroll');
    };

    const openMenu = () => {
      nav.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú');
      document.body.classList.add('no-scroll');
    };

    toggle.addEventListener('click', () => {
      nav.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    backdrop.addEventListener('click', closeMenu);
    links.forEach(l => l.addEventListener('click', closeMenu));
    $('.nav__cta')?.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });

    // Scroll: estado del navbar + botón volver arriba
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      navbar.classList.toggle('is-scrolled', y > 40);
      toTop.classList.toggle('is-visible', y > 500);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    // Link activo según la sección visible
    const sections = $$('main section[id]');
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------------------------------------------------------------
     3. SCROLL REVEAL
     --------------------------------------------------------------- */
  function initReveal() {
    const items = $$('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    items.forEach(i => io.observe(i));

    // Animación de trazo del mapa de cobertura
    const map = $('.map-svg');
    if (map) {
      const mapIo = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.3 });
      mapIo.observe(map);
    }
  }

  /* ---------------------------------------------------------------
     4. CONTADORES ANIMADOS
     --------------------------------------------------------------- */
  function initCounters() {
    const counters = $$('.counter');
    if (!counters.length) return;

    const format = n => n.toLocaleString('es-CO');

    // Reservamos de antemano el ancho exacto del valor final para que el número
    // no ensanche la tarjeta mientras cuenta (0 → 100.000 pasa de 1 a 7 caracteres).
    // Se mide en píxeles reales: en `ch` sobraría espacio y quedaría un hueco antes del "+".
    const reserveWidth = () => {
      counters.forEach(el => {
        const final = format(parseInt(el.dataset.target, 10) || 0);
        const prev  = el.textContent;
        el.style.display   = 'inline-block';
        el.style.textAlign = 'center';
        el.style.minWidth  = '';
        el.textContent     = final;
        el.style.minWidth  = el.getBoundingClientRect().width + 'px';
        el.textContent     = prev;
      });
    };
    // Esperamos a que carguen las fuentes; si no, mediríamos con la tipografía de respaldo.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveWidth);
    else reserveWidth();
    let rwTick = false;
    window.addEventListener('resize', () => {
      if (rwTick) return;
      rwTick = true;
      requestAnimationFrame(() => { reserveWidth(); rwTick = false; });
    });

    const run = el => {
      const target   = parseInt(el.dataset.target, 10) || 0;
      const duration = 1900;
      const start    = performance.now();

      if (reducedMotion) { el.textContent = format(target); return; }

      const step = now => {
        const p    = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = format(Math.floor(target * ease));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = format(target);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        run(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  }

  /* ---------------------------------------------------------------
     5. PARALLAX DEL HERO
     --------------------------------------------------------------- */
  function initParallax() {
    const bg = $('#heroBg');
    if (!bg || reducedMotion) return;
    if (window.innerWidth < 900) return; // desactivado en móvil por rendimiento

    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        bg.style.transform = `translate3d(0, ${y * 0.32}px, 0) scale(1.05)`;
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
     5.b BUS DE LA LÍNEA DE TIEMPO
     El bus avanza por la línea de "Nuestra trayectoria" según lo que el
     visitante ha bajado, y va pintando detrás la carretera recorrida.
     Solo en escritorio: en móvil la línea horizontal no existe.
     --------------------------------------------------------------- */
  function initTimelineBus() {
    const track = $('#timelineTrack');
    const bus   = $('#timelineBus');
    const road  = $('#timelineRoad');
    if (!track || !bus || !road) return;
    if (window.innerWidth < 1080 || reducedMotion) return;

    const items = $$('.tl-item', track);
    if (!items.length) return;

    track.classList.add('has-bus');
    bus.style.display = 'flex';

    // Fracción de recorrido a la que el bus arranca hacia cada parada. La
    // primera va casi al principio para que no se quede quieto esperando.
    const CUTS = items.map((_, i) => 0.10 + i * 0.22);

    // Centro horizontal de cada punto naranja: son las paradas del bus.
    let stops = [];
    const measure = () => {
      const base = track.getBoundingClientRect().left;
      stops = items.map(it => {
        const dot = it.querySelector('.tl-dot').getBoundingClientRect();
        return dot.left - base + dot.width / 2;
      });
    };

    let last = -1;
    const update = () => {
      ticking = false;
      const rect  = track.getBoundingClientRect();
      const start = window.innerHeight * 0.9;
      const end   = window.innerHeight * 0.35;
      const p     = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);

      // Cuántas paradas ha alcanzado ya: el bus salta de una a la siguiente.
      let reached = 0;
      for (const c of CUTS) if (p >= c) reached++;
      if (reached === last) return;
      last = reached;

      const x = reached === 0 ? 0 : stops[reached - 1];
      bus.style.left   = x + 'px';
      road.style.width = x + 'px';
      items.forEach((it, i) => it.classList.toggle('is-reached', i < reached));
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { measure(); last = -1; update(); });
    measure();
    update();
  }

  /* ---------------------------------------------------------------
     6. ACORDEÓN FAQ
     --------------------------------------------------------------- */
  function initFaq() {
    const items = $$('.faq-item');
    items.forEach(item => {
      const btn    = $('.faq-item__q', item);
      const panel  = $('.faq-item__a', item);

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Cerrar los demás (comportamiento de acordeón)
        items.forEach(other => {
          other.classList.remove('is-open');
          $('.faq-item__q', other).setAttribute('aria-expanded', 'false');
          $('.faq-item__a', other).style.maxHeight = null;
        });

        if (!isOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });

    // Recalcular altura al redimensionar
    window.addEventListener('resize', () => {
      $$('.faq-item.is-open .faq-item__a').forEach(p => {
        p.style.maxHeight = p.scrollHeight + 'px';
      });
    });
  }

  /* ---------------------------------------------------------------
     7. CARRUSEL DE CLIENTES (loop infinito)
     --------------------------------------------------------------- */
  function initClients() {
    const track = $('#clientsTrack');
    if (!track) return;
    // Duplicar el contenido para que el desplazamiento del 50% sea continuo
    track.innerHTML += track.innerHTML;
  }

  /* ---------------------------------------------------------------
     8. EFECTO 3D SUTIL EN TARJETAS
     --------------------------------------------------------------- */
  function initTilt() {
    if (reducedMotion || window.matchMedia('(hover: none)').matches) return;

    $$('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r  = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - 0.5;
        const py = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg) translateY(-8px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------
     9. FORMULARIO DE CONTACTO
     --------------------------------------------------------------- */
  function initForm() {
    const forms = $$('.contact-form');
    if (!forms.length) return;

    const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    forms.forEach(form => initSingleForm(form, isEmail));
  }

  function initSingleForm(form, isEmail) {
    const msg = $('.form-msg', form);

    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      $$('input, select, textarea', form).forEach(field => {
        field.classList.remove('is-error');
        if (field.hasAttribute('required') && !field.value.trim()) {
          field.classList.add('is-error');
          valid = false;
        }
        if (field.type === 'email' && field.value.trim() && !isEmail(field.value.trim())) {
          field.classList.add('is-error');
          valid = false;
        }
      });

      if (!valid) {
        msg.textContent = 'Por favor completa los campos obligatorios correctamente.';
        msg.className = 'form-msg err';
        $('.is-error', form)?.focus();
        return;
      }

      // Mockup: simulación de envío
      const btn = $('button[type="submit"]', form);
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...';
      msg.textContent = '';

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        msg.textContent = form.dataset.okMsg
          || '¡Gracias! Hemos recibido tu solicitud. Te contactaremos muy pronto.';
        msg.className = 'form-msg ok';
        form.reset();
        const list = $('.file-list', form);
        if (list) list.innerHTML = '';
        setTimeout(() => { msg.textContent = ''; msg.className = 'form-msg'; }, 7000);
      }, 1400);
    });

    // Limpiar error al escribir
    $$('input, select, textarea', form).forEach(f => {
      f.addEventListener('input', () => f.classList.remove('is-error'));
    });

    initFileField(form);
  }

  /* ---------------------------------------------------------------
     9b. CAMPO DE ARCHIVOS (PQRS)
     --------------------------------------------------------------- */
  function initFileField(form) {
    const input = $('.file-input', form);
    const list  = $('.file-list', form);
    if (!input || !list) return;

    const MAX_FILES = 5;
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por archivo
    const humanSize = b => b < 1024 * 1024
      ? Math.max(1, Math.round(b / 1024)) + ' KB'
      : (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';

    input.addEventListener('change', () => {
      const files = Array.from(input.files);
      list.innerHTML = '';

      files.slice(0, MAX_FILES).forEach(f => {
        const tooBig = f.size > MAX_BYTES;
        const li = document.createElement('li');
        if (tooBig) li.className = 'is-error';
        li.innerHTML =
          '<i class="fa-solid ' + (tooBig ? 'fa-circle-exclamation' : 'fa-paperclip') + '"></i>' +
          '<span class="file-list__name"></span>' +
          '<span class="file-list__size">' + (tooBig ? 'supera 10 MB' : humanSize(f.size)) + '</span>';
        // textContent evita inyectar HTML con nombres de archivo
        $('.file-list__name', li).textContent = f.name;
        list.appendChild(li);
      });

      if (files.length > MAX_FILES) {
        const li = document.createElement('li');
        li.className = 'is-error';
        li.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>' +
          '<span>Solo se admiten ' + MAX_FILES + ' archivos; se ignoraron los demás.</span>';
        list.appendChild(li);
      }
    });
  }

  /* ---------------------------------------------------------------
     10. VARIOS
     --------------------------------------------------------------- */
  function initMisc() {
    // Año dinámico en el footer
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    // Scroll suave compensando el navbar fijo
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navH = $('#navbar')?.offsetHeight || 0;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH + 1;
        window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------------------------------------------------------------
     INICIO
     --------------------------------------------------------------- */
  function init() {
    initLoader();
    initNavbar();
    initReveal();
    initCounters();
    initParallax();
    initTimelineBus();
    initFaq();
    initClients();
    initTilt();
    initForm();
    initMisc();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
