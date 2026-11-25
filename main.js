/* Cosas de Casa — main.js (IIFE, sin módulos) */
(function () {
  'use strict';

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn('[init] ' + name + ' falló:', e); }
  }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Nav sólida al hacer scroll + enlace activo */
  function initNav() {
    var nav = $('#nav');
    if (!nav) return;
    var solidAlways = document.body.classList.contains('page-solid');
    function onScroll() {
      nav.classList.toggle('solid', solidAlways || window.scrollY > 60);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var links = $$('.nav-links a');
    if (!('IntersectionObserver' in window) || !links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('active'); });
          map[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* Menú móvil */
  function initMenu() {
    var btn = $('#burger'), drawer = $('#drawer');
    if (!btn || !drawer) return;
    function set(open) {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    }
    btn.addEventListener('click', function () { set(!document.body.classList.contains('menu-open')); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* Reveal con IntersectionObserver + red de seguridad de 6s */
  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target, sibs = $$('.reveal', el.parentNode), i = Math.max(0, sibs.indexOf(el));
          el.style.transitionDelay = Math.min(i * 0.08, 0.4) + 's';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.2) el.classList.add('in');
      });
    }, 6000);
  }

  /* Parallax suave en imágenes (GSAP opcional) */
  function initParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    $$('[data-parallax]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* Galerías: arrastrar con ratón */
  function initGalleries() {
    $$('[data-gallery]').forEach(function (g) {
      var down = false, moved = false, startX = 0, startScroll = 0;
      g.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        down = true; moved = false; startX = e.clientX; startScroll = g.scrollLeft;
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 5) { moved = true; g.classList.add('dragging'); }
        if (moved) g.scrollLeft = startScroll - dx;
      });
      window.addEventListener('pointerup', function () {
        if (!down) return;
        down = false;
        setTimeout(function () { g.classList.remove('dragging'); }, 0);
      });
    });
  }

  /* Lightbox */
  function initLightbox() {
    var lb = $('#lightbox');
    if (!lb) return;
    var img = $('img', lb), list = [], idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + list.length) % list.length;
      img.src = list[idx].getAttribute('data-full');
      img.alt = ($('img', list[idx]) || {}).alt || '';
    }
    function open(items, i) {
      list = items; lastFocus = document.activeElement; show(i);
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      $('.lb-close', lb).focus();
    }
    function close() {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    $$('[data-gallery]').forEach(function (g) {
      var items = $$('.g-item', g);
      items.forEach(function (it, i) { it.addEventListener('click', function () { open(items, i); }); });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* Formulario: valida y prepara el correo (web estática, sin servidor) */
  function initForm() {
    var form = $('#form'), note = $('#form-note');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', form).forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        f.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) { note.textContent = 'Revise los campos marcados, por favor.'; note.classList.remove('ok'); return; }
      var d = form.elements;
      var body = 'Nombre: ' + d.nombre.value + '\nE-mail: ' + d.email.value + '\nTeléfono: ' + d.telefono.value + '\n\n' + d.mensaje.value;
      window.location.href = 'mailto:clientes@cosasdecasajerez.es?subject=' +
        encodeURIComponent('Consulta desde la web — ' + d.nombre.value) + '&body=' + encodeURIComponent(body);
      note.textContent = 'Gracias. Se ha abierto su correo con el mensaje listo para enviar.';
      note.classList.add('ok');
    });
  }

  function initYear() { var y = $('#year'); if (y) y.textContent = new Date().getFullYear(); }

  /* Red de seguridad: el texto de portada siempre visible tras 2,5s */
  function initHeroSafety() {
    setTimeout(function () { var h = $('.hero'); if (h) h.classList.add('hero-done'); }, 2500);
  }

  /* Mapa de Google solo cuando el visitante lo pide (sin cookies de terceros al entrar) */
  function initMap() {
    var btn = $('#map-load'), box = $('#map');
    if (!btn || !box) return;
    btn.addEventListener('click', function () {
      box.innerHTML = '<iframe title="Mapa: Calle Porvenir 36, Jerez de la Frontera" src="https://www.google.com/maps?q=Calle+Porvenir+36,+11401+Jerez+de+la+Frontera&output=embed" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
    });
  }

  function boot() {
    safe(initHeroSafety, 'hero');
    safe(initNav, 'nav');
    safe(initMenu, 'menu');
    safe(initReveal, 'reveal');
    safe(initParallax, 'parallax');
    safe(initGalleries, 'galleries');
    safe(initLightbox, 'lightbox');
    safe(initForm, 'form');
    safe(initMap, 'map');
    safe(initYear, 'year');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
