"""Builds the S4S Fitness website pages into the repository root.
Edit page content here, then run:  python3 _build/build.py
Shared header/footer/head live in one place so every page stays consistent."""
import os, json

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")  # repo root = the website
SITE = "https://s4sfitness.com"
EMAIL = "hello@s4sfitness.com"
# The business that sells and takes payment (shown in the footer, terms and privacy pages).
# Fill in the blanks from Companies House before launch; blanks show as [brackets] on the site.
SELLER = {
  "name": "Cool Vibe Company Ltd",   # as registered at Companies House
  "company_no": "12438020",
  "address": "Apple Loft, Hollins Farm Granary Business Centre, Twemlow Lane, Cranage, CW4 8GE",
  "vat": "",                         # VAT number, if VAT registered (leave blank if not)
}
def seller_line():
    n = SELLER["name"]; no = SELLER["company_no"] or "[company number]"; ad = SELLER["address"] or "[registered office address]"
    vat = f" VAT no. {SELLER['vat']}." if SELLER["vat"] else ""
    return f"S4S Fitness is a trading name of {n}, registered in England and Wales, company no. {no}. Registered office: {ad}.{vat}"
IG_HANDLE = "s4sfitness"
IG = f"https://www.instagram.com/{IG_HANDLE}/"
IG_ICON = ('<svg class="ig-icon" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">'
           '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>'
           '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>'
           '<circle cx="17.3" cy="6.7" r="1.3" fill="currentColor"/></svg>')

NAV = [("shop.html", "Shop"), ("perform-fit-hoodie.html", "The Hoodie"), ("lookbook.html", "Lookbook"),
       ("our-story.html", "Our Story"), ("team-orders.html", "Team Orders")]

PHOTOS = {  # file stem: alt text
  "graffiti-hands-on-hips": "Full-zip front with zipped pockets and blue side panels",
  "flatlay-dumbbells": "Hoodie folded beside dumbbells, showing the blue hood lining and swing tag",
  "detail-chest": "Close-up of the S4S chest logo and blue drawcords",
  "side-blue-wall": "Side profile in the hoodie against a blue wall",
  "graffiti-front": "Front view of the hoodie, zipped to the neck",
  "sky-squat": "The hoodie worn outdoors against a blue sky",
  "flatlay-gym-floor": "Hoodie folded on a speckled gym floor",
}
def img(stem, cls="", sm=False, eager=False, attrs=""):
    src = f"img/{stem}{'-sm' if sm else ''}.jpg"
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return f'<img src="{src}" alt="{PHOTOS[stem]}" {load} decoding="async"{(" class=" + chr(34) + cls + chr(34)) if cls else ""} {attrs}>'

def head(title, desc, path, og_img="img/og.jpg", extra=""):
    full = "S4S Fitness" if path == "index.html" else f"{title} | S4S Fitness"
    url = SITE + "/" + ("" if path == "index.html" else path)
    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{full}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0a0c10">
<link rel="canonical" href="{url}">
<meta property="og:site_name" content="S4S Fitness">
<meta property="og:title" content="{full}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/{og_img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="img/favicon.png">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:ital,wght@0,500;0,700;1,800;1,900&family=Barlow:wght@400;500;600&display=swap">
<link rel="stylesheet" href="styles.css">
{extra}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<canvas id="dust" aria-hidden="true"></canvas>
"""

def header(path):
    links = "".join(
        f'<a href="{h}"{" aria-current=" + chr(34) + "page" + chr(34) if h == path else ""}>{t}</a>' for h, t in NAV)
    return f"""<div class="announce">UK delivery £5.99 · Free UK delivery over £75 · Ships within 24 hours</div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="./" aria-label="S4S Fitness home"><img src="img/logo.png" alt="S4S Fitness" width="800" height="396"></a>
    <button class="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
    <nav class="nav" id="nav" aria-label="Main">{links}<a class="nav-cta" href="perform-fit-hoodie.html">Buy · £34.99</a></nav>
  </div>
</header>
<main id="main">
"""

FOOTER = f"""</main>
<footer class="site-footer">
  <div class="wrap foot-top">
    <div>
      <img src="img/logo.png" alt="S4S Fitness" width="800" height="396" loading="lazy">
      <p>Training wear from the people behind Shop4Supplements. Aesthetically fitted, designed to perform.</p>
      <a class="social" href="{IG}" target="_blank" rel="noopener">{IG_ICON}<span>@{IG_HANDLE}</span></a>
    </div>
    <div><h4>Shop</h4><ul>
      <li><a href="perform-fit-hoodie.html">Perform-Fit Hoodie</a></li>
      <li><a href="shop.html">All products</a></li>
      <li><a href="team-orders.html">Team &amp; gym orders</a></li>
    </ul></div>
    <div><h4>Brand</h4><ul>
      <li><a href="our-story.html">Our story</a></li>
      <li><a href="lookbook.html">Lookbook</a></li>
    </ul></div>
    <div><h4>Help</h4><ul>
      <li><a href="perform-fit-hoodie.html#size-guide">Size guide</a></li>
      <li><a href="delivery-returns.html">Delivery &amp; returns</a></li>
      <li><a href="contact.html">Contact</a></li>
      <li><a href="privacy.html">Privacy</a></li>
      <li><a href="terms.html">Terms of sale</a></li>
    </ul></div>
  </div>
  <div class="wrap foot-bottom">
    <span>© <span data-year>2026</span> S4S Fitness. {seller_line()}</span>
    <span><a href="terms.html">Terms of sale</a> · <a href="privacy.html">Privacy</a></span>
  </div>
</footer>
<script src="site.js" defer></script>
</body>
</html>
"""

def page(path, title, desc, body, extra_head=""):
    with open(os.path.join(OUT, path), "w") as f:
        f.write(head(title, desc, path, extra=extra_head) + header(path) + body + FOOTER)
    print("built", path)

def signup(name="drop-list"):
    return f"""<section class="section"><div class="wrap">
  <div class="signup">
    <div>
      <p class="eyebrow">The drop list</p>
      <h2>First to know</h2>
      <p class="lede" style="margin-top:14px">New colours, restocks and limited runs go to the list first. No spam, just S4S.</p>
    </div>
    <form name="{name}" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-success="You're on the list. We'll be in touch when something drops.">
      <input type="hidden" name="form-name" value="{name}">
      <p class="hp"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <label for="{name}-email">Email address</label>
      <div class="inline-form">
        <input id="{name}-email" type="email" name="email" required autocomplete="email" placeholder="you@example.com">
        <button class="btn btn-primary" type="submit">Join</button>
      </div>
      <p class="form-note" role="status"></p>
    </form>
  </div>
