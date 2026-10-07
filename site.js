/* S4S Fitness — site behaviour */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- Product + checkout -------------------------------------------------
     Checkout runs on Stripe. The price and delivery are set on the server
     (netlify/functions/create-checkout.mjs) and sizes are switched on/off in stock.json. */
  const PRODUCT = { price: 34.99 };
  // Display copy of the delivery rates. The checkout function is the source of truth;
  // keep these in step with ZONES in netlify/functions/create-checkout.mjs.
  const ZONES = {
    uk:     { name: "UK tracked delivery", first: 5.99, extra: 0, freeOver: 75, maxQty: 20 },
    europe: { name: "Europe tracked delivery", first: 14.99, extra: 2, freeOver: null, maxQty: 4 },
    world:  { name: "International tracked delivery", first: 25.99, extra: 4.99, freeOver: null, maxQty: 4 }
  };
  const CHECKOUT = "/api/checkout";
  const money = n => "£" + n.toFixed(2);
  const live = /(^|\.)s4sfitness\.com$/.test(location.hostname) || /netlify\.app$/.test(location.hostname) ||
               /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

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

  /* ---- Buy box (product page) ---- */
  const buy = $("#buybox");
  if (buy) {
    let size = null, qty = 1, region = "uk", busy = false;
    const cta = $("#cta"), note = $("#buy-note"), qtyOut = $("#qty"), shipNote = $("#ship-note");
    const mbarBtn = $("#mbar-cta"), mbarSize = $("#mbar-size");
    const sizeBtns = $$(".sizes button", buy), rows = $$(".size-table tbody tr"), regionBtns = $$(".region button", buy);
    const soldOut = new Set();

    function shipping() {
      const z = ZONES[region], sub = PRODUCT.price * qty;
      if (z.freeOver !== null && sub > z.freeOver) return { label: "Free " + z.name, cost: 0 };
      const cost = z.first + z.extra * (qty - 1);
      let label = z.name + " " + money(cost);
      if (z.freeOver !== null) label += " (free over £" + z.freeOver + ")";
      else label += ". Import charges may apply on delivery. Max " + z.maxQty + " per order.";
      return { label, cost };
    }
    function render(msg) {
      sizeBtns.forEach(b => {
        const out = soldOut.has(b.dataset.size);
        b.disabled = out; b.classList.toggle("out", out);
        b.setAttribute("aria-pressed", String(b.dataset.size === size));
        b.setAttribute("aria-label", out ? b.dataset.size + " sold out" : "Size " + b.dataset.size);
      });
      rows.forEach(r => r.classList.toggle("sel", r.dataset.size === size));
      regionBtns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.region === region)));
      qtyOut.textContent = qty;
      const ship = shipping();
      if (shipNote) shipNote.textContent = ship.label;
      const ready = !!size && !busy;
      cta.disabled = !ready; if (mbarBtn) mbarBtn.disabled = busy;
      if (busy) { cta.textContent = "Opening checkout…"; }
      else if (size) {
        cta.textContent = "Buy now · " + money(PRODUCT.price * qty);
        note.textContent = msg || (qty + " × size " + size + ". Total with delivery " + money(PRODUCT.price * qty + ship.cost) + ".");
      } else {
        cta.textContent = "Choose a size";
        note.textContent = msg || "Pick your size to continue to secure checkout.";
      }
      if (mbarBtn) mbarBtn.textContent = size ? "Buy now" : "Choose size";
      if (mbarSize) mbarSize.textContent = size ? "Size " + size + " · Qty " + qty : "Sizes S to XXL";
    }

    async function checkout() {
      if (!size) { $("#size-picker").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      if (!live) { render("Checkout opens once the site is live on s4sfitness.com."); return; }
      busy = true; render();
      try {
        const r = await fetch(CHECKOUT, { method: "POST", headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ size, qty, region }) });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.url) { location.href = d.url; return; }
        if (r.status === 409) { soldOut.add(size); size = null; }
        busy = false; render(d.error || "Checkout couldn't start. Please try again.");
      } catch (e) {
        busy = false; render("Couldn't connect. Check your signal and try again.");
      }
    }

    const pick = s => { if (!soldOut.has(s)) { size = s; render(); } };
    sizeBtns.forEach(b => b.addEventListener("click", () => pick(b.dataset.size)));
    rows.forEach(r => r.addEventListener("click", () => {
      pick(r.dataset.size);
      $("#size-picker").scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    regionBtns.forEach(b => b.addEventListener("click", () => {
      region = b.dataset.region;
      qty = Math.min(qty, ZONES[region].maxQty);
      render();
    }));
    $("#qty-up").addEventListener("click", () => { qty = Math.min(ZONES[region].maxQty, qty + 1); render(); });
    $("#qty-down").addEventListener("click", () => { qty = Math.max(1, qty - 1); render(); });
    cta.addEventListener("click", checkout);
    if (mbarBtn) mbarBtn.addEventListener("click", checkout);
    // returning from Stripe with the back button: reset the button
    addEventListener("pageshow", () => { busy = false; render(); });
    render();

    // sold-out sizes
    fetch("stock.json", { cache: "no-store" }).then(r => r.json()).then(st => {
      Object.entries(st.sizes || {}).forEach(([k, v]) => { if (!v) soldOut.add(k); });
      if (soldOut.has(size)) size = null;
      render();
    }).catch(() => {});

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
    $(".prev", gal).addEventListener("click", () => show(i - 1));
    $(".next", gal).addEventListener("click", () => show(i + 1));
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
