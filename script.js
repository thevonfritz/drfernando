/**
 * Dr. Fernando Petersen — script.js
 * Animações premium: headline split, reveal scroll, 3D tilt,
 * magnetic buttons, parallax hero, contador, form, carrossel, CSRF.
 */
(function () {
  'use strict';

  /* ── CSRF ─────────────────────────────────────────────────────── */
  function generateCSRF() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const token = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    const el = document.getElementById('csrfToken');
    if (el) el.value = token;
    sessionStorage.setItem('_csrf', token);
  }

  /* headline é animada por CSS puro — sem JS necessário */

  /* ── REVEAL ON SCROLL ────────────────────────────────────────── */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-block').forEach(el => el.classList.add('in'));
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-block').forEach(el => obs.observe(el));
  }

  /* ── 3D TILT ─────────────────────────────────────────────────── */
  function init3DTilt() {
    if (window.matchMedia('(hover:none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

    const cards = document.querySelectorAll('.tcard, .bento-card, .hero-float-card');

    cards.forEach(card => {
      let raf = null;
      const MAX = 7;

      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const rx = -((y - r.height / 2) / r.height) * MAX;
        const ry = ((x - r.width / 2) / r.width) * MAX;

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
          card.style.transition = 'transform .1s';
        });
      });

      card.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transition = 'transform .65s cubic-bezier(.16,1,.3,1)';
        card.style.transform = '';
      });
    });
  }

  /* ── MAGNETIC BUTTONS ────────────────────────────────────────── */
  function initMagnetic() {
    if (window.matchMedia('(hover:none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

    document.querySelectorAll('.btn').forEach(btn => {
      let raf = null;
      const PULL = 0.28;

      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * PULL;
        const y = (e.clientY - r.top - r.height / 2) * PULL;

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          btn.style.transform = `translate(${x}px,${y}px) translateY(-3px) scale(1.025)`;
          btn.style.transition = 'transform .2s';
        });
      });

      btn.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        btn.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
        btn.style.transform = '';
      });
    });
  }

  /* ── PARALLAX HERO ───────────────────────────────────────────── */
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    /* Skip em mobile/tablet — economiza CPU/GPU */
    if (window.matchMedia('(max-width:1023px)').matches) return;

    const heroBg  = document.querySelector('.hero-bg-img img');
    const heroOrbs= document.querySelectorAll('.hero-orb');
    const content = document.querySelector('.hero-copy');
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 900) {
          if (heroBg) heroBg.style.transform = `translateY(${y * 0.14}px) scale(${1 + y * 0.0002})`;
          for (let i = 0; i < heroOrbs.length; i++) {
            heroOrbs[i].style.transform = `translateY(${y * (.08 + i * .04)}px)`;
          }
          if (content) {
            content.style.transform = `translateY(${y * 0.22}px)`;
            content.style.opacity = String(Math.max(0, 1 - y / 550));
          }
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── CONTADOR ────────────────────────────────────────────────── */
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    const run = (el) => {
      const end    = parseInt(el.dataset.count, 10);
      const prefix = el.dataset.prefix || '';
      const dur    = 1600;
      const start  = performance.now();

      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + Math.floor(ease * end).toLocaleString('pt-BR');
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      els.forEach(run); return;
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.5 });

    els.forEach(el => obs.observe(el));
  }

  /* ── SMOOTH SCROLL ───────────────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ── MÁSCARA DE TELEFONE ─────────────────────────────────────── */
  function maskPhone(input) {
    input.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '').substring(0, 11);
      if (v.length >= 11)      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      else if (v.length >= 7)  v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})$/, '($1) $2-$3');
      else if (v.length >= 3)  v = v.replace(/^(\d{2})(\d+)$/, '($1) $2');
      else if (v.length >= 1)  v = v.replace(/^(\d+)$/, '($1');
      this.value = v;
    });
  }

  /* ── VALIDAÇÃO FORMULÁRIO ────────────────────────────────────── */
  function showError(input, msg) {
    input.classList.add('is-invalid');
    const err = input.closest('.form-group')?.querySelector('.form-error');
    if (err) err.textContent = msg;
  }
  function clearError(input) {
    input.classList.remove('is-invalid');
    const err = input.closest('.form-group')?.querySelector('.form-error');
    if (err) err.textContent = '';
  }

  function validateForm(form) {
    let ok = true;

    const nome = form.querySelector('#nome');
    if (!nome.value.trim() || nome.value.trim().length < 3) {
      showError(nome, 'Informe seu nome completo.'); ok = false;
    } else clearError(nome);

    const wpp = form.querySelector('#whatsapp');
    if ((wpp.value.replace(/\D/g,'')).length < 10) {
      showError(wpp, 'Informe um WhatsApp válido com DDD.'); ok = false;
    } else clearError(wpp);

    const checked = form.querySelector('input[name="queixa"]:checked');
    const qErr = document.getElementById('queixaError');
    if (!checked) {
      if (qErr) qErr.textContent = 'Selecione sua principal queixa.'; ok = false;
    } else {
      if (qErr) qErr.textContent = '';
    }

    return ok;
  }

  /* ── ENVIO FORMULÁRIO ────────────────────────────────────────── */
  function initForm() {
    const form = document.getElementById('leadForm');
    if (!form) return;

    const submitBtn   = document.getElementById('submitBtn');
    const btnText     = document.getElementById('btnText');
    const btnSpinner  = document.getElementById('btnSpinner');
    const btnArrow    = document.getElementById('btnArrow');
    const formSuccess = document.getElementById('formSuccess');

    form.querySelectorAll('.form-input').forEach(inp => {
      inp.addEventListener('input', () => clearError(inp));
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validateForm(form)) return;

      submitBtn.disabled = true;
      btnText.textContent = 'Enviando…';
      btnSpinner.style.display = 'block';
      if (btnArrow) btnArrow.style.display = 'none';

      fetch('pixel.php', {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
        .then(r => { if (!r.ok) throw new Error('Erro de rede'); return r.json(); })
        .then(data => {
          if (data.success) {
            if (typeof fbq !== 'undefined') {
              fbq('track', 'Lead', {
                content_name: 'Avaliacao_Medica',
                content_category: new FormData(form).get('queixa') || 'geral',
              });
            }
            window.location.href = 'obrigado/';
          } else throw new Error(data.message || 'Falha.');
        })
        .catch(() => {
          btnText.textContent = 'Enviar e solicitar agendamento';
          btnSpinner.style.display = 'none';
          if (btnArrow) btnArrow.style.display = '';
          submitBtn.disabled = false;

          const prev = form.querySelector('.submit-error');
          if (prev) prev.remove();
          const alert = document.createElement('p');
          alert.className = 'submit-error form-error';
          alert.setAttribute('role', 'alert');
          alert.style.textAlign = 'center';
          alert.style.marginTop = '.75rem';
          alert.textContent = 'Não foi possível enviar. Tente pelo WhatsApp.';
          submitBtn.insertAdjacentElement('afterend', alert);
        });
    });
  }

  /* ── FOOTER YEAR ─────────────────────────────────────────────── */
  function setYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── CURSOR SPOTLIGHT em seções escuras (opcional bônus) ─────── */
  function initSpotlight() {
    if (window.matchMedia('(hover:none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

    const darkSections = document.querySelectorAll('.section-stacked-dark, .section-hero, .section-about');

    darkSections.forEach(sec => {
      const spotlight = document.createElement('div');
      spotlight.style.cssText = `
        position:absolute;pointer-events:none;z-index:0;
        width:500px;height:500px;border-radius:50%;
        background:radial-gradient(circle,rgba(14,165,233,.10) 0%,transparent 65%);
        transform:translate(-50%,-50%);
        transition:opacity .4s;opacity:0;
      `;
      sec.style.position = 'relative';
      sec.appendChild(spotlight);

      sec.addEventListener('mousemove', e => {
        const r = sec.getBoundingClientRect();
        spotlight.style.left = (e.clientX - r.left) + 'px';
        spotlight.style.top  = (e.clientY - r.top) + 'px';
        spotlight.style.opacity = '1';
      }, { passive: true });

      sec.addEventListener('mouseleave', () => { spotlight.style.opacity = '0'; });
    });
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  function init() {
    generateCSRF();
    setYear();

    const wpp = document.getElementById('whatsapp');
    if (wpp) maskPhone(wpp);

    initReveal();
    initCounters();
    initSmoothScroll();
    initForm();

    /* Efeitos visuais pesados — só no idle e em desktop */
    const heavy = () => {
      init3DTilt();
      initMagnetic();
      initParallax();
      initSpotlight();
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(heavy, { timeout: 1500 });
    } else {
      setTimeout(heavy, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