</div></section>
"""

TEAM_BAND = """<section class="band"><div class="wrap">
  <div><h2>Kitting out a team?</h2><p>Gyms, clubs and coaching squads: tell us the sizes and numbers and we'll come back with a price.</p></div>
  <a class="btn btn-dark" href="team-orders.html">Start a team order</a>
</div></section>
"""

def instagram(heading='Worn by <span class="blue">you</span>', tiles=("graffiti-front", "flatlay-gym-floor", "sky-squat", "detail-chest")):
    cells = "".join(f'<a class="ig-tile" href="{IG}" target="_blank" rel="noopener" aria-label="See more on Instagram">{img(t, sm=True)}<span>{IG_ICON}</span></a>' for t in tiles)
    return f"""<section class="section ig"><div class="wrap">
  <div class="section-head">
    <div><p class="eyebrow">On Instagram · @{IG_HANDLE}</p><h2>{heading}</h2>
    <p class="lede" style="margin-top:14px">Customers have been sharing their Perform-Fit on Instagram for years. See them on our page, and tag <b>@{IG_HANDLE}</b> in yours for a chance to be featured.</p></div>
    <a class="btn btn-primary ig-btn" href="{IG}" target="_blank" rel="noopener">{IG_ICON}Follow @{IG_HANDLE}</a>
  </div>
  <div class="ig-grid">{cells}</div>
</div></section>
"""

COMMUNITY = [  # file stem, instagram handle, caption, year
  ("missswong", "missswong", "Training in the S4S Gym", "2016"),
  ("heavy-hitters-gym", "heavyhittersgymuk", "The Heavy Hitters Gym boxing squad", "2018"),
  ("josh-peers", "josh_peers", "S4S ambassador, on set", "2016"),
  ("lsherran", "lsherran", "One of the first out the door", "2015"),
  ("lambros-fitness", "lambros_fitness", "Arm day in the hoodie", "2016"),
  ("mrsmac28", "mrsmac28", "PT and S4S regular", "2018"),
  ("wayne-petley", "wayne_petley", "Leg day, NOCCO edition", "2017"),
  ("nocco-edition", "noccouk", "The NOCCO-branded edition", "2016"),
]
CM = {c[0]: c for c in COMMUNITY}
def cimg(stem, sm=True, extra=""):
    _, h, cap, _ = CM[stem]
    return f'<img src="img/community/{stem}{"-sm" if sm else ""}.jpg" alt="@{h}: {cap}" loading="lazy" decoding="async" {extra}>'
def ctile(stem):
    _, h, cap, yr = CM[stem]
    return (f'<a class="c-tile" href="https://www.instagram.com/{h}/" target="_blank" rel="noopener">{cimg(stem)}'
            f'<span class="c-cap"><b>@{h}</b>{cap}</span></a>')
QUOTE = """<figure class="quote">
  <blockquote>Super impressed. This hoodie is high quality and snug in the right places!</blockquote>
  <figcaption><a href="https://www.instagram.com/lsherran/" target="_blank" rel="noopener">@lsherran</a> on Instagram</figcaption>
</figure>"""
def community(heading='Worn by <span class="blue">you</span>', stems=("missswong","heavy-hitters-gym","josh-peers","lsherran"), quote=True):
    tiles = "".join(ctile(x) for x in stems)
    return f"""<section class="section ig"><div class="wrap">
  <div class="section-head">
    <div><p class="eyebrow">The S4S community · @{IG_HANDLE}</p><h2>{heading}</h2>
    <p class="lede" style="margin-top:14px">Lifters, PTs, ambassadors and a whole boxing gym have worn the Perform-Fit since 2015. Tag <b>@{IG_HANDLE}</b> in yours for a chance to be featured.</p></div>
    <a class="btn btn-primary ig-btn" href="{IG}" target="_blank" rel="noopener">{IG_ICON}Follow @{IG_HANDLE}</a>
  </div>
  <div class="c-grid">{tiles}</div>
  {QUOTE if quote else ""}
</div></section>
"""

SIZES = [("S", "48"), ("M", "51"), ("L", "54"), ("XL", "57"), ("XXL", "60")]

# ======================================================================
# HOME
# ======================================================================
home = f"""
<section class="hero"><div class="wrap">
  <div class="hero-copy">
    <p class="eyebrow">S4S Fitness · Training wear</p>
    <h1>Aesthetically <span class="blue">fitted.</span><br>Designed to <span class="blue">perform.</span></h1>
    <p class="lede">The Perform-Fit Full Zip Hoodie. A tapered training layer in our own fabric blend, with a contrast hood, zipped pockets and the S4S mark on the chest.</p>
    <div class="btns"><a class="btn btn-primary" href="perform-fit-hoodie.html">Shop the hoodie</a><a class="btn btn-ghost" href="lookbook.html">See the lookbook</a></div>
    <div class="hero-stats">
      <div><b>£34.99</b><span>Was £59.99</span></div>
      <div><b>S–XXL</b><span>Unisex sizing</span></div>
      <div><b>24 hrs</b><span>Dispatch</span></div>
    </div>
  </div>
  <div class="hero-media">
    <div class="frame">{img("side-blue-wall", eager=True)}</div>
    <div class="tagline"><small>The Perform-Fit</small>Full zip training hoodie</div>
  </div>
</div></section>

<div class="ticker" aria-hidden="true"><div class="ticker-track">
  {"".join("<span>Perform-Fit</span><span>Full zip</span><span>Aesthetic fit</span><span>Built for training</span><span>S4S Fitness</span>" for _ in range(4))}
</div></div>

