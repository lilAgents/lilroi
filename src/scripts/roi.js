// lilROI: turn ad spend and funnel rates into leads, customers, revenue,
// and the headline ratios (CPL, CPA, ROAS, ROI). All math runs locally.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- theme (OS-aware, matches the family) ---------- */
const MOON_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
const SUN_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4"/></g></svg>';

function setThemeIcon(btn, theme) {
  if (theme === 'dark') { btn.innerHTML = SUN_SVG; btn.setAttribute('aria-label', 'Switch to light mode'); }
  else { btn.innerHTML = MOON_SVG; btn.setAttribute('aria-label', 'Switch to dark mode'); }
}
function initTheme() {
  const btn = $('#ui-theme-btn');
  const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  setThemeIcon(btn, current());
  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('lilroi-theme', next); } catch (e) { /* storage may be unavailable; safe to ignore */ }
    setThemeIcon(btn, next);
  });
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const state = { sym: '$' };

const num = (id) => {
  const v = parseFloat($('#' + id).value);
  return isNaN(v) ? null : v;
};
function money(n) {
  if (n === null || !isFinite(n)) return 'n/a';
  return state.sym + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function whole(n) {
  if (n === null || !isFinite(n)) return 'n/a';
  return Math.round(n).toLocaleString();
}
function pct(n) {
  if (n === null || !isFinite(n)) return 'n/a';
  return (n >= 0 ? '+' : '') + n.toLocaleString(undefined, { maximumFractionDigits: 0 }) + '%';
}
function ratio(n) {
  if (n === null || !isFinite(n)) return 'n/a';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'x';
}

const BLOG = 'https://lilagents.com/blog/how-to-calculate-marketing-roi';

/* ---------- render ---------- */
function tile(label, value, sub, kind) {
  return `<div class="mg-tile${kind ? ' mg-tile--' + kind : ''}">
    <div class="mg-tile-v">${esc(value)}</div>
    <div class="mg-tile-l">${esc(label)}</div>
    ${sub ? `<div class="mg-tile-s">${esc(sub)}</div>` : ''}
  </div>`;
}

function cta() {
  return `<a class="roi-cta" href="${BLOG}" target="_blank">
    <span class="roi-cta-t"><strong>Want the method behind the math?</strong> Read how to calculate marketing ROI.</span>
    <span class="roi-cta-a" aria-hidden="true">&rarr;</span>
  </a>`;
}

function render() {
  const spend = num('f-spend');
  const cpc = num('f-cpc');
  const v2l = num('f-v2l');
  const l2c = num('f-l2c');
  const val = num('f-val');
  const box = $('#results');

  const ready = spend !== null && cpc !== null && v2l !== null && l2c !== null && val !== null && cpc > 0;
  if (!ready) {
    box.innerHTML = `<div class="mg-empty">
      <p class="mg-empty-big">Your funnel adds up here</p>
      <p class="mg-empty-sub">Fill in spend, cost per click, your two conversion rates, and the value of a customer to see leads, customers, revenue, and ROI.${cpc === 0 ? ' Cost per click has to be above zero.' : ''}</p>
    </div>${cta()}`;
    return;
  }

  const clicks = spend / cpc;
  const leads = clicks * (v2l / 100);
  const customers = leads * (l2c / 100);
  const revenue = customers * val;
  const profit = revenue - spend;
  const cpl = leads > 0 ? spend / leads : Infinity;
  const cpa = customers > 0 ? spend / customers : Infinity;
  const roas = spend > 0 ? revenue / spend : Infinity;
  const roi = spend > 0 ? (profit / spend) * 100 : Infinity;

  const funnel =
    tile('Clicks', whole(clicks), money(cpc) + ' each') +
    tile('Leads', whole(leads), v2l + '% of clicks') +
    tile('Customers', whole(customers), l2c + '% of leads');

  const moneyTiles =
    tile('Revenue', money(revenue), money(val) + ' per customer', 'accent') +
    tile(profit >= 0 ? 'Profit over spend' : 'Loss vs spend', money(profit), 'revenue minus ad spend', profit >= 0 ? 'good' : 'bad');

  const ratios =
    tile('Cost per lead', money(cpl), 'spend ÷ leads') +
    tile('Cost per customer', money(cpa), 'spend ÷ customers') +
    tile('ROAS', ratio(roas), 'revenue ÷ spend') +
    tile('ROI', pct(roi), 'profit ÷ spend');

  let verdict = '';
  if (isFinite(roas)) {
    const good = roi >= 0;
    verdict = `<div class="roi-verdict roi-verdict--${good ? 'good' : 'bad'}">Every ${money(1)} of ad spend brings back <strong>${money(roas)}</strong>. ${good ? `That is a ${pct(roi)} return before product and labor costs.` : `That loses money: a ${pct(roi)} return. Lift a conversion rate or customer value to turn it around.`}</div>`;
  }

  box.innerHTML = `
    <div class="roi-section-h">Funnel</div>
    <div class="mg-grid mg-grid--3">${funnel}</div>
    <div class="roi-section-h">Money</div>
    <div class="mg-grid">${moneyTiles}</div>
    <div class="roi-section-h">Efficiency</div>
    <div class="mg-grid">${ratios}</div>
    ${verdict}
    ${cta()}`;
}

/* ---------- wire-up ---------- */
function initRoi() {
  initTheme();

  ['f-spend', 'f-cpc', 'f-v2l', 'f-l2c', 'f-val'].forEach((id) => $('#' + id).addEventListener('input', render));
  $('#f-sym').addEventListener('input', () => {
    state.sym = $('#f-sym').value || '$';
    $('#sym-spend').textContent = state.sym;
    $('#sym-cpc').textContent = state.sym;
    $('#sym-val').textContent = state.sym;
    render();
  });

  $('#example-btn').addEventListener('click', () => {
    $('#f-spend').value = '3000';
    $('#f-cpc').value = '2.50';
    $('#f-v2l').value = '5';
    $('#f-l2c').value = '20';
    $('#f-val').value = '600';
    render();
  });
  $('#clear-btn').addEventListener('click', () => {
    ['f-spend', 'f-cpc', 'f-v2l', 'f-l2c', 'f-val'].forEach((id) => { $('#' + id).value = ''; });
    render();
  });

  render();
}

export { initRoi };
