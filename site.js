/* S4S Fitness — site behaviour */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- Cookie consent + Meta Pixel ----------------------------------------
     The Pixel only loads after the visitor taps "Accept". Choice is remembered
     in this browser; "Cookie settings" in the footer reopens the banner. */
  const PIXEL_ID = "28189866387382186";
  const GA_ID = "G-05LTRX5VJL";        // Google Analytics 4 measurement ID (G-XXXXXXX)
  const CONSENT_KEY = "s4s_consent";
  const store = {
    get(k, area = localStorage) { try { return area.getItem(k); } catch (e) { return null; } },
    set(k, v, area = localStorage) { try { area.setItem(k, v); } catch (e) {} },
    del(k, area = localStorage) { try { area.removeItem(k); } catch (e) {} }
  };
  let pixelOn = false;
  function loadPixel() {
    if (pixelOn) return; pixelOn = true;
    /* Meta's standard base code */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq("init", PIXEL_ID);
    fbq("track", "PageView");
    loadGA();
    pageEvents();
  }
  /* Google Analytics 4: also only after "Accept" */
  function loadGA() {
    if (!GA_ID || window.gtag) return;
    const t = document.createElement("script"); t.async = true;
    t.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(t);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", GA_ID);
  }
  const GA_ITEM = (q, ids) => (ids && ids.length ? ids : ["hoodie"]).map(id => ({ item_id: id, quantity: ids && ids.length ? 1 : (q || 1) }));
  function gaEvent(name, data, opts) {
    if (!window.gtag) return;
    const d = data || {};
    if (name === "ViewContent") gtag("event", "view_item", { currency: "GBP", value: d.value, items: GA_ITEM(1, d.content_ids) });
    if (name === "AddToCart") gtag("event", "add_to_cart", { currency: "GBP", value: d.value, items: GA_ITEM(1, d.content_ids) });
    if (name === "InitiateCheckout") gtag("event", "begin_checkout", { currency: "GBP", value: d.value, items: GA_ITEM(d.num_items, d.content_ids) });
    if (name === "Purchase") gtag("event", "purchase", { currency: "GBP", value: d.value, transaction_id: (opts && opts.eventID) || undefined, items: GA_ITEM(d.num_items, d.content_ids) });
  }
  // fire an event only if the visitor has consented
  const track = (name, data, opts) => {
    if (!pixelOn) return;
    if (window.fbq) fbq("track", name, data || {}, opts || {});
    gaEvent(name, data, opts);
  };

  function pageEvents() {
    const bb = $("#buybox");
    if (bb) track("ViewContent", { content_ids: [bb.dataset.product], content_name: bb.dataset.name, content_type: "product", value: +bb.dataset.price, currency: "GBP" });
    if (/order-confirmed/.test(location.pathname)) {
      const sid = new URLSearchParams(location.search).get("session_id") || "";
      let order = null; try { order = JSON.parse(store.get("s4s_pending", sessionStorage) || "null"); } catch (e) {}
      const done = store.get("s4s_tracked_" + sid);
      if (order && sid && !done) {
        track("Purchase", { value: order.value, currency: "GBP", content_ids: order.ids || ["hoodie"], content_type: "product", num_items: order.qty },
              { eventID: sid });
        store.set("s4s_tracked_" + sid, "1");
      }
      store.del("s4s_pending", sessionStorage);
    }
  }

  function consentBanner() {
    const box = document.createElement("div");
    box.className = "consent"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Cookie choice");
    box.innerHTML = '<p><b>Cookies.</b> We use Google Analytics and Meta (Facebook/Instagram) cookies to see how people find and use the site. It only switches on if you accept. <a href="privacy.html#cookies">More info</a></p>' +
      '<div class="consent-btns"><button type="button" class="btn btn-ghost" data-c="no">No thanks</button><button type="button" class="btn btn-primary" data-c="yes">Accept</button></div>';
    box.addEventListener("click", e => {
      const c = e.target.closest("[data-c]"); if (!c) return;
      store.set(CONSENT_KEY, c.dataset.c === "yes" ? "granted" : "denied");
      box.remove();
      if (c.dataset.c === "yes") loadPixel();
    });
    document.body.appendChild(box);
  }
  const consent = store.get(CONSENT_KEY);
  if (consent === "granted") loadPixel();
  else if (consent !== "denied") consentBanner();
  $$("[data-cookie-settings]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault(); store.del(CONSENT_KEY); if (!$(".consent")) consentBanner();
  }));

  /* ---- Mobile menu ---- */
  const menuBtn = $(".menu-btn"), nav = $(".nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") !== "true";
      menuBtn.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
    });
    $$("a", nav).forEach(a => a.addEventListener("click", () => {
      menuBtn.setAttribute("aria-expanded", "false"); nav.classList.remove("open");
    }));
  }

  /* ---- Year ---- */
  $$("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));

  /* ---- Products, basket + checkout ----------------------------------------
     Checkout runs on Stripe. Prices, stock and delivery are set on the server
     (netlify/functions/create-checkout.mjs) from stock.json. The figures here are
     a display copy so the basket can show totals before checkout. */
  const PRODUCTS = {  // fallback if stock.json can't be read
    hoodie: { name: "Perform-Fit Full Zip Hoodie", price: 34.99, units: 1, img: "img/graffiti-hands-on-hips-sm.jpg", url: "perform-fit-hoodie.html", sized: true },
    grips:  { name: "TAFFER Pro Lifting Grips", price: 49.99, units: 0.5, img: "https://cdn.shopify.com/s/files/1/0451/0525/products/untitleduntitled_shoot1603102-2.jpg?v=1571438815&width=200", url: "taffer-lifting-grips.html" },
    wraps:  { name: "TAFFER Wrist Wraps", price: 21.99, addon: 19.99, units: 0.5, img: "https://cdn.shopify.com/s/files/1/0451/0525/products/TAFFER_RANNETUET.jpg?v=1571438815&width=200", url: "taffer-wrist-wraps.html" },
    chalk:  { name: "Beast Liquid Chalk", price: 9.99, units: 0.5, ukOnly: true, img: "img/products/beast-liquid-chalk-sm.jpg", url: "beast-liquid-chalk.html" },
    kit:    { name: "The Training Kit", price: 94.99, units: 2, img: "img/graffiti-hands-on-hips-sm.jpg", url: "training-kit.html", sized: true, includes: ["hoodie", "grips", "wraps"] }
  };
  const SIZES = ["S", "M", "L", "XL", "XXL"];
  // Display copy of the delivery rates; keep in step with ZONES in the checkout function.
  const ZONES = {
    uk:     { name: "UK tracked delivery", first: 5.99, extra: 0, freeOver: 65, maxUnits: 20 },
    europe: { name: "Europe tracked delivery", first: 14.99, extra: 2, freeOver: null, maxUnits: 4 },
    world:  { name: "International tracked delivery", first: 25.99, extra: 4.99, freeOver: null, maxUnits: 4 }
  };
  const CHECKOUT = "/api/checkout";
  const money = n => "£" + n.toFixed(2);
  const live = /(^|\.)s4sfitness\.com$/.test(location.hostname) || /netlify\.app$/.test(location.hostname) ||
               /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const soldOut = new Set();   // "hoodie:M", "grips", ...
  const isOut = (id, size) => soldOut.has(id) || (size && soldOut.has("hoodie:" + size)) ||
                              (PRODUCTS[id].includes || []).some(x => soldOut.has(x));
  const stockReady = fetch("stock.json", { cache: "no-store" }).then(r => r.json()).then(st => {
    Object.entries(st.sizes || {}).forEach(([k, v]) => { if (!v) soldOut.add("hoodie:" + k); });
    Object.entries(st.products || {}).forEach(([id, p]) => {
      if (!PRODUCTS[id]) return;
      if (p.price_pence) PRODUCTS[id].price = p.price_pence / 100;
      if (p.addon_pence) PRODUCTS[id].addon = p.addon_pence / 100;
      if (p.in_stock === false) soldOut.add(id);
      PRODUCTS[id].low = !!p.low;
    });
  }).catch(() => {});

  /* basket: [{ id, size, qty }] kept in this browser */
  const cart = {
    items: (() => { try { return JSON.parse(store.get("s4s_cart") || "[]").filter(i => PRODUCTS[i.id]); } catch (e) { return []; } })(),
    region: store.get("s4s_region") || "uk",
    save() { store.set("s4s_cart", JSON.stringify(this.items)); store.set("s4s_region", this.region); drawCart(); },
    add(id, size, qty) {
      const hit = this.items.find(i => i.id === id && (i.size || "") === (size || ""));
      if (hit) hit.qty = Math.min(20, hit.qty + qty); else this.items.push({ id, size: size || "", qty });
      this.save();
    },
    count() { return this.items.reduce((a, i) => a + i.qty, 0); }
  };
  function totals() {
    const hoodies = cart.items.filter(i => i.id === "hoodie").reduce((a, i) => a + i.qty, 0);
    let sub = 0, units = 0, addonUsed = 0;
    const lines = cart.items.map(i => {
      const p = PRODUCTS[i.id]; let cost = p.price * i.qty, note = "";
      if (i.id === "wraps" && p.addon) {
        const n = Math.min(i.qty, hoodies - addonUsed); if (n > 0) { cost -= (p.price - p.addon) * n; addonUsed += n; note = "Add-on price with a hoodie"; }
      }
      sub += cost; units += p.units * i.qty;
      return { ...i, p, cost, note };
    });
    const z = ZONES[cart.region];
    const free = z.freeOver !== null && sub > z.freeOver;
    const ship = !lines.length ? 0 : free ? 0 : z.first + z.extra * Math.max(0, Math.ceil(units) - 1);
    let warn = "";
    if (units > z.maxUnits) warn = cart.region === "uk" ? "That's a big order. For more, use our team orders form." : "International parcels are limited to 4 hoodies (or 2 Training Kits).";
    const ukOnly = lines.find(l => l.p.ukOnly && cart.region !== "uk");
    if (ukOnly) warn = ukOnly.p.name + " can only be sent within the UK.";
    let shipLabel = free ? "Free " + z.name : z.name + " " + money(ship);
    if (!free && z.freeOver !== null && lines.length) shipLabel += " · free over £" + z.freeOver;
    if (cart.region !== "uk") shipLabel += ". Import charges may apply on delivery.";
    return { lines, sub, ship, total: sub + ship, shipLabel, warn, hoodies };
  }

  /* basket drawer (markup is in every page footer) */
  const drawer = $("#cart"), cartBtns = $$("[data-cart-open]");
  function openCart() { if (!drawer) return; drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add("open")); document.body.style.overflow = "hidden"; $(".cart-close", drawer).focus(); }
  function closeCart() { if (!drawer) return; drawer.classList.remove("open"); document.body.style.overflow = ""; setTimeout(() => (drawer.hidden = true), 250); }
  function drawCart(msg) {
    const n = cart.count();
    $$("[data-cart-count]").forEach(el => { el.textContent = n; el.hidden = !n; });
    if (!drawer) return;
    const t = totals(), list = $(".cart-lines", drawer);
    list.innerHTML = t.lines.length ? t.lines.map((l, k) => `
      <li>
        <a href="${l.p.url}"><img src="${l.p.img}" alt="" loading="lazy"></a>
        <div><a href="${l.p.url}"><b>${l.p.name}</b></a>${l.size ? `<span>Size ${l.size}</span>` : ""}${l.note ? `<span class="blue">${l.note}</span>` : ""}
          <div class="qty sm"><button type="button" data-k="${k}" data-d="-1" aria-label="One fewer">−</button><output>${l.qty}</output><button type="button" data-k="${k}" data-d="1" aria-label="One more">+</button></div>
        </div>
        <div class="cart-price"><b>${money(l.cost)}</b><button type="button" class="link-btn" data-rm="${k}">Remove</button></div>
      </li>`).join("") : `<li class="cart-empty">Your basket is empty. <a href="shop.html">Shop the range</a></li>`;
    $$(".region button", drawer).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.region === cart.region)));
    $(".cart-ship", drawer).textContent = t.lines.length ? t.shipLabel : "";
    $(".cart-total", drawer).textContent = money(t.total);
    // nudge: add-on wraps / free delivery
    const nudge = $(".cart-nudge", drawer);
    const hasWraps = cart.items.some(i => i.id === "wraps");
    if (t.hoodies && !hasWraps && !soldOut.has("wraps")) nudge.innerHTML = `Add TAFFER Wrist Wraps for ${money(PRODUCTS.wraps.addon || PRODUCTS.wraps.price)} with your hoodie <button type="button" class="link-btn" data-add="wraps">Add</button>`;
    else if (cart.region === "uk" && t.lines.length && t.sub <= 65) nudge.textContent = "Spend " + money(65.01 - t.sub) + " more for free UK delivery.";
    else nudge.textContent = "";
    const go = $(".cart-checkout", drawer);
    go.disabled = !t.lines.length || !!t.warn || cart.busy;
    go.textContent = cart.busy ? "Opening checkout…" : "Checkout · " + money(t.total);
    $(".cart-note", drawer).textContent = msg || t.warn || "";
  }
  if (drawer) {
    drawer.addEventListener("click", e => {
      if (e.target === drawer || e.target.closest(".cart-close")) return closeCart();
      const q = e.target.closest("[data-d]"), rm = e.target.closest("[data-rm]"), rg = e.target.closest("[data-region]"), ad = e.target.closest("[data-add]");
      if (q) { const it = cart.items[+q.dataset.k]; it.qty = Math.max(0, Math.min(20, it.qty + +q.dataset.d)); if (!it.qty) cart.items.splice(+q.dataset.k, 1); cart.save(); }
      if (rm) { cart.items.splice(+rm.dataset.rm, 1); cart.save(); }
      if (rg) { cart.region = rg.dataset.region; cart.save(); }
      if (ad) { cart.add(ad.dataset.add, "", 1); track("AddToCart", { content_ids: [ad.dataset.add], value: PRODUCTS[ad.dataset.add].addon || PRODUCTS[ad.dataset.add].price, currency: "GBP" }); }
    });
    $(".cart-checkout", drawer).addEventListener("click", checkout);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) closeCart(); });
  }
  cartBtns.forEach(b => b.addEventListener("click", e => { e.preventDefault(); openCart(); }));

  async function checkout() {
    if (!cart.items.length) return;
    if (!live) { drawCart("Checkout opens once the site is live on s4sfitness.com."); return; }
    cart.busy = true; drawCart();
    try {
      const r = await fetch(CHECKOUT, { method: "POST", headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ region: cart.region, items: cart.items }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) {
        const value = d.value || totals().total, num = cart.count();
        store.set("s4s_pending", JSON.stringify({ value, qty: num, ids: cart.items.map(i => i.id) }), sessionStorage);
        track("InitiateCheckout", { value, currency: "GBP", content_ids: cart.items.map(i => i.id), content_type: "product", num_items: num });
        location.href = d.url; return;
      }
      if (r.status === 409 && d.id) { soldOut.add(d.size ? "hoodie:" + d.size : d.id); }
      cart.busy = false; drawCart(d.error || "Checkout couldn't start. Please try again.");
    } catch (e) {
      cart.busy = false; drawCart("Couldn't connect. Check your signal and try again.");
    }
  }
  addEventListener("pageshow", () => { cart.busy = false; drawCart(); });
  if (/order-confirmed/.test(location.pathname) && new URLSearchParams(location.search).get("session_id")) { cart.items = []; cart.save(); }
  drawCart();
  stockReady.then(() => drawCart());

  /* ---- Buy box (any product page) ---- */
  const buy = $("#buybox");
  if (buy) {
    const id = buy.dataset.product, P = PRODUCTS[id];
    let size = null, qty = 1;
    const cta = $("#cta"), note = $("#buy-note"), qtyOut = $("#qty"), addon = $("#addon");
    const mbarBtn = $("#mbar-cta"), mbarSize = $("#mbar-size");
    const sizeBtns = $$(".sizes button", buy), rows = $$(".size-table tbody tr");
    const needSize = !!P.sized;

    function render(msg) {
      sizeBtns.forEach(b => {
        const out = isOut(id, b.dataset.size);
        b.disabled = out; b.classList.toggle("out", out);
        b.setAttribute("aria-pressed", String(b.dataset.size === size));
        b.setAttribute("aria-label", out ? b.dataset.size + " sold out" : "Size " + b.dataset.size);
      });
      rows.forEach(r => r.classList.toggle("sel", r.dataset.size === size));
      if (qtyOut) qtyOut.textContent = qty;
      const allOut = !needSize ? isOut(id) : SIZES.every(s => isOut(id, s));
      const ready = (!needSize || !!size) && !allOut;
      cta.disabled = !ready;
      const extra = addon && addon.checked && !isOut("wraps") ? (PRODUCTS.wraps.addon || PRODUCTS.wraps.price) : 0;
      if (allOut) { cta.textContent = "Sold out"; note.textContent = msg || "This has sold out. Join the drop list to hear about restocks."; }
      else if (ready) {
        cta.textContent = "Add to basket · " + money(P.price * qty + extra);
        note.textContent = msg || (P.low ? "Only a few left." : "Secure checkout with card, Apple Pay or Google Pay.");
      } else { cta.textContent = "Choose a size"; note.textContent = msg || "Pick your size to add it to your basket."; }
      if (addon) { addon.disabled = isOut("wraps"); const lab = $("#addon-price"); if (lab) lab.textContent = money(PRODUCTS.wraps.addon || PRODUCTS.wraps.price); }
      if (mbarBtn) mbarBtn.textContent = allOut ? "Sold out" : needSize && !size ? "Choose size" : "Add to basket";
      if (mbarSize) mbarSize.textContent = needSize ? (size ? "Size " + size + " · Qty " + qty : "Sizes S to XXL") : "Qty " + qty;
    }
    function addToCart() {
      if (needSize && !size) { $("#size-picker").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      if (cta.disabled) return;
      cart.add(id, size, qty);
      let value = P.price * qty;
      if (addon && addon.checked && !isOut("wraps") && !cart.items.some(i => i.id === "wraps")) { cart.add("wraps", "", 1); value += PRODUCTS.wraps.addon || PRODUCTS.wraps.price; }
      track("AddToCart", { content_ids: [id], content_type: "product", value, currency: "GBP" });
      render("Added to your basket."); openCart();
    }
    const pick = s => { if (!isOut(id, s)) { size = s; render(); } };
    sizeBtns.forEach(b => b.addEventListener("click", () => pick(b.dataset.size)));
    rows.forEach(r => r.addEventListener("click", () => { pick(r.dataset.size); $("#size-picker").scrollIntoView({ behavior: "smooth", block: "center" }); }));
    const up = $("#qty-up"), down = $("#qty-down");
    if (up) up.addEventListener("click", () => { qty = Math.min(10, qty + 1); render(); });
    if (down) down.addEventListener("click", () => { qty = Math.max(1, qty - 1); render(); });
    if (addon) addon.addEventListener("change", () => render());
    cta.addEventListener("click", addToCart);
    if (mbarBtn) mbarBtn.addEventListener("click", addToCart);
    render();
    stockReady.then(() => { if (size && isOut(id, size)) size = null; render(); });

    // show the mobile bar once the main button scrolls out of view
    const mbar = $(".mbar");
    if (mbar && "IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => mbar.classList.toggle("show", !e.isIntersecting && e.boundingClientRect.top < 0))
        .observe(cta);
    }
  }

  /* ---- Product gallery ---- */
  const gal = $("#gallery");
  if (gal) {
    const main = $("#gallery-img"), thumbs = $$(".thumbs button", gal);
    let i = 0;
    const show = n => {
      i = (n + thumbs.length) % thumbs.length;
      const t = thumbs[i];
      main.src = t.dataset.full; main.alt = t.dataset.alt;
      thumbs.forEach((b, k) => k === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"));
    };
    thumbs.forEach((b, k) => b.addEventListener("click", () => show(k)));
    if ($(".prev", gal)) $(".prev", gal).addEventListener("click", () => show(i - 1));
    if ($(".next", gal)) $(".next", gal).addEventListener("click", () => show(i + 1));
    main.addEventListener("click", () => openLightbox(thumbs.map(b => ({ src: b.dataset.full, alt: b.dataset.alt })), i));
    // swipe
    let x0 = null;
    main.addEventListener("touchstart", e => (x0 = e.touches[0].clientX), { passive: true });
    main.addEventListener("touchend", e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---- Lightbox (lookbook + product) ---- */
  let lb = null;
  function openLightbox(items, start) {
    let k = start;
    lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Photo viewer");
    lb.innerHTML = '<img alt=""><button class="lb-close" aria-label="Close">✕</button>' +
      '<button class="lb-prev" aria-label="Previous photo">←</button><button class="lb-next" aria-label="Next photo">→</button><p class="lb-cap"></p>';
    const img = $("img", lb), cap = $(".lb-cap", lb);
    const draw = () => { img.src = items[k].src; img.alt = items[k].alt; cap.textContent = items[k].alt + "  ·  " + (k + 1) + " / " + items.length; };
    const go = d => { k = (k + d + items.length) % items.length; draw(); };
    const close = () => { lb.remove(); lb = null; document.removeEventListener("keydown", key); document.body.style.overflow = ""; };
    const key = e => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    $(".lb-close", lb).onclick = close; $(".lb-prev", lb).onclick = () => go(-1); $(".lb-next", lb).onclick = () => go(1);
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    document.body.appendChild(lb); draw(); $(".lb-close", lb).focus();
  }
  const lbItems = $$("[data-lightbox]");
  if (lbItems.length) {
    const items = lbItems.map(b => ({ src: b.dataset.full, alt: b.dataset.alt }));
    lbItems.forEach((b, k) => b.addEventListener("click", () => openLightbox(items, k)));
  }

  /* ---- Team order quantities ---- */
  const qg = $("#qty-grid");
  if (qg) {
    const inputs = $$("input", qg), total = $("#qty-total");
    const sum = () => { total.textContent = inputs.reduce((a, el) => a + (parseInt(el.value, 10) || 0), 0); };
    inputs.forEach(el => el.addEventListener("input", sum)); sum();
  }

  /* ---- Forms ----
     On the live site these are Netlify Forms (data-netlify="true").
     Anywhere else (local preview), they don't post and say so. */
  $$("form[data-netlify]").forEach(f => {
    f.addEventListener("submit", e => {
      const note = $(".form-note", f);
      if (!f.checkValidity()) return;
      if (!live) {
        e.preventDefault();
        if (note) { note.className = "form-note"; note.textContent = "This form sends once the site is live on s4sfitness.com."; }
        return;
      }
      // live: post in the background so the visitor stays on the page
      e.preventDefault();
      const data = new URLSearchParams(new FormData(f)).toString();
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: data })
        .then(r => {
          if (!r.ok) throw 0;
          f.reset();
          if ($("#qty-total")) $("#qty-total").textContent = "0";
          if (note) { note.className = "form-note ok"; note.textContent = f.dataset.success || "Thanks, we've got your message."; }
        })
        .catch(() => { if (note) { note.className = "form-note"; note.textContent = "That didn't send. Please email us instead at hello@s4sfitness.com."; } });
    });
  });

  /* ---- Chalk-dust texture ---- */
  const c = $("#dust");
  if (c && c.getContext) {
    const x = c.getContext("2d");
    const draw = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      c.width = innerWidth * d; c.height = innerHeight * d;
      x.clearRect(0, 0, c.width, c.height);
      const n = Math.round((c.width * c.height) / 2600);
      for (let k = 0; k < n; k++) {
        x.fillStyle = "rgba(255,255,255," + (Math.random() * 0.32).toFixed(3) + ")";
        const s = Math.random() < 0.97 ? d : d * 2;
        x.fillRect(Math.random() * c.width, Math.random() * c.height, s, s);
      }
    };
    draw();
    let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 200); });
  }
})();
