/* ============================================================
   SwarmReply shared site header — single source of truth.
   Add to any page as the FIRST element inside <body>:
       <script src="/nav.js"></script>                 (full marketing nav)
       <script src="/nav.js" data-nav="lean"></script> (lean help-center nav)
   It injects its own (scoped, .srnav*) CSS + markup + mobile menu,
   and hides any legacy <nav class="nav"> / .mnav still in the page.
   Edit this file once; every page updates.
   ============================================================ */
(function () {
  var variant = (document.currentScript && document.currentScript.dataset.nav) || 'full';

  /* ---------- styles (scoped to .srnav*, var() with hard fallbacks) ---------- */
  var CSS = "\
.srnav{position:sticky;top:0;z-index:120;background:rgba(255,255,255,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line,#e4e0d8)}\
.srnav-inner{max-width:1160px;margin:0 auto;padding:0 28px;height:68px;display:flex;align-items:center;justify-content:space-between;gap:18px}\
.srnav-logo{display:flex;align-items:center;gap:10px;font-family:var(--serif,'Playfair Display',serif);font-weight:900;font-size:1.5rem;letter-spacing:-.02em;color:var(--ink,#0a0a0a);text-decoration:none}\
.srnav-logo img{width:42px;height:42px;object-fit:contain;display:block;flex-shrink:0}\
.srnav-links{display:flex;gap:30px;font-size:.88rem;font-weight:600;color:var(--taupe,#7a7670);align-items:center}\
.srnav-links a{color:inherit;text-decoration:none}\
.srnav-links a:hover{color:var(--ink,#0a0a0a)}\
.srnav-cta{display:flex;gap:10px;align-items:center}\
.srnav-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:50px;font-weight:700;font-family:var(--sans,'DM Sans',system-ui,sans-serif);cursor:pointer;border:none;text-decoration:none;padding:10px 20px;font-size:.86rem;transition:transform .18s,box-shadow .18s,background .18s,border-color .18s}\
.srnav-btn-ghost{border:1.5px solid var(--line,#e4e0d8);color:var(--ink,#0a0a0a);background:transparent}\
.srnav-btn-ghost:hover{border-color:var(--ink,#0a0a0a)}\
.srnav-btn-gold{background:var(--honey,#f5c842);color:var(--ink,#0a0a0a)}\
.srnav-btn-gold:hover{background:var(--amber,#d4a515);transform:translateY(-2px);box-shadow:0 10px 26px rgba(212,165,21,.38)}\
.srnav-dd{position:relative;display:inline-flex}\
.srnav-dd>a{display:inline-flex;align-items:center;gap:4px;color:inherit;text-decoration:none}\
.srnav-dd-menu{display:none;position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#fff;border:1px solid var(--line,#e4e0d8);border-radius:14px;box-shadow:0 18px 44px rgba(0,0,0,.12);padding:8px;min-width:175px;z-index:130}\
.srnav-dd-menu::before{content:'';position:absolute;top:-10px;left:0;right:0;height:10px}\
.srnav-dd:hover .srnav-dd-menu,.srnav-dd:focus-within .srnav-dd-menu{display:block}\
.srnav-dd-menu a{display:block;padding:9px 14px;border-radius:9px;font-size:.88rem;color:var(--tx,#1a1a18);text-decoration:none;white-space:nowrap}\
.srnav-dd-menu a:hover{background:var(--cream,#f8f7f4);color:var(--ink,#0a0a0a)}\
.srnav-mtoggle{display:none;background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:8px 11px;cursor:pointer;color:#1a1d21;font-size:1.1rem;line-height:1;margin-left:10px;flex-shrink:0}\
.srnav-mpanel{display:none;position:fixed;top:68px;left:0;right:0;z-index:998;background:rgba(255,255,255,.98);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid rgba(0,0,0,.08);box-shadow:0 18px 40px rgba(0,0,0,.12);padding:8px 22px 18px;flex-direction:column;max-height:calc(100vh - 68px);max-height:calc(100dvh - 68px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}\
.srnav-mpanel.open{display:flex}\
.srnav-mpanel a{padding:13px 4px;font-size:1.02rem;color:#1a1d21;text-decoration:none;border-bottom:1px solid rgba(0,0,0,.06);font-weight:600}\
.srnav-mpanel a:last-child{border-bottom:none}\
.srnav-msub{padding-left:22px!important;font-weight:500!important;color:var(--taupe,#7a7670)!important}\
.srnav-mcta{display:flex!important;gap:10px;margin-top:14px;border-bottom:none!important;padding:0!important}\
.srnav-mcta a{flex:1;text-align:center;border:none!important;border-radius:10px;padding:12px;font-weight:700;font-size:.95rem}\
.srnav-mlogin{background:rgba(0,0,0,.05);color:#1a1d21}\
.srnav-mstart{background:linear-gradient(135deg,#f4b400,#e89a00);color:#1a1408}\
body.srnav-lock{position:fixed;left:0;right:0;width:100%;overflow:hidden}\
body.srnav-lock .srnav{position:fixed;top:0;left:0;right:0;z-index:120}\
@media(max-width:960px){.srnav-links{display:none}.srnav-mtoggle{display:inline-flex;align-items:center}.srnav-cta .srnav-btn{padding:8px 14px!important;font-size:.8rem!important;white-space:nowrap}}\
@media(max-width:480px){.srnav-cta .srnav-btn-ghost{display:none}}\
nav.nav,.mnav,.mnav-btn{display:none!important}";

  /* ---------- markup ---------- */
  var LOGO = '<a href="/" class="srnav-logo"><img src="/bee-logo.png" alt="SwarmReply bee logo" width="42" height="42"><span>SwarmReply</span></a>';
  var CTA = '<div class="srnav-cta">'
    + '<a href="/login.html" class="srnav-btn srnav-btn-ghost">Log in</a>'
    + '<a href="/signup.html" class="srnav-btn srnav-btn-gold">Start now</a>'
    + '</div>';
  var MCTA = '<div class="srnav-mcta">'
    + '<a href="/login.html" class="srnav-mlogin">Log in</a>'
    + '<a href="/signup.html" class="srnav-mstart">Start now</a>'
    + '</div>';

  var desktopLinks, mobileLinks;

  if (variant === 'lean') {
    desktopLinks = '<div class="srnav-links">'
      + '<a href="/#pricing">Pricing</a>'
      + '<a href="/contact.html">Contact</a>'
      + '</div>';
    mobileLinks = '<a href="/#pricing">Pricing</a>'
      + '<a href="/contact.html">Contact</a>';
  } else {
    desktopLinks = '<div class="srnav-links">'
      + '<div class="srnav-dd"><a href="/features/">Product \u25be</a>'
        + '<div class="srnav-dd-menu">'
          + '<a href="/features/">All features \u2192</a>'
          + '<a href="/features/ai-review-replies.html">AI Review Replies</a>'
          + '<a href="/ai-search-visibility.html">AI Search Visibility</a>'
          + '<a href="/features/review-generation.html">Review Generation</a>'
          + '<a href="/features/listings.html">Business Listings</a>'
          + '<a href="/features/surveys.html">NPS Surveys</a>'
          + '<a href="/features/webchat.html">Webchat &amp; Widgets</a>'
          + '<a href="/features/integrations.html">Integrations</a>'
          + '<a href="/features/onboarding.html">Onboarding</a>'
        + '</div>'
      + '</div>'
      + '<div class="srnav-dd"><a href="/#compare">Compare \u25be</a>'
        + '<div class="srnav-dd-menu">'
          + '<a href="/compare/">All comparisons \u2192</a>'
          + '<a href="/compare/birdeye-alternative.html">vs Birdeye</a>'
          + '<a href="/compare/podium-alternative.html">vs Podium</a>'
          + '<a href="/compare/nicejob-alternative.html">vs NiceJob</a>'
          + '<a href="/compare/yext-alternative.html">vs Yext</a>'
          + '<a href="/compare/broadly-alternative.html">vs Broadly</a>'
          + '<a href="/compare/reviewtrackers-alternative.html">vs ReviewTrackers</a>'
        + '</div>'
      + '</div>'
      + '<a href="/#pricing">Pricing</a>'
      + '<a href="/#faq">FAQ</a>'
      + '<a href="/help.html">Help</a>'
      + '</div>';
    mobileLinks = '<a href="/features/">All features</a>'
      + '<a href="/features/ai-review-replies.html" class="srnav-msub">AI Review Replies</a>'
      + '<a href="/ai-search-visibility.html" class="srnav-msub">AI Search Visibility</a>'
      + '<a href="/features/review-generation.html" class="srnav-msub">Review Generation</a>'
      + '<a href="/features/listings.html" class="srnav-msub">Business Listings</a>'
      + '<a href="/features/surveys.html" class="srnav-msub">NPS Surveys</a>'
      + '<a href="/features/webchat.html" class="srnav-msub">Webchat &amp; Widgets</a>'
      + '<a href="/features/integrations.html" class="srnav-msub">Integrations</a>'
      + '<a href="/compare/">Compare</a>'
      + '<a href="/#pricing">Pricing</a>'
      + '<a href="/#faq">FAQ</a>'
      + '<a href="/help.html">Help</a>';
  }

  var navHTML = '<nav class="srnav" aria-label="Main"><div class="srnav-inner">'
    + LOGO + desktopLinks + CTA
    + '<button class="srnav-mtoggle" id="srnavToggle" aria-label="Open menu" aria-expanded="false" aria-controls="srnavPanel">\u2630</button>'
    + '</div>'
    + '<div class="srnav-mpanel" id="srnavPanel">' + mobileLinks + MCTA + '</div>'
    + '</nav>';

  /* ---------- inject ---------- */
  function injectCSS() {
    if (document.getElementById('srnav-style')) return;
    var st = document.createElement('style');
    st.id = 'srnav-style';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  function injectNav() {
    if (document.getElementById('srnavPanel')) return;
    if (!document.body) return;
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    wireMobile();
  }
  function wireMobile() {
    var btn = document.getElementById('srnavToggle');
    var panel = document.getElementById('srnavPanel');
    if (!btn || !panel) return;
    function setOpen(open) {
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('srnav-lock', open);
    }
    btn.addEventListener('click', function () { setOpen(!panel.classList.contains('open')); });
    panel.addEventListener('click', function (e) { if (e.target.tagName === 'A') setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) setOpen(false); });
  }

  injectCSS();
  if (document.body) {
    injectNav();
  } else {
    document.addEventListener('DOMContentLoaded', injectNav);
  }
})();
