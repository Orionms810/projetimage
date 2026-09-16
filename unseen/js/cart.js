/* ===========================================================
   UNSEEN — panier partagé par toutes les pages
   Injecte le tiroir, gère localStorage, quantités et total.
   =========================================================== */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'unseen.cart';

  /* ---------- tiroir ---------- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="cart__veil" id="cartVeil" hidden></div>
    <aside class="cart" id="cart" aria-labelledby="cartTitle" aria-hidden="true">
      <header class="cart__head">
        <h2 id="cartTitle">Ton panier</h2>
        <button class="cart__close" type="button" id="cartClose" aria-label="Fermer le panier">&#215;</button>
      </header>
      <ul class="cart__list" id="cartList"></ul>
      <p class="cart__empty" id="cartEmpty">Ton panier est vide.<br><span>桜の力 — choisis une pièce.</span></p>
      <footer class="cart__foot">
        <div class="cart__total"><span>Total</span><strong id="cartTotal">0 €</strong></div>
        <button class="btn btn--fill cart__pay" type="button" id="cartPay">Commander</button>
        <p class="cart__note" id="cartNote">Livraison offerte dès 100 € — retours 30 jours.</p>
      </footer>
    </aside>
    <div class="bag" id="bag" role="status" aria-live="polite">
      <span class="bag__dot"></span><span id="bagTxt">Panier (0)</span>
    </div>`);

  const cart = $('#cart'), veil = $('#cartVeil'), list = $('#cartList'),
        vide = $('#cartEmpty'), total = $('#cartTotal'), note = $('#cartNote'),
        bag = $('#bag'), bagTxt = $('#bagTxt');
  let items = [], toast, lastFocus = null;

  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { items = []; }
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) {} };

  const flash = txt => {
    bagTxt.textContent = txt;
    bag.classList.add('is-on');
    clearTimeout(toast);
    toast = setTimeout(() => bag.classList.remove('is-on'), 3000);
  };

  const draw = () => {
    const n = items.reduce((s, i) => s + i.qty, 0);
    const somme = items.reduce((s, i) => s + i.qty * i.price, 0);
    $$('.bagbtn__n').forEach(e => e.textContent = n);
    total.textContent = somme + ' €';
    vide.hidden = items.length > 0;
    note.textContent = items.length
      ? (somme >= 100 ? 'Livraison offerte — retours 30 jours.'
                      : `Plus que ${100 - somme} € pour la livraison offerte.`)
      : 'Livraison offerte dès 100 € — retours 30 jours.';
    list.innerHTML = items.map((i, k) => `
      <li class="cart__row">
        <img src="${i.img}" alt="">
        <div>
          <p class="cart__name">${i.name}</p>
          <p class="cart__meta">Taille ${i.size}</p>
          <div class="cart__qty">
            <button type="button" data-act="minus" data-k="${k}" aria-label="Retirer un exemplaire">−</button>
            <span>${i.qty}</span>
            <button type="button" data-act="plus" data-k="${k}" aria-label="Ajouter un exemplaire">+</button>
          </div>
        </div>
        <div class="cart__side">
          <span class="cart__price">${i.qty * i.price} €</span>
          <button class="cart__del" type="button" data-act="del" data-k="${k}">Retirer</button>
        </div>
      </li>`).join('');
    store();
  };

  const open = () => {
    lastFocus = document.activeElement;
    veil.hidden = false;
    requestAnimationFrame(() => veil.classList.add('is-on'));
    cart.classList.add('is-open');
    cart.setAttribute('aria-hidden', 'false');
    $$('.bagbtn').forEach(b => b.setAttribute('aria-expanded', 'true'));
    $('#cartClose').focus();
  };
  const close = () => {
    veil.classList.remove('is-on');
    setTimeout(() => { veil.hidden = true; }, 450);
    cart.classList.remove('is-open');
    cart.setAttribute('aria-hidden', 'true');
    $$('.bagbtn').forEach(b => b.setAttribute('aria-expanded', 'false'));
    lastFocus?.focus();
  };

  $$('.bagbtn').forEach(b => b.addEventListener('click',
    () => cart.classList.contains('is-open') ? close() : open()));
  $('#cartClose').addEventListener('click', close);
  veil.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && cart.classList.contains('is-open')) close(); });

  list.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const k = +b.dataset.k;
    if (b.dataset.act === 'plus')  items[k].qty++;
    if (b.dataset.act === 'minus') items[k].qty > 1 ? items[k].qty-- : items.splice(k, 1);
    if (b.dataset.act === 'del')   items.splice(k, 1);
    draw();
  });

  $('#cartPay').addEventListener('click', () => {
    if (!items.length) { flash('Ton panier est vide'); return; }
    const n = items.reduce((s, i) => s + i.qty, 0);
    note.textContent = `Commande de ${n} pièce${n > 1 ? 's' : ''} — le paiement arrive bientôt.`;
  });

  /* ---------- API pour les pages ---------- */
  window.PANIER = {
    ajouter({ name, size, price, img, qty = 1 }) {
      const trouve = items.find(i => i.name === name && i.size === size);
      trouve ? (trouve.qty += qty) : items.push({ name, size, price, img, qty });
      draw();
      $$('.bagbtn').forEach(b => {
        b.classList.add('is-pop');
        setTimeout(() => b.classList.remove('is-pop'), 400);
      });
      flash(`${name} · ${size} — ajouté`);
      open();
    },
    message: flash,
    ouvrir: open
  };

  draw();
})();