<section class="section"><div class="wrap feature">
  <a class="frame" href="perform-fit-hoodie.html">{img("flatlay-dumbbells")}</a>
  <div>
    <p class="eyebrow">The signature piece</p>
    <h2>Perform-Fit <span class="blue">Full Zip</span> Hoodie</h2>
    <div class="price"><strong>£34.99</strong><s>£59.99</s><em>SAVE 42%</em></div>
    <ul class="ticks">
      <li>Tapered, close cut that shows the work without restricting movement</li>
      <li>Grey marl body with a contrast charcoal hood and sky-blue lining</li>
      <li>Full-length zip, zipped front pockets and blue side panels</li>
      <li>S4S logo on the chest, tonal print on the sleeve</li>
    </ul>
    <div class="btns"><a class="btn btn-primary" href="perform-fit-hoodie.html">Choose your size</a></div>
  </div>
</div></section>

<hr class="rule">

<section class="section"><div class="wrap">
  <div class="section-head">
    <div><p class="eyebrow">In the details</p><h2>Made for the <span class="blue">session</span></h2></div>
    <a class="link" href="perform-fit-hoodie.html#details">Full details</a>
  </div>
  <div class="trio">
    <article><div class="frame">{img("detail-chest", sm=True)}</div><h3>Close fit</h3><p>Tapered through the body and arms, so it sits close in the gym and looks sharp out of it.</p></article>
    <article><div class="frame">{img("flatlay-gym-floor", sm=True)}</div><h3>Contrast hood</h3><p>Charcoal hood panel with a sky-blue lining and blue drawcords. Easy to spot in a kit bag.</p></article>
    <article><div class="frame">{img("graffiti-hands-on-hips", sm=True)}</div><h3>Zipped pockets</h3><p>Zipped front pockets keep keys and a phone secure between sets. Blue side panels finish the cut.</p></article>
  </div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
  <div class="section-head">
    <div><p class="eyebrow">Lookbook</p><h2>Out in the <span class="blue">wild</span></h2></div>
    <a class="link" href="lookbook.html">View all</a>
  </div>
  <div class="mosaic">
    <a href="lookbook.html">{img("sky-squat", sm=True)}</a>
    <a href="lookbook.html">{img("graffiti-front", sm=True)}</a>
    <a href="lookbook.html">{img("detail-chest", sm=True)}</a>
    <a href="lookbook.html">{img("flatlay-gym-floor", sm=True)}</a>
    <a href="lookbook.html">{img("side-blue-wall", sm=True)}</a>
  </div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap story">
  <div class="mark"><img src="img/logo-mark.png" alt="S4S mark" width="480" height="193" loading="lazy"></div>
  <div>
    <p class="eyebrow">Our story</p>
    <h2>Born behind the <span class="blue">counter</span></h2>
    <p>S4S started as Shop4Supplements, a sports nutrition and health store that opened on Moss Lane in Altrincham in 2014, with its own PT studio, the S4S Gym, right underneath. Our customers trained where we worked, so we saw first-hand what they wanted from their kit. S4S Fitness is what came out of it: training wear that fits properly and works hard.</p>
    <a class="link" href="our-story.html">Read our story</a>
  </div>
</div></section>

