/* AI Scripts Library: progressive enhancement of editable local templates. */
(() => {
  'use strict';
  const form = document.getElementById('script-filters');
  if (!form) return;
  const search = document.getElementById('script-search');
  const kind = document.getElementById('script-kind');
  const recommended = document.getElementById('script-recommended');
  const count = document.getElementById('script-count');
  const random = document.getElementById('script-random');
  const empty = document.getElementById('script-empty');
  const cards = [...document.querySelectorAll('[data-script]')];
  const searchable = new Map(cards.map(card => [card, card.textContent.toLocaleLowerCase()]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function visibleCards() {
    return cards.filter(card => !card.hidden);
  }

  function update() {
    const query = search.value.trim().toLocaleLowerCase();
    cards.forEach(card => {
      card.hidden = !((!query || searchable.get(card).includes(query)) &&
        (kind.value === 'all' || card.dataset.kind === kind.value) &&
        (!recommended.checked || card.dataset.recommended === 'true'));
    });
    const shown = visibleCards().length;
    count.textContent = `Showing ${shown} of ${cards.length} templates`;
    empty.hidden = shown !== 0;
    random.disabled = shown === 0;
  }

  function reset() {
    search.value = '';
    kind.value = 'all';
    recommended.checked = false;
    update();
    search.focus();
  }

  form.hidden = false;
  random.hidden = false;
  cards.forEach(card => { card.querySelector('details').open = false; });
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('reset', event => { event.preventDefault(); reset(); });
  document.getElementById('script-reset').addEventListener('click', reset);
  random.addEventListener('click', () => {
    const candidates = visibleCards();
    if (!candidates.length) return;
    const card = candidates[Math.floor(Math.random() * candidates.length)];
    const details = card.querySelector('details');
    details.open = true;
    card.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
    details.querySelector('summary').focus({ preventScroll: true });
  });

  cards.forEach(card => {
    const button = card.querySelector('[data-copy]');
    const template = document.getElementById(button.dataset.copy);
    const status = card.querySelector('[data-copy-status]');
    button.hidden = false;
    button.addEventListener('click', async () => {
      const text = template.textContent.trim();
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        status.textContent = 'Template copied. Paste it into your preferred assistant and edit the bracketed details.';
      } catch {
        card.querySelector('details').open = true;
        template.focus({ preventScroll: true });
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(template);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        status.textContent = 'Copy was unavailable. The template text is selected; press Ctrl+C or Command+C, or use your device’s Copy action.';
      }
    });
  });
  update();
})();
