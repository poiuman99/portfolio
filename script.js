/* ---------- 1. Filter op school / werk / scouts ---------- */
const buttons = document.querySelectorAll('.tabs button');
const items = document.querySelectorAll('.item');

function setFilter(f) {
  buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.f === f));
  items.forEach(i => { i.hidden = !(f === 'all' || i.dataset.cat === f); });
  updateTrail();
}

buttons.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.f)));

// Klikken op een regel in het code-venster filtert de tijdlijn
document.querySelectorAll('.code a').forEach(a =>
  a.addEventListener('click', () => setFilter(a.dataset.f))
);

/* ---------- 2. Het pad groeit mee met het scrollen ---------- */
const trail = document.getElementById('trail');
let ticking = false;

function updateTrail() {
  const r = trail.getBoundingClientRect();
  const reached = window.innerHeight * 0.6 - r.top;      // hoever het pad gelezen is
  const p = Math.min(1, Math.max(0, reached / r.height));
  trail.style.setProperty('--p', p.toFixed(3));
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(updateTrail); ticking = true; }
}, { passive: true });
window.addEventListener('resize', updateTrail);
updateTrail();

/* ---------- 3. Licht / donker thema ---------- */
const root = document.documentElement;
const themeBtn = document.getElementById('theme');

try {
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
} catch (e) { /* opslag niet beschikbaar: negeren */ }

themeBtn.addEventListener('click', () => {
  const dark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
});

/* ---------- 4. Voor de nieuwsgierige developer ---------- */
console.log('%cHey dev 👋', 'font:700 18px sans-serif;color:#E3A82B',
  '\nBenieuwd naar de code? Kijk in script.js. Zin om samen iets te bouwen? Stuur me een bericht.');

/* ---------- 5. Project-popup (groeit uit het vakje) ---------- */
const modal = document.getElementById('modal');
const modalBody = modal.querySelector('.modal-body');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let originCard = null;

// Transform die de popup op de plek en grootte van het vakje zet
function fromCardTransform(card) {
  const from = card.getBoundingClientRect();
  const to = modal.getBoundingClientRect();
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) ` +
         `scale(${from.width / to.width}, ${from.height / to.height})`;
}

function openProject(card) {
  originCard = card;
  modalBody.innerHTML =
    `<h3 id="modal-title">${card.querySelector('.card-open').textContent}</h3>` +
    card.querySelector('.detail').innerHTML;

  document.body.classList.add('no-scroll');
  modal.showModal();
  modal.showModal();
  modal.scrollTop = 0;
  if (reduceMotion.matches) return;

  modal.animate(
    [{ transform: fromCardTransform(card), opacity: 0.4 }, { transform: 'none', opacity: 1 }],
    { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' }
  );
  // De tekst verschijnt pas als het vakje bijna op grootte is (voorkomt uitgerekte tekst)
  modalBody.animate([{ opacity: 0 }, { opacity: 1 }],
    { duration: 250, delay: 200, fill: 'backwards' });
}

async function closeProject() {
  if (!modal.open) return;
  modal.classList.add('closing');

  if (!reduceMotion.matches && originCard) {
    const fade = modalBody.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: 120, fill: 'forwards' });
    const shrink = modal.animate(
      [{ transform: 'none', opacity: 1 }, { transform: fromCardTransform(originCard), opacity: 0.4 }],
      { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
    );
    await shrink.finished;
    modal.close();
    shrink.cancel(); fade.cancel();   // anders blijft de eindstand de volgende keer hangen
  } else {
    modal.close();
  }

  modal.classList.remove('closing');
  document.body.classList.remove('no-scroll');
  originCard?.querySelector('.card-open').focus();
}

document.querySelectorAll('.card').forEach(card =>
  card.querySelector('.card-open').addEventListener('click', () => openProject(card))
);
modal.querySelector('.modal-close').addEventListener('click', closeProject);
modal.addEventListener('click', e => { if (e.target === modal) closeProject(); }); // klik naast de popup
modal.addEventListener('cancel', e => { e.preventDefault(); closeProject(); });    // Esc-toets