{community()}
{TEAM_BAND}
{signup()}
"""
page("index.html", "S4S Fitness", "S4S Fitness training wear. Shop the Perform-Fit Full Zip Hoodie: aesthetically fitted, designed to perform. Sizes S to XXL, now £34.99.", home,
     extra_head='<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "Organization", "name": "S4S Fitness", "url": SITE, "logo": SITE + "/img/logo.png", "sameAs": [IG]}) + "</script>\n")

# ======================================================================
# PRODUCT
# ======================================================================
gallery_order = ["graffiti-hands-on-hips", "flatlay-dumbbells", "detail-chest", "side-blue-wall", "graffiti-front", "sky-squat", "flatlay-gym-floor"]
thumbs = "".join(
    f'<button type="button" data-full="img/{s}.jpg" data-alt="{PHOTOS[s]}" aria-label="Show photo {k+1}"{" aria-current=" + chr(34) + "true" + chr(34) if k == 0 else ""}><img src="img/{s}-sm.jpg" alt="" loading="lazy"></button>'
    for k, s in enumerate(gallery_order))
size_btns = "".join(f'<button type="button" id="size-{s}" data-size="{s}" aria-pressed="false">{s}</button>' for s, _ in SIZES)
size_rows = "".join(f'<tr data-size="{s}"><td>{s}</td><td>{c}</td></tr>' for s, c in SIZES)
product_ld = {"@context": "https://schema.org", "@type": "Product", "name": "S4S Fitness Perform-Fit Full Zip Training Hoodie",
  "brand": {"@type": "Brand", "name": "S4S Fitness"}, "image": [f"{SITE}/img/{s}.jpg" for s in gallery_order[:3]],
  "description": "Aesthetically fitted, designed to perform. Full zip training hoodie in our exclusive fabric blend.",
  "sku": "S4S-PF-HOODIE",
  "offers": {"@type": "Offer", "priceCurrency": "GBP", "price": "34.99", "availability": "https://schema.org/InStock", "url": SITE + "/perform-fit-hoodie.html"}}

pdp = f"""
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb" style="margin:28px 0 0"><a href="./">Home</a><span>/</span><a href="shop.html">Shop</a><span>/</span><span>Perform-Fit Full Zip Hoodie</span></nav>
  <div class="pdp">
    <div id="gallery">
      <div class="gallery-main">
        <span class="badge">SAVE 42%</span>
        <img id="gallery-img" src="img/{gallery_order[0]}.jpg" alt="{PHOTOS[gallery_order[0]]}" fetchpriority="high">
        <button class="gnav prev" type="button" aria-label="Previous photo">←</button>
        <button class="gnav next" type="button" aria-label="Next photo">→</button>
      </div>
      <div class="thumbs">{thumbs}</div>
    </div>

    <div class="buybox" id="buybox">
      <p class="eyebrow">S4S Fitness · Training hoodie</p>
      <h1>Perform-Fit <span class="blue">Full Zip</span> Hoodie</h1>
      <div class="price"><strong>£34.99</strong><s>£59.99</s><em>SAVE 42%</em></div>
      <p class="lede">Aesthetically fitted, designed to perform. Our exclusive fabric blend keeps the cut close while moving freely through every lift, sprint and stretch.</p>

      <div class="opt-label"><span>Colour</span></div>
      <div class="colour"><span class="swatch" aria-hidden="true"><i></i></span>Grey marl / charcoal / sky blue</div>

      <div class="opt-label"><span>Size</span><a href="#size-guide">Size guide</a></div>
      <div class="sizes" role="group" aria-label="Choose a size" id="size-picker">{size_btns}</div>

      <div class="opt-label"><span>Delivering to</span></div>
      <div class="region" role="group" aria-label="Delivering to">
        <button type="button" id="region-uk" data-region="uk" aria-pressed="true">UK</button>
        <button type="button" id="region-europe" data-region="europe" aria-pressed="false">Europe</button>
        <button type="button" id="region-world" data-region="world" aria-pressed="false">Rest of world</button>
      </div>
      <p class="ship-note" id="ship-note">UK tracked delivery £5.99 (free over £75)</p>

      <div class="buy-row">
        <div class="qty" aria-label="Quantity">
          <button type="button" id="qty-down" aria-label="Decrease quantity">−</button>
          <output id="qty" aria-live="polite">1</output>
          <button type="button" id="qty-up" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn btn-primary" id="cta" type="button" disabled>Choose a size</button>
      </div>
      <p class="buy-note" id="buy-note" role="status">Pick your size to continue to secure checkout.</p>

      <div class="assure">
        <div><span><b>Dispatched in 24 hrs</b><br>Tracked UK delivery</span></div>
        <div><span><b>Free UK delivery</b><br>On orders over £75</span></div>
        <div><span><b>30-day returns</b><br>Unworn, tags on</span></div>
        <div><span><b>Secure checkout</b><br>Card, Apple Pay, Google Pay</span></div>
      </div>
      <a class="social" style="margin-top:20px" href="{IG}" target="_blank" rel="noopener">{IG_ICON}<span>See customers wearing it on Instagram</span></a>

      <div class="acc" id="details">
        <details open><summary>Details</summary><div class="acc-body"><ul>
          <li>Full-length front zip</li>
          <li>Charcoal hood and shoulder panel with sky-blue hood lining</li>
          <li>Sky-blue drawcords</li>
          <li>Zipped front pockets</li>
          <li>Blue underarm and side panels</li>
          <li>S4S Fitness logo on the chest; tonal print on the sleeve</li>
          <li>Grey marl body in our exclusive fabric blend</li>
        </ul></div></details>
        <details><summary>Fit</summary><div class="acc-body">
          <p>An aesthetic, tapered fit: close through the chest, waist and arms without restricting movement. Unisex sizing from S to XXL.</p>
          <p>Between sizes? Size up for a relaxed fit, or take your usual size for the full aesthetic cut. See the <a href="#size-guide">size guide</a>.</p>
        </div></details>
        <details><summary>Delivery &amp; returns</summary><div class="acc-body">
          <p>Tracked UK delivery is £5.99 (1–3 days) and free on orders over £75. Tracked delivery to Europe is £14.99, and to the rest of the world £25.99, plus a little for each extra hoodie. Orders are dispatched within 24 hours.</p>
          <p>Returns are accepted within 30 days for unworn items with tags. <a href="delivery-returns.html">Full delivery and returns details</a>.</p>
        </div></details>
        <details><summary>Buying for a team?</summary><div class="acc-body">
          <p>We supply gyms, clubs and coaching squads. <a href="team-orders.html">Send us your sizes and numbers</a> and we'll come back with a price.</p>
        </div></details>
      </div>
    </div>
  </div>
</div>

<div class="wrap"><div class="specs">
  <div><h3>Full zip</h3><p>On and off between sets without messing with your warm-up.</p></div>
  <div><h3>Aesthetic fit</h3><p>Tapered to sit close and show the work you've put in.</p></div>
  <div><h3>Exclusive blend</h3><p>Our own fabric blend, chosen for comfort through a full session.</p></div>
  <div><h3>Zipped pockets</h3><p>Keys, phone and locker key stay put while you train.</p></div>
</div></div>

{community('Worn by the <span class="blue">community</span>', ("heavy-hitters-gym","missswong","lambros-fitness","mrsmac28"))}

<section class="section" id="size-guide" style="padding-top:0"><div class="wrap split">
  <div>
    <p class="eyebrow">Size guide</p>
    <h2>Find your <span class="blue">size</span></h2>
    <p class="lede" style="margin-top:16px">Measure across the chest of a hoodie that fits you well and compare it with the chart. Tap a row to select that size.</p>
    <p class="small" style="margin-top:16px">All sizes are unisex.</p>
  </div>
  <div class="tablewrap">
    <table class="size-table">
      <thead><tr><th scope="col">Size</th><th scope="col">Chest</th></tr></thead>
      <tbody>{size_rows}</tbody>
    </table>
  </div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
  <div class="section-head"><div><p class="eyebrow">Questions</p><h2>Good to <span class="blue">know</span></h2></div></div>
  <div class="acc" style="max-width:860px">
    <details><summary>Is the hoodie unisex?</summary><div class="acc-body"><p>Yes. The Perform-Fit is cut to work for men and women, in sizes S to XXL.</p></div></details>
    <details><summary>How does it fit compared to a normal hoodie?</summary><div class="acc-body"><p>It's closer. The Perform-Fit is tapered through the body and arms like training kit, not cut loose like a casual hoodie. If you want a relaxed fit, go up a size.</p></div></details>
    <details><summary>How do I pay?</summary><div class="acc-body"><p>Checkout is handled securely by Stripe. You can pay by debit or credit card, Apple Pay or Google Pay. We never see or store your card details.</p></div></details>
    <details><summary>Who am I buying from?</summary><div class="acc-body"><p>S4S Fitness is a trading name of {SELLER["name"]}. That name may appear on your card statement and receipt. Full details are in our <a href="terms.html">terms of sale</a>.</p></div></details>
    <details><summary>Do you ship outside the UK?</summary><div class="acc-body"><p>Yes, with tracking. Europe is £14.99 for one hoodie plus £2 for each extra. The rest of the world is £25.99 plus £4.99 for each extra. International orders are limited to 4 hoodies; for more, use our <a href="team-orders.html">team orders</a> form. Import VAT or customs charges may be due on delivery.</p></div></details>
    <details><summary>Can I order in bulk?</summary><div class="acc-body"><p>Yes. Use the <a href="team-orders.html">team orders</a> form with your sizes and quantities.</p></div></details>
  </div>
