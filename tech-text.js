/* TechText canvas adaptation from the user-supplied React Bits component,
 * © 2026 David Haz. The real HTML heading remains accessible and readable
 * without scripting, canvas support, or animation.
 * Full source notice: /assets/react-bits-LICENSE.txt. */
(() => {
  'use strict';

  const heading = document.querySelector('[data-tech-text]');
  const canvas = heading?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!heading || !canvas || !ctx) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)');
  const text = heading.dataset.techText;
  const chars = Array.from(text);
  const padX = 12;
  const padY = 18;
  const accent = '#55dfc5';
  const ink = '#edf4f2';
  let glyphs = [];
  let active = -1;
  let pointerInside = false;
  let visible = false;
  let sweepDone = false;
  let raf = 0;
  let sweepStart = 0;
  let dpr = 1;
  let fontSize = 0;

  const font = (style, size) => `${style.fontWeight} ${size}px ${style.fontFamily}`;
  const setFont = (style, size) => {
    ctx.font = font(style, size);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  };

  function layout() {
    if (motion.matches) return;
    const style = getComputedStyle(heading);
    const width = Math.max(1, heading.clientWidth);
    const height = Math.max(1, heading.clientHeight);
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.ceil((width + padX * 2) * dpr);
    canvas.height = Math.ceil((height + padY * 2) * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let size = parseFloat(style.fontSize);
    const spacing = parseFloat(style.letterSpacing) || 0;
    setFont(style, size);
    const measure = () => chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) + spacing * (chars.length - 1);
    const measured = measure();
    if (measured > width - 2) {
      size *= (width - 2) / measured;
      setFont(style, size);
    }
    fontSize = size;

    const metrics = ctx.measureText(text);
    const ascent = metrics.actualBoundingBoxAscent || size * .76;
    const descent = metrics.actualBoundingBoxDescent || size * .2;
    const baseline = padY + (height + ascent - descent) / 2;
    let x = padX;
    glyphs = chars.map(char => {
      const m = ctx.measureText(char);
      const glyph = {
        char,
        x,
        baseline,
        x1: x - (m.actualBoundingBoxLeft || 0),
        x2: x + (m.actualBoundingBoxRight || m.width),
        y1: baseline - (m.actualBoundingBoxAscent || ascent),
        y2: baseline + (m.actualBoundingBoxDescent || descent)
      };
      x += m.width + spacing;
      return glyph;
    });
    draw();
    heading.classList.add('tech-text-ready');
    heading.dataset.techTextState = active < 0 ? 'idle' : 'active';
  }

  function draw() {
    if (motion.matches || !glyphs.length) return;
    const style = getComputedStyle(heading);
    setFont(style, fontSize);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    glyphs.forEach((g, i) => {
      if (!g.char.trim()) return;
      if (i === active) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.setLineDash([4, 2]);
        ctx.strokeText(g.char, g.x, g.baseline);
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = ink;
        ctx.fillText(g.char, g.x, g.baseline);
      }
    });

    const g = glyphs[active];
    if (!g) return;
    const x1 = Math.round(g.x1 - 6) + .5;
    const x2 = Math.round(g.x2 + 6) + .5;
    const y1 = Math.round(g.y1 - 6) + .5;
    const y2 = Math.round(g.y2 + 6) + .5;
    ctx.strokeStyle = 'rgba(85,223,197,.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.fillStyle = accent;
    for (const [x, y] of [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]) ctx.fillRect(x - 2, y - 2, 4, 4);

    // Seeded squares echo TechText's selection specks without a permanent RAF.
    for (let i = 0; i < 7; i++) {
      const seed = ((active + 1) * 43 + i * 97) % 101;
      const x = x1 + (seed / 101) * (x2 - x1);
      const y = i % 2 ? y1 - 5 - (i % 3) * 3 : y2 + 5 + (i % 3) * 3;
      ctx.fillStyle = `rgba(85,223,197,${.25 + (seed % 5) * .11})`;
      ctx.fillRect(Math.round(x), Math.round(y), i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
    }
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(85,223,197,.75)';
    ctx.fillText(`${g.char}  ${Math.round(g.x2 - g.x1)} × ${Math.round(g.y2 - g.y1)}`, x1, Math.max(10, y1 - 7));
  }

  const setActive = index => {
    active = index;
    heading.dataset.techTextState = index < 0 ? 'idle' : 'active';
    heading.dataset.techTextLetter = index < 0 ? '' : glyphs[index]?.char || '';
    draw();
  };

  const stopSweep = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    sweepDone = true;
  };

  const nearest = clientX => {
    const x = clientX - heading.getBoundingClientRect().left + padX;
    let best = -1;
    let distance = Infinity;
    glyphs.forEach((g, i) => {
      if (!g.char.trim()) return;
      const d = x < g.x1 ? g.x1 - x : x > g.x2 ? x - g.x2 : 0;
      if (d < distance) { distance = d; best = i; }
    });
    return best;
  };

  heading.addEventListener('pointermove', e => {
    if (motion.matches || e.pointerType === 'touch') return;
    pointerInside = true;
    if (raf) stopSweep();
    setActive(nearest(e.clientX));
  }, {passive: true});
  heading.addEventListener('pointerleave', () => {
    pointerInside = false;
    if (document.activeElement !== heading) setActive(-1);
  }, {passive: true});
  heading.addEventListener('pointerdown', e => {
    if (motion.matches || e.pointerType !== 'touch') return;
    if (raf) stopSweep();
    setActive(nearest(e.clientX));
  }, {passive: true});
  heading.addEventListener('pointerup', e => {
    if (e.pointerType === 'touch' && document.activeElement !== heading) setActive(-1);
  }, {passive: true});
  heading.addEventListener('focus', () => {
    if (!motion.matches) {
      if (raf) stopSweep();
      setActive(glyphs.findIndex(g => g.char.trim()));
    }
  });
  heading.addEventListener('blur', () => { if (!pointerInside) setActive(-1); });
  heading.addEventListener('keydown', e => {
    if (motion.matches || !['ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Escape') { setActive(-1); return; }
    const letters = glyphs.map((g,i)=>g.char.trim()?i:-1).filter(i=>i>=0);
    if (!letters.length) return;
    const at = Math.max(0, letters.indexOf(active));
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? letters.length - 1 :
      e.key === 'ArrowRight' ? (at + 1) % letters.length : (at - 1 + letters.length) % letters.length;
    setActive(letters[next]);
  });

  const sweep = now => {
    raf = 0;
    if (!visible || motion.matches || pointerInside || document.hidden) return;
    if (!sweepStart) sweepStart = now;
    const progress = Math.min(1, (now - sweepStart) / 1800);
    const letters = glyphs.map((g,i)=>g.char.trim()?i:-1).filter(i=>i>=0);
    if (progress < 1 && letters.length) {
      setActive(letters[Math.min(letters.length - 1, Math.floor(progress * letters.length))]);
      raf = requestAnimationFrame(sweep);
    } else { sweepDone = true; setActive(-1); }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !sweepDone && !motion.matches && !raf) raf = requestAnimationFrame(sweep);
      if (!visible && raf) { stopSweep(); setActive(-1); }
    }, {threshold: .4});
    observer.observe(heading);
  } else { visible = true; sweepDone = true; }
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(heading);
  else addEventListener('resize', layout);
  document.fonts?.ready.then(layout);
  motion.addEventListener('change', () => {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (motion.matches) {
      heading.classList.remove('tech-text-ready');
      heading.removeAttribute('tabindex');
      heading.dataset.techTextState = 'reduced';
    } else {
      heading.tabIndex = 0;
      layout();
    }
  });
  if (!motion.matches) { heading.tabIndex = 0; layout(); }
  else heading.dataset.techTextState = 'reduced';
})();
