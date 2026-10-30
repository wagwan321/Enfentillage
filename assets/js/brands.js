/* ==========================================================================
   Enfantillage — all brands A–Z
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { BRANDS, colorVars, brandLogo, esc, shopUrl, observeReveals } = window.ENF;
  const $ = s => document.querySelector(s);

  const letterOf = b => {
    const ch = b.name.normalize('NFD').replace(/[̀-ͯ]/g, '')[0].toUpperCase();
    return /[A-Z]/.test(ch) ? ch : '#';
  };
  const sorted = [...BRANDS].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  const letters = [...new Set(sorted.map(letterOf))];

  $('#brandsSub').textContent = `All ${BRANDS.length} brands we carry, from A to Z`;
  $('#az').innerHTML = letters.map(l => `<a href="#letter-${l === '#' ? 'num' : l}">${l}</a>`).join('');

  const tile = b => `
    <a class="brand-tile${b.logo ? ' has-logo' : ''}" style="${colorVars(b.color)}" href="${shopUrl({ brand: b.key })}" data-name="${esc(b.name.toLowerCase())}">
      <span class="brand-tile__mark">${b.logo ? brandLogo(b, 'brand-tile__logo') : `<span class="brand-tile__name">${esc(b.name)}</span>`}</span>
      <small>${b.logo ? esc(b.name) + ' · ' : ''}${b.n} ${b.n === 1 ? 'toy' : 'toys'}</small>
    </a>`;

  $('#brandGroups').innerHTML = letters.map(l => `
    <section class="brand-group" id="letter-${l === '#' ? 'num' : l}">
      <h2 class="brand-group__letter">${l}</h2>
      <div class="brand-grid">${sorted.filter(b => letterOf(b) === l).map(tile).join('')}</div>
    </section>`).join('') + '<p class="brands-empty" id="brandsEmpty" hidden>No brand matches that name. Try the search at the top of the page to look for toys instead.</p>';

  $('#brandSearch').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    let any = false;
    document.querySelectorAll('.brand-group').forEach(g => {
      let shown = 0;
      g.querySelectorAll('.brand-tile').forEach(t => {
        const hit = !q || t.dataset.name.includes(q);
        t.hidden = !hit; if (hit) shown++;
      });
      g.hidden = !shown; if (shown) any = true;
    });
    $('#brandsEmpty').hidden = any;
  });

  observeReveals();
});