</div></section>

{TEAM_BAND}

<div class="mbar" aria-hidden="false">
  <div><b>£34.99</b><span id="mbar-size">Sizes S to XXL</span></div>
  <button class="btn btn-primary" id="mbar-cta" type="button">Choose size</button>
</div>
"""
page("perform-fit-hoodie.html", "Perform-Fit Full Zip Hoodie", "The S4S Fitness Perform-Fit Full Zip Training Hoodie. Tapered fit, contrast hood, zipped pockets. Sizes S to XXL, now £34.99.", pdp,
     extra_head='<script type="application/ld+json">' + json.dumps(product_ld) + "</script>\n")

# ======================================================================
# SHOP
# ======================================================================
shop = f"""
<section class="page-hero"><div class="wrap">
  <p class="eyebrow">Shop</p>
  <h1>The <span class="blue">collection</span></h1>
  <p class="lede">One piece, done properly. The Perform-Fit is where S4S Fitness started, and it's back in stock while it lasts.</p>
</div></section>

<section class="section"><div class="wrap">
  <div class="shop-grid">
    <a class="card" href="perform-fit-hoodie.html">
      <div class="frame"><span class="tag">SAVE 42%</span>{img("graffiti-hands-on-hips", sm=True)}</div>
      <h3>Perform-Fit Full Zip Hoodie</h3>
      <div class="meta"><b>£34.99</b><s>£59.99</s></div>
      <p class="sub">Grey marl · S to XXL</p>
    </a>
    <a class="card" href="team-orders.html">
      <div class="frame">{img("flatlay-dumbbells", sm=True)}</div>
      <h3>Team &amp; gym orders</h3>
      <div class="meta"><b>Bulk</b></div>
      <p class="sub">Kit out your squad. Ask for a price</p>
    </a>
    <div class="card soon">
      <div class="frame"><img src="img/logo-mark.png" alt="" width="480" height="193" loading="lazy"></div>
      <h3>Next drop</h3>
      <div class="meta"><b>Coming soon</b></div>
      <p class="sub">Join the drop list below to hear first</p>
    </div>
  </div>
</div></section>
{signup("drop-list-shop")}
"""
page("shop.html", "Shop", "Shop S4S Fitness training wear: the Perform-Fit Full Zip Hoodie and team orders.", shop)

# ======================================================================
# LOOKBOOK
# ======================================================================
lb_order = ["sky-squat", "graffiti-hands-on-hips", "detail-chest", "side-blue-wall", "flatlay-dumbbells", "graffiti-front", "flatlay-gym-floor"]
figs = "".join(
    f'<figure><button type="button" data-lightbox data-full="img/{s}.jpg" data-alt="{PHOTOS[s]}" aria-label="Open photo: {PHOTOS[s]}">{img(s, sm=True)}</button><figcaption>{PHOTOS[s]}</figcaption></figure>'
    for s in lb_order)
cfigs = "".join(
    f'<figure><button type="button" data-lightbox data-full="img/community/{c[0]}.jpg" data-alt="@{c[1]}: {c[2]}" aria-label="Open photo by @{c[1]}">{cimg(c[0])}</button><figcaption>@{c[1]} · {c[3]}</figcaption></figure>'
    for c in COMMUNITY)
lookbook = f"""
<section class="page-hero has-img">
  <div class="bg">{img("graffiti-front", eager=True)}</div>
  <div class="wrap">
    <p class="eyebrow">Lookbook</p>
    <h1>Worn <span class="blue">hard</span></h1>
    <p class="lede">The Perform-Fit on the street, on the gym floor and up close, plus the customers who've made it their own. Tap any photo to see it full size.</p>
    <div class="btns" style="margin-top:28px"><a class="btn btn-ghost" href="#community">See the community</a></div>
  </div>
</section>
<section class="section"><div class="wrap">
  <div class="section-head"><div><p class="eyebrow">Campaign</p><h2>The <span class="blue">shoot</span></h2></div></div>
  <div class="lb-grid">{figs}</div>
  <div class="btns" style="margin-top:40px;justify-content:center"><a class="btn btn-primary" href="perform-fit-hoodie.html">Shop the hoodie</a></div>
</div></section>
<section class="section" style="padding-top:0" id="community"><div class="wrap">
  <div class="section-head">
    <div><p class="eyebrow">The community</p><h2>Shared by <span class="blue">you</span></h2>
    <p class="lede" style="margin-top:14px">Real customers, PTs and ambassadors in their Perform-Fit, as posted on Instagram. Tap a photo to see it full size.</p></div>
    <a class="btn btn-primary ig-btn" href="{IG}" target="_blank" rel="noopener">{IG_ICON}Follow @{IG_HANDLE}</a>
  </div>
  <div class="lb-grid">{cfigs}</div>
  {QUOTE}
</div></section>
{TEAM_BAND}
"""
page("lookbook.html", "Lookbook", "The S4S Fitness Perform-Fit Hoodie on the street and in the gym.", lookbook)

# ======================================================================
# OUR STORY
# ======================================================================
story = f"""
<section class="page-hero has-img">
  <div class="bg">{img("graffiti-hands-on-hips", eager=True)}</div>
  <div class="wrap">
    <p class="eyebrow">Our story</p>
    <h1>From the <span class="blue">counter</span><br>to the gym floor</h1>
    <p class="lede">S4S Fitness grew out of a supplement store on Moss Lane in Altrincham, the PT studio underneath it, and the people who trained there.</p>
  </div>
</section>

<section class="section"><div class="wrap split">
  <div class="prose">
    <p class="eyebrow">Where it started</p>
    <h2 style="margin-top:4px">S4S means <span class="blue">Shop4Supplements</span></h2>
    <p>Before there was a hoodie, there was a shop. Shop4Supplements opened on Moss Lane, Altrincham, in 2014, selling sports nutrition and health supplements to people who take their training seriously: lifters, competitors, runners and everyday gym-goers.</p>
    <p>Downstairs, under the shop, was the <strong>S4S Gym</strong>: our own PT studio. Our customers didn't just buy from us, they trained with us.</p>
    <p>Between the counter upstairs and the studio downstairs, we heard the same thing again and again. People wanted training gear that fitted like it was made for someone who trains, at a price that made sense. So we made it.</p>
    <p><strong>S4S Fitness is our own clothing line,</strong> designed around how our customers actually train.</p>
  </div>
  <div class="frame">{img("flatlay-dumbbells")}</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap split rev">
  <div class="prose">
    <p class="eyebrow">The Perform-Fit</p>
    <h2 style="margin-top:4px">One piece, <span class="blue">done right</span></h2>
    <p>The Perform-Fit Full Zip Hoodie was our first garment, released in 2015, and it is still the one people ask for.</p>
    <p>We developed our own fabric blend for it and cut it close: tapered through the body and arms so it looks sharp, with enough give that you can actually train in it. Then we added the details we wanted ourselves: a full zip, zipped pockets, a contrast hood and the S4S mark on the chest.</p>
  </div>
  <div class="frame">{img("sky-squat")}</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
  <div class="section-head"><div><p class="eyebrow">What we stand for</p><h2>Three <span class="blue">rules</span></h2></div></div>
  <div class="values">
    <article><h3>Fit first</h3><p>Training wear should fit like training wear. Close where it counts, free where you move.</p></article>
    <article><h3>Built to be used</h3><p>Zips, pockets and panels go where they make a difference in the gym, not just on the hanger.</p></article>
    <article><h3>Fair price</h3><p>Good kit shouldn't need a big-brand price tag. We'd rather you buy two.</p></article>
  </div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap split">
  <div>
    <p class="eyebrow">The journey</p>
    <h2 style="margin:4px 0 32px">How we <span class="blue">got here</span></h2>
    <ol class="timeline">
      <li><b>2014 · Moss Lane, Altrincham</b><p>Shop4Supplements opens its doors, selling sports nutrition and health supplements to the local training community.</p></li>
      <li><b>The S4S Gym</b><p>A PT studio opens under the store, and our customers start training under the S4S name.</p></li>
      <li><b>2015 · The Perform-Fit</b><p>Our first garment launches: the Perform-Fit Full Zip Hoodie. The first customers start posting theirs on Instagram that December.</p></li>
      <li><b>2016 · The team grows</b><p>S4S ambassadors like @josh_peers wear it on shoots, and a NOCCO-branded edition of the hoodie hits the gym floor.</p></li>
      <li><b>2018 · Fight ready</b><p>The Heavy Hitters Gym boxing squad gets kitted out in the Perform-Fit.</p></li>
      <li><b>Today · s4sfitness.com</b><p>S4S Fitness gets a home of its own, starting with the hoodie that started it all.</p></li>
    </ol>
  </div>
  <div class="frame">{img("side-blue-wall")}</div>
</div></section>

{TEAM_BAND}
{signup("drop-list-story")}
"""
page("our-story.html", "Our Story", "How S4S Fitness grew out of Shop4Supplements, and the story behind the Perform-Fit Hoodie.", story)

# ======================================================================
# TEAM ORDERS
# ======================================================================
qty_inputs = "".join(
    f'<div><label for="q-{s}">{s}</label><input id="q-{s}" name="qty-{s}" type="number" min="0" max="999" inputmode="numeric" placeholder="0"></div>'
    for s, _ in SIZES)
team = f"""
<section class="page-hero has-img">
  <div class="bg">{img("graffiti-front", eager=True)}</div>
  <div class="wrap">
    <p class="eyebrow">Team &amp; gym orders</p>
    <h1>Kit out the <span class="blue">squad</span></h1>
    <p class="lede">Gyms, PT studios, sports clubs and coaching teams. Tell us what you need and we'll come back with a price for your order.</p>
  </div>
</section>

<section class="section"><div class="wrap to-grid">
  <div>
    <p class="eyebrow">How it works</p>
    <h2>Three <span class="blue">steps</span></h2>
    <ol class="steps">
      <li><div><b>Send your sizes</b><p>Fill in the form with how many of each size you need.</p></div></li>
      <li><div><b>Get a price</b><p>We'll reply by email with a price for your order and delivery.</p></div></li>
      <li><div><b>We ship it</b><p>Once you're happy, we pack and dispatch the whole order together.</p></div></li>
    </ol>
    <figure class="proof">
      <div class="frame">{cimg("heavy-hitters-gym", sm=False)}</div>
      <figcaption><b>Heavy Hitters Gym UK</b> kitted out their boxing squad in the Perform-Fit. <a href="https://www.instagram.com/heavyhittersgymuk/" target="_blank" rel="noopener">@heavyhittersgymuk</a></figcaption>
    </figure>
  </div>

  <div class="form-card">
    <form name="team-order" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-success="Thanks. We've got your order details and will email you a price.">
      <input type="hidden" name="form-name" value="team-order">
      <p class="hp"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <h3 style="margin-bottom:24px">Request a price</h3>
      <div class="grid-2">
        <div class="field"><label for="t-name">Your name</label><input id="t-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="t-org">Gym, club or team</label><input id="t-org" name="organisation" required autocomplete="organization"></div>
        <div class="field"><label for="t-email">Email</label><input id="t-email" name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label for="t-phone">Phone <span class="opt">(optional)</span></label><input id="t-phone" name="phone" type="tel" autocomplete="tel"></div>
      </div>
      <label>Quantity per size</label>
      <div class="qty-grid" id="qty-grid">{qty_inputs}</div>
      <div class="qty-total"><span>Total hoodies</span><b id="qty-total">0</b></div>
      <div class="field"><label for="t-date">Needed by <span class="opt">(optional)</span></label><input id="t-date" name="needed-by" type="date"></div>
      <div class="field"><label for="t-msg">Anything else? <span class="opt">(optional)</span></label><textarea id="t-msg" name="message" placeholder="Delivery address, mix of sizes still to confirm, anything we should know"></textarea></div>
      <button class="btn btn-primary" type="submit" style="width:100%">Send request</button>
      <p class="form-note" role="status"></p>
      <p class="small" style="margin-top:10px">Prefer email? Write to <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
    </form>
  </div>
</div></section>
"""
page("team-orders.html", "Team & Gym Orders", "Bulk S4S Fitness Perform-Fit Hoodies for gyms, clubs and teams. Send your sizes and get a price.", team)

# ======================================================================
# DELIVERY & RETURNS
# ======================================================================
delivery = f"""
<section class="page-hero"><div class="wrap">
  <p class="eyebrow">Help</p>
  <h1>Delivery &amp; <span class="blue">returns</span></h1>
  <p class="lede">Everything you need to know about getting your order, and sending it back if it isn't right.</p>
</div></section>
<div class="wrap info">
  <nav class="toc" aria-label="On this page"><a href="#delivery">Delivery</a><a href="#returns">Returns</a><a href="#exchanges">Exchanges</a><a href="#who">Who you're buying from</a></nav>
  <div class="prose">
    <h2 id="delivery" style="margin-top:0">Delivery</h2>
    <p>Orders are packed and dispatched within 24 hours.</p>
    <div class="tablewrap" style="margin-bottom:1.6em"><table class="plain-table">
      <thead><tr><th>Service</th><th>Order</th><th>Cost</th></tr></thead>
      <tbody>
        <tr><td>UK tracked (1–3 days)</td><td>Up to £75</td><td>£5.99</td></tr>
        <tr><td>UK tracked (1–3 days)</td><td>Over £75</td><td>Free</td></tr>
        <tr><td>Europe tracked (3–7 days)</td><td>1 hoodie</td><td>£14.99</td></tr>
        <tr><td>Europe tracked (3–7 days)</td><td>Each extra hoodie</td><td>+£2.00</td></tr>
        <tr><td>Rest of world tracked (5–10 days)</td><td>1 hoodie</td><td>£25.99</td></tr>
        <tr><td>Rest of world tracked (5–10 days)</td><td>Each extra hoodie</td><td>+£4.99</td></tr>
      </tbody>
    </table></div>
    <p>You'll get a tracking link by email once your order ships.</p>
    <h3>Ordering from outside the UK</h3>
    <ul>
      <li>International orders are limited to 4 hoodies per order. For bigger orders, use our <a href="team-orders.html">team orders</a> form.</li>
      <li>Your country may charge import VAT, customs duty or a courier handling fee when the parcel arrives. These are set by your country, aren't included in our prices, and are paid by you.</li>
      <li>Delivery times are estimates. Customs checks can occasionally add a few days.</li>
    </ul>

    <h2 id="returns">Returns</h2>
    <div class="callout"><b>30 days to return.</b> Send items back within 30 days of delivery, unworn, unwashed and with the tags still attached.</div>
    <ul>
      <li>Email <a href="mailto:{EMAIL}">{EMAIL}</a> with your order number to start a return. We'll reply with the return address.</li>
      <li>Return postage is paid by you. We recommend a tracked service, as we can't refund items that don't reach us.</li>
      <li>Refunds go back to your original payment method once we've received and checked the return.</li>
    </ul>
    <p>This doesn't affect your statutory rights. Under UK law you can cancel an online order within 14 days of receiving it.</p>

    <h2 id="exchanges">Exchanges</h2>
    <p>Wrong size? Email us and we'll help you swap it, subject to stock. The quickest route is usually to return the original and place a new order for the size you need.</p>

    <h2 id="who">Who you're buying from</h2>
    <p>{seller_line()} Payments are taken securely by Stripe. See our <a href="terms.html">terms of sale</a> for the full details.</p>
  </div>
</div>
"""
page("delivery-returns.html", "Delivery & Returns", "S4S Fitness delivery costs, dispatch times and returns policy.", delivery)

# ======================================================================
# CONTACT
# ======================================================================
contact = f"""
<section class="page-hero"><div class="wrap">
  <p class="eyebrow">Contact</p>
  <h1>Get in <span class="blue">touch</span></h1>
  <p class="lede">Questions about sizing, an order or team kit? Send us a message and we'll get back to you.</p>
</div></section>
<section class="section"><div class="wrap">
  <div class="contact-cards">
    <div><h3>Email</h3><p><a href="mailto:{EMAIL}">{EMAIL}</a></p></div>
    <div><h3>Instagram</h3><p><a href="{IG}" target="_blank" rel="noopener">@{IG_HANDLE}</a><br>DM us or tag us in your photos.</p></div>
    <div><h3>Team kit</h3><p>For bulk orders, use the <a href="team-orders.html">team order form</a>.</p></div>
  </div>
  <div class="form-card" style="max-width:760px">
    <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-success="Thanks. Your message is with us and we'll reply by email.">
      <input type="hidden" name="form-name" value="contact">
      <p class="hp"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <div class="grid-2">
        <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" required autocomplete="email"></div>
      </div>
      <div class="field"><label for="c-topic">Topic</label>
        <select id="c-topic" name="topic"><option>Sizing question</option><option>My order</option><option>Returns</option><option>Team or gym order</option><option>Something else</option></select></div>
      <div class="field"><label for="c-order">Order number <span class="opt">(optional)</span></label><input id="c-order" name="order-number"></div>
      <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" name="message" required></textarea></div>
      <button class="btn btn-primary" type="submit">Send message</button>
      <p class="form-note" role="status"></p>
    </form>
  </div>
</div></section>
"""
page("contact.html", "Contact", "Contact S4S Fitness about sizing, orders, returns or team kit.", contact)

# ======================================================================
# PRIVACY
# ======================================================================
privacy = f"""
<section class="page-hero"><div class="wrap">
  <p class="eyebrow">Legal</p>
  <h1>Privacy</h1>
  <p class="lede">What we collect on this site, why, and what you can ask us to do with it.</p>
</div></section>
<div class="wrap info">
  <nav class="toc" aria-label="On this page"><a href="#who">Who we are</a><a href="#collect">What we collect</a><a href="#use">How we use it</a><a href="#rights">Your rights</a></nav>
  <div class="prose">
    <h2 id="who" style="margin-top:0">Who we are</h2>
    <p>{seller_line()} We are responsible for the personal information collected on this site. For any privacy question, email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
    <h2 id="collect">What we collect</h2>
    <ul>
      <li><strong>Forms on this site:</strong> the details you type into the contact, team order and drop list forms, such as your name, email address, phone number and message.</li>
      <li><strong>Orders:</strong> when you buy, we collect your name, email, phone number and delivery address so we can send your order. Checkout is handled by Stripe, which processes your payment. Card details go straight to Stripe and are never seen or stored by us.</li>
    </ul>
    <p>This site does not use advertising or tracking cookies.</p>
    <h2 id="use">How we use it</h2>
    <ul>
      <li>To reply to your message or team order request.</li>
      <li>To process, deliver and support your order.</li>
      <li>If you join the drop list, to email you about new products and restocks. Every email has an unsubscribe link, or just ask us to remove you.</li>
    </ul>
    <p>We don't sell your information. We share it only with the services that run the shop: Stripe for payments, Netlify for website hosting and form submissions, and the courier delivering your parcel.</p>
    <h2 id="rights">Your rights</h2>
    <p>Under UK GDPR you can ask to see the personal data we hold about you, ask us to correct or delete it, or object to how we use it. Email us and we'll respond within one month. You can also complain to the Information Commissioner's Office at ico.org.uk.</p>
  </div>
</div>
"""
page("privacy.html", "Privacy", "How S4S Fitness handles your personal information.", privacy)

# ======================================================================
# 404
# ======================================================================
nf = """
<section class="wrap notfound"><div>
  <div class="big">404</div>
  <h1 style="font-size:clamp(32px,4vw,48px);margin:24px 0 14px">Missed rep</h1>
  <p class="lede" style="margin:0 auto 32px">That page doesn't exist. Head back to the shop and go again.</p>
  <div class="btns" style="justify-content:center"><a class="btn btn-primary" href="./">Home</a><a class="btn btn-ghost" href="perform-fit-hoodie.html">Shop the hoodie</a></div>
</div></section>
"""
page("404.html", "Page not found", "This page doesn't exist.", nf)

# ======================================================================
# TERMS OF SALE
# ======================================================================
terms = f"""
<section class="page-hero"><div class="wrap">
  <p class="eyebrow">Legal</p>
  <h1>Terms of <span class="blue">sale</span></h1>
  <p class="lede">The basics of buying from S4S Fitness, in plain English.</p>
</div></section>
<div class="wrap info">
  <nav class="toc" aria-label="On this page"><a href="#seller">Who we are</a><a href="#orders">Orders and prices</a><a href="#delivery-t">Delivery</a><a href="#cancel">Cancelling and returns</a><a href="#faulty">Faulty items</a><a href="#contact-t">Contact</a></nav>
  <div class="prose">
    <h2 id="seller" style="margin-top:0">Who we are</h2>
    <p>{seller_line()}</p>
    <p>Email: <a href="mailto:{EMAIL}">{EMAIL}</a></p>

    <h2 id="orders">Orders and prices</h2>
    <ul>
      <li>All prices are in pounds sterling (GBP). We are not VAT registered, so no VAT is added. Delivery is shown at checkout before you pay.</li>
      <li>Payment is taken by Stripe when you place your order. You'll get an email receipt straight away.</li>
      <li>Your order is accepted when we dispatch it. If an item turns out to be out of stock, we'll tell you and refund you in full.</li>
    </ul>

    <h2 id="delivery-t">Delivery</h2>
    <p>Delivery costs and times are on our <a href="delivery-returns.html">delivery and returns</a> page. The goods are your responsibility once they've been delivered to the address you gave us.</p>

    <h2 id="cancel">Cancelling and returns</h2>
    <p>You have the legal right to cancel an online order within 14 days of receiving it, for any reason. On top of that, we accept returns of unworn items with tags attached within 30 days of delivery.</p>
    <p>Email us to start a return. Refunds go back to your original payment method within 14 days of us receiving the item. Return postage is paid by you unless the item is faulty or we sent the wrong thing.</p>

    <h2 id="faulty">Faulty items</h2>
    <p>If something arrives faulty or damaged, email us with a photo. We'll replace or refund it and cover the return postage. This doesn't affect your rights under the Consumer Rights Act 2015.</p>

    <h2 id="contact-t">Contact</h2>
    <p>Questions or complaints: <a href="mailto:{EMAIL}">{EMAIL}</a>. These terms are governed by the law of England and Wales.</p>
  </div>
</div>
"""
page("terms.html", "Terms of Sale", "S4S Fitness terms of sale: who we are, orders, delivery, cancellations and returns.", terms)

# ======================================================================
# ORDER CONFIRMED (Stripe success page)
# ======================================================================
confirmed = f"""
<section class="wrap confirm">
  <div class="tick" aria-hidden="true">✓</div>
  <p class="eyebrow" style="justify-content:center">Order confirmed</p>
  <h1 style="font-size:clamp(40px,6vw,72px)">You're <span class="blue">in</span></h1>
  <p class="lede">Thanks for your order. Your Perform-Fit is on its way to being packed, and a receipt is in your inbox.</p>
  <div class="next-steps">
    <div><b>1 · Receipt</b><p>Check your email for your receipt. If it's not there, look in junk.</p></div>
    <div><b>2 · Dispatch</b><p>We'll pack your order and send it out with tracking.</p></div>
    <div><b>3 · Tag us</b><p>Post your fit and tag <a href="{IG}" target="_blank" rel="noopener">@{IG_HANDLE}</a> to be featured.</p></div>
  </div>
  <div class="btns" style="justify-content:center"><a class="btn btn-primary" href="./">Back to home</a><a class="btn btn-ghost" href="{IG}" target="_blank" rel="noopener">Follow @{IG_HANDLE}</a></div>
  <p class="small" style="margin-top:28px">Questions about your order? Email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
</section>
"""
page("order-confirmed.html", "Order confirmed", "Thanks for your S4S Fitness order.", confirmed, extra_head='<meta name="robots" content="noindex">\n')

# ---------------------------------------------------------------- extras
pages = ["", "perform-fit-hoodie.html", "shop.html", "lookbook.html", "our-story.html", "team-orders.html", "delivery-returns.html", "contact.html", "privacy.html", "terms.html"]
with open(os.path.join(OUT, "sitemap.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            "".join(f"  <url><loc>{SITE}/{p}</loc></url>\n" for p in pages) + "</urlset>\n")
with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
print("done")
