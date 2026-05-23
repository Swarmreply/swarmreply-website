/*!
 * SwarmReply Review Widget v1.0
 * Embed your best Google reviews on any website
 * One <script> tag — no dependencies, no jQuery, no framework
 * https://swarmreply.com
 *
 * USAGE:
 * <div id="swarmreply-widget"></div>
 * <script
 *   src="https://swarmreply.com/widget.js"
 *   data-token="YOUR_WIDGET_TOKEN"
 *   data-container="swarmreply-widget"
 * ></script>
 *
 * OPTIONS (all optional — set via data-* attributes):
 *   data-token        Required. Your widget token from the dashboard.
 *   data-container    ID of the element to render into. Default: "swarmreply-widget"
 *   data-layout       carousel | grid | badge | list. Default: from dashboard settings.
 *   data-theme        light | dark. Default: from dashboard settings.
 *   data-max          Max reviews to show (1–20). Default: from dashboard settings.
 *   data-min-stars    Minimum star rating (1–5). Default: from dashboard settings.
 */

(function (window, document) {
  'use strict';

  // ─── CONFIG ───────────────────────────────
  var API_BASE = 'https://your-railway-url.up.railway.app/api';
  var WIDGET_VERSION = '1.0.0';

  // ─── FIND THE SCRIPT TAG ──────────────────
  // Works even if multiple widgets are on one page
  var scripts = document.querySelectorAll('script[data-token]');
  if (!scripts.length) {
    console.warn('[SwarmReply] No data-token found on widget script tag.');
    return;
  }

  // Process each widget instance on the page
  for (var s = 0; s < scripts.length; s++) {
    initWidget(scripts[s]);
  }

  function initWidget(scriptTag) {
    var token       = scriptTag.getAttribute('data-token');
    var containerId = scriptTag.getAttribute('data-container') || 'swarmreply-widget';
    var layoutOverride = scriptTag.getAttribute('data-layout');
    var themeOverride  = scriptTag.getAttribute('data-theme');
    var maxOverride    = parseInt(scriptTag.getAttribute('data-max'), 10);
    var minStarsOverride = parseInt(scriptTag.getAttribute('data-min-stars'), 10);

    if (!token) return;

    var container = document.getElementById(containerId);
    if (!container) {
      // Try to render after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          container = document.getElementById(containerId);
          if (container) render(container, token, { layoutOverride, themeOverride, maxOverride, minStarsOverride });
        });
      }
      return;
    }

    render(container, token, { layoutOverride, themeOverride, maxOverride, minStarsOverride });
  }

  // ─── FETCH & RENDER ───────────────────────

  function render(container, token, overrides) {
    // Show loading skeleton
    container.innerHTML = buildSkeleton();
    injectBaseStyles();

    fetch(API_BASE + '/widget/' + token, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Widget not found');
        return res.json();
      })
      .then(function (data) {
        // Apply overrides from script tag attributes
        if (overrides.layoutOverride)     data.layout = overrides.layoutOverride;
        if (overrides.themeOverride)      data.theme  = overrides.themeOverride;
        if (overrides.maxOverride > 0)    data.reviews = data.reviews.slice(0, overrides.maxOverride);
        if (overrides.minStarsOverride > 0) {
          data.reviews = data.reviews.filter(function (r) {
            return r.rating >= overrides.minStarsOverride;
          });
        }

        container.innerHTML = '';

        // Inject JSON-LD if enabled
        if (data.jsonLd) injectJsonLd(data.jsonLd, token);

        // Render the widget
        switch (data.layout) {
          case 'grid':    renderGrid(container, data); break;
          case 'badge':   renderBadge(container, data); break;
          case 'list':    renderList(container, data); break;
          default:        renderCarousel(container, data); break;
        }
      })
      .catch(function (err) {
        container.innerHTML = '';
        console.error('[SwarmReply] Widget error:', err.message);
      });
  }

  // ─── CAROUSEL LAYOUT ─────────────────────

  function renderCarousel(container, data) {
    if (!data.reviews || !data.reviews.length) {
      container.innerHTML = '';
      return;
    }

    var id = 'sr-carousel-' + Math.random().toString(36).substr(2, 6);
    var isDark = data.theme === 'dark';
    var accent = data.accentColor || '#f5c842';
    var r = data.borderRadius !== undefined ? data.borderRadius : 12;

    var css = buildThemeCss(id, isDark, accent, r);
    var html = '<div id="' + id + '" class="sr-widget sr-carousel" data-theme="' + data.theme + '">'
      + '<div class="sr-header">'
      + buildStarRow(data.stats.avgRating, data.stats.totalReviews, accent)
      + '</div>'
      + '<div class="sr-track-wrap"><div class="sr-track" id="' + id + '-track">';

    data.reviews.forEach(function (review) {
      html += buildReviewCard(review, data, accent);
    });

    html += '</div></div>'
      + buildCarouselControls(id, accent)
      + buildAttribution(data, accent)
      + '</div>';

    injectStyle(id + '-css', css);
    container.innerHTML = html;

    // Carousel behaviour
    activateCarousel(id, data.reviews.length);
  }

  // ─── GRID LAYOUT ─────────────────────────

  function renderGrid(container, data) {
    if (!data.reviews || !data.reviews.length) return;

    var id = 'sr-grid-' + Math.random().toString(36).substr(2, 6);
    var isDark = data.theme === 'dark';
    var accent = data.accentColor || '#f5c842';
    var r = data.borderRadius !== undefined ? data.borderRadius : 12;
    var css = buildThemeCss(id, isDark, accent, r);
    var html = '<div id="' + id + '" class="sr-widget sr-grid" data-theme="' + data.theme + '">'
      + '<div class="sr-header">'
      + buildStarRow(data.stats.avgRating, data.stats.totalReviews, accent)
      + '</div>'
      + '<div class="sr-grid-inner">';

    data.reviews.forEach(function (review) {
      html += buildReviewCard(review, data, accent);
    });

    html += '</div>' + buildAttribution(data, accent) + '</div>';

    injectStyle(id + '-css', css);
    container.innerHTML = html;
  }

  // ─── LIST LAYOUT ─────────────────────────

  function renderList(container, data) {
    if (!data.reviews || !data.reviews.length) return;

    var id = 'sr-list-' + Math.random().toString(36).substr(2, 6);
    var isDark = data.theme === 'dark';
    var accent = data.accentColor || '#f5c842';
    var r = data.borderRadius !== undefined ? data.borderRadius : 12;
    var css = buildThemeCss(id, isDark, accent, r);
    var html = '<div id="' + id + '" class="sr-widget sr-list" data-theme="' + data.theme + '">'
      + '<div class="sr-header">'
      + buildStarRow(data.stats.avgRating, data.stats.totalReviews, accent)
      + '</div>';

    data.reviews.forEach(function (review) {
      html += buildReviewCard(review, data, accent);
    });

    html += buildAttribution(data, accent) + '</div>';

    injectStyle(id + '-css', css);
    container.innerHTML = html;
  }

  // ─── BADGE LAYOUT ────────────────────────

  function renderBadge(container, data) {
    var id = 'sr-badge-' + Math.random().toString(36).substr(2, 6);
    var isDark = data.theme === 'dark';
    var accent = data.accentColor || '#f5c842';
    var bg    = isDark ? '#0a0a0a' : '#ffffff';
    var txt   = isDark ? '#ffffff' : '#0a0a0a';
    var brd   = isDark ? '#2a2a2a' : '#e4e0d8';
    var r     = data.borderRadius !== undefined ? data.borderRadius : 12;
    var rating = (data.stats.avgRating || 0).toFixed(1);
    var count  = data.stats.totalReviews || 0;
    var stars  = buildStarString(data.stats.avgRating, accent);
    var ctaHtml = (data.showCta && data.ctaUrl)
      ? '<a href="' + escapeHtml(data.ctaUrl) + '" target="_blank" rel="noopener" '
        + 'style="display:block;margin-top:10px;padding:7px 16px;border-radius:50px;'
        + 'background:' + accent + ';color:#0a0a0a;font-size:12px;font-weight:700;'
        + 'text-decoration:none;text-align:center;">'
        + escapeHtml(data.ctaText || 'Leave a review') + '</a>'
      : '';

    var html = '<div id="' + id + '" style="'
      + 'display:inline-block;background:' + bg + ';border:1px solid ' + brd + ';'
      + 'border-radius:' + r + 'px;padding:16px 20px;'
      + 'font-family:' + (data.fontFamily || '-apple-system,sans-serif') + ';'
      + 'box-shadow:0 2px 8px rgba(0,0,0,0.08);min-width:180px;">'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:0.06em;'
        + 'text-transform:uppercase;color:' + (isDark ? 'rgba(255,255,255,0.4)' : '#7a7670')
        + ';margin-bottom:6px;">' + escapeHtml(data.businessName) + '</div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">'
        + '<span style="font-size:22px;font-weight:900;color:' + txt + ';line-height:1">' + rating + '</span>'
        + '<span style="font-size:15px;letter-spacing:1px">' + stars + '</span>'
      + '</div>'
      + '<div style="font-size:11px;color:' + (isDark ? 'rgba(255,255,255,0.35)' : '#7a7670') + ';">'
        + count + ' Google reviews</div>'
      + ctaHtml
      + '</div>';

    container.innerHTML = html;
  }

  // ─── SHARED CARD BUILDER ─────────────────

  function buildReviewCard(review, data, accent) {
    var initials = getInitials(review.name);
    var stars    = buildStarString(review.rating, accent);
    var replyHtml = (data.showReply && review.reply)
      ? '<div class="sr-reply"><span class="sr-reply-label">Response from owner</span>'
        + '<p>' + escapeHtml(review.reply) + '</p></div>'
      : '';
    var metaHtml = '';
    if (data.showDate && review.date) metaHtml += '<span>' + review.date + '</span>';
    if (data.showPlatform) {
      metaHtml += '<span class="sr-platform-badge">'
        + (review.platform === 'yelp' ? 'Yelp' : review.platform === 'tripadvisor' ? 'TripAdvisor' : 'Google')
        + '</span>';
    }

    return '<div class="sr-card">'
      + '<div class="sr-card-top">'
        + '<div class="sr-avatar">' + escapeHtml(initials) + '</div>'
        + '<div class="sr-reviewer">'
          + (data.showReviewer
            ? '<div class="sr-name">' + escapeHtml(review.name) + '</div>'
            : '')
          + '<div class="sr-stars">' + stars + '</div>'
        + '</div>'
      + '</div>'
      + '<p class="sr-text">' + escapeHtml(review.text) + '</p>'
      + replyHtml
      + (metaHtml ? '<div class="sr-meta">' + metaHtml + '</div>' : '')
      + '</div>';
  }

  function buildStarRow(avgRating, totalReviews, accent) {
    var stars  = buildStarString(avgRating, accent);
    var rating = (avgRating || 0).toFixed(1);
    return '<div class="sr-agg">'
      + '<span class="sr-agg-rating">' + rating + '</span>'
      + '<span class="sr-agg-stars">' + stars + '</span>'
      + '<span class="sr-agg-count">Based on ' + (totalReviews || 0) + ' Google reviews</span>'
      + '</div>';
  }

  function buildCarouselControls(id, accent) {
    return '<div class="sr-controls">'
      + '<button class="sr-btn sr-prev" aria-label="Previous" onclick="window._srPrev(\'' + id + '\')">‹</button>'
      + '<div class="sr-dots" id="' + id + '-dots"></div>'
      + '<button class="sr-btn sr-next" aria-label="Next" onclick="window._srNext(\'' + id + '\')">›</button>'
      + '</div>';
  }

  function buildAttribution(data, accent) {
    var ctaHtml = '';
    if (data.showCta && data.ctaUrl) {
      ctaHtml = '<a href="' + escapeHtml(data.ctaUrl) + '" '
        + 'target="_blank" rel="noopener" class="sr-cta">'
        + escapeHtml(data.ctaText || 'Leave us a review') + ' →</a>';
    }
    return '<div class="sr-footer">'
      + ctaHtml
      + '<a href="https://swarmreply.com" target="_blank" rel="noopener" class="sr-attribution">'
        + 'Powered by SwarmReply</a>'
      + '</div>';
  }

  // ─── CAROUSEL LOGIC ──────────────────────

  function activateCarousel(id, total) {
    var state = { current: 0, total: total };
    window['_srState_' + id] = state;

    var dotsEl = document.getElementById(id + '-dots');
    if (dotsEl) {
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.className = 'sr-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
        dot.setAttribute('data-idx', i);
        dot.onclick = (function (idx) {
          return function () { goTo(id, idx); };
        })(i);
        dotsEl.appendChild(dot);
      }
    }

    // Auto-advance every 5 seconds
    var timer = setInterval(function () {
      var s = window['_srState_' + id];
      if (s) goTo(id, (s.current + 1) % s.total);
    }, 5000);

    // Pause on hover
    var widget = document.getElementById(id);
    if (widget) {
      widget.addEventListener('mouseenter', function () { clearInterval(timer); });
    }
  }

  function goTo(id, idx) {
    var state = window['_srState_' + id];
    if (!state) return;
    state.current = idx;

    var track = document.getElementById(id + '-track');
    if (track) {
      var cards = track.querySelectorAll('.sr-card');
      var visibleCount = getVisibleCount(track);
      var maxOffset = Math.max(0, cards.length - visibleCount);
      var offset = Math.min(idx, maxOffset);
      track.style.transform = 'translateX(calc(' + offset + ' * (-100% - 16px)))';
    }

    var dotsEl = document.getElementById(id + '-dots');
    if (dotsEl) {
      var dots = dotsEl.querySelectorAll('.sr-dot');
      for (var i = 0; i < dots.length; i++) {
        dots[i].className = 'sr-dot' + (i === idx ? ' active' : '');
      }
    }
  }

  function getVisibleCount(track) {
    var w = track.parentElement ? track.parentElement.offsetWidth : 800;
    if (w < 500)  return 1;
    if (w < 800)  return 2;
    return 3;
  }

  window._srPrev = function (id) {
    var s = window['_srState_' + id];
    if (!s) return;
    goTo(id, (s.current - 1 + s.total) % s.total);
  };
  window._srNext = function (id) {
    var s = window['_srState_' + id];
    if (!s) return;
    goTo(id, (s.current + 1) % s.total);
  };

  // ─── STYLES ──────────────────────────────

  function buildThemeCss(id, isDark, accent, radius) {
    var bg       = isDark ? '#0a0a0a'              : '#ffffff';
    var cardBg   = isDark ? '#141414'              : '#f8f7f4';
    var border   = isDark ? '#222'                  : '#e4e0d8';
    var text     = isDark ? '#ffffff'              : '#1a1a18';
    var muted    = isDark ? 'rgba(255,255,255,.4)' : '#7a7670';
    var replyBg  = isDark ? '#1a1a1a'              : '#f0eeea';
    var replyBorder = isDark ? '#2a2a2a'           : '#e4e0d8';
    var avatarBg = isDark ? '#222'                 : '#e4e0d8';

    return '#' + id + ' {'
      + 'all:initial;display:block;'
      + 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;'
      + 'font-size:14px;line-height:1.5;color:' + text + ';'
      + 'background:' + bg + ';'
      + 'border:1px solid ' + border + ';'
      + 'border-radius:' + (radius + 4) + 'px;'
      + 'padding:24px;overflow:hidden;'
      + 'box-sizing:border-box;'
      + '}'
      + '#' + id + ' *{box-sizing:border-box;}'
      + '#' + id + ' .sr-header{margin-bottom:20px}'
      + '#' + id + ' .sr-agg{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
      + '#' + id + ' .sr-agg-rating{font-size:1.6rem;font-weight:700;color:' + text + ';line-height:1}'
      + '#' + id + ' .sr-agg-stars{font-size:1.1rem;letter-spacing:2px}'
      + '#' + id + ' .sr-agg-count{font-size:0.78rem;color:' + muted + ';}'
      /* Carousel */
      + '#' + id + '.sr-carousel .sr-track-wrap{overflow:hidden}'
      + '#' + id + '.sr-carousel .sr-track{'
        + 'display:flex;gap:16px;transition:transform 0.4s ease;will-change:transform;'
        + 'align-items:stretch;'
        + '}'
      + '#' + id + '.sr-carousel .sr-card{flex:0 0 calc(33.333% - 11px);min-width:220px}'
      /* Grid */
      + '#' + id + '.sr-grid .sr-grid-inner{'
        + 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;'
        + '}'
      /* List */
      + '#' + id + '.sr-list .sr-card{margin-bottom:12px}'
      + '#' + id + '.sr-list .sr-card:last-child{margin-bottom:0}'
      /* Card */
      + '#' + id + ' .sr-card{'
        + 'background:' + cardBg + ';border:1px solid ' + border + ';'
        + 'border-radius:' + radius + 'px;padding:18px;'
        + 'display:flex;flex-direction:column;'
        + '}'
      + '#' + id + ' .sr-card-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}'
      + '#' + id + ' .sr-avatar{'
        + 'width:36px;height:36px;border-radius:50%;'
        + 'background:' + avatarBg + ';'
        + 'display:flex;align-items:center;justify-content:center;'
        + 'font-size:0.78rem;font-weight:700;color:' + muted + ';flex-shrink:0;'
        + '}'
      + '#' + id + ' .sr-name{font-weight:600;font-size:0.875rem;color:' + text + ';}'
      + '#' + id + ' .sr-stars{font-size:0.78rem;letter-spacing:1px;margin-top:2px}'
      + '#' + id + ' .sr-text{'
        + 'font-size:0.875rem;color:' + (isDark ? 'rgba(255,255,255,.65)' : '#4a4a48') + ';'
        + 'line-height:1.7;flex:1;font-style:italic;margin:0 0 10px;'
        + '}'
      + '#' + id + ' .sr-text::before{content:\'\\201C\';}'
      + '#' + id + ' .sr-text::after{content:\'\\201D\';}'
      + '#' + id + ' .sr-reply{'
        + 'background:' + replyBg + ';border-left:3px solid ' + accent + ';'
        + 'padding:8px 12px;border-radius:0 6px 6px 0;margin-bottom:10px;'
        + '}'
      + '#' + id + ' .sr-reply-label{font-size:0.7rem;font-weight:700;letter-spacing:.06em;'
        + 'text-transform:uppercase;color:' + muted + ';display:block;margin-bottom:4px}'
      + '#' + id + ' .sr-reply p{font-size:0.8rem;color:' + (isDark ? 'rgba(255,255,255,.55)' : '#4a4a48') + ';margin:0;line-height:1.6}'
      + '#' + id + ' .sr-meta{display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:10px;'
        + 'border-top:1px solid ' + border + ';flex-wrap:wrap}'
      + '#' + id + ' .sr-meta span{font-size:0.72rem;color:' + muted + ';}'
      + '#' + id + ' .sr-platform-badge{background:' + (isDark ? '#222' : '#f0eeea') + ';'
        + 'padding:2px 8px;border-radius:50px;font-size:0.68rem;font-weight:600;color:' + muted + '}'
      /* Controls */
      + '#' + id + ' .sr-controls{'
        + 'display:flex;align-items:center;justify-content:center;'
        + 'gap:12px;margin-top:16px;'
        + '}'
      + '#' + id + ' .sr-btn{'
        + 'width:32px;height:32px;border-radius:50%;'
        + 'border:1px solid ' + border + ';background:' + bg + ';'
        + 'color:' + text + ';font-size:1.2rem;cursor:pointer;'
        + 'display:flex;align-items:center;justify-content:center;'
        + 'transition:all .15s;line-height:1;'
        + '}'
      + '#' + id + ' .sr-btn:hover{background:' + accent + ';border-color:' + accent + ';color:#0a0a0a}'
      + '#' + id + ' .sr-dots{display:flex;gap:6px;align-items:center}'
      + '#' + id + ' .sr-dot{'
        + 'width:7px;height:7px;border-radius:50%;border:none;cursor:pointer;'
        + 'background:' + border + ';transition:all .15s;padding:0;'
        + '}'
      + '#' + id + ' .sr-dot.active{background:' + accent + ';width:18px;border-radius:50px}'
      /* Footer */
      + '#' + id + ' .sr-footer{'
        + 'display:flex;align-items:center;justify-content:space-between;'
        + 'margin-top:16px;padding-top:14px;'
        + 'border-top:1px solid ' + border + ';flex-wrap:wrap;gap:8px;'
        + '}'
      + '#' + id + ' .sr-cta{'
        + 'padding:8px 18px;border-radius:50px;background:' + accent + ';'
        + 'color:#0a0a0a;font-size:0.8rem;font-weight:700;'
        + 'text-decoration:none;transition:opacity .15s;display:inline-block;'
        + '}'
      + '#' + id + ' .sr-cta:hover{opacity:.85}'
      + '#' + id + ' .sr-attribution{'
        + 'font-size:0.7rem;color:' + muted + ';text-decoration:none;margin-left:auto;'
        + '}'
      + '#' + id + ' .sr-attribution:hover{color:' + text + '}'
      /* Responsive */
      + '@media(max-width:640px){'
        + '#' + id + '.sr-carousel .sr-card{flex:0 0 calc(100% - 0px)}'
        + '#' + id + '.sr-grid .sr-grid-inner{grid-template-columns:1fr}'
        + '}'
      + '@media(min-width:641px) and (max-width:900px){'
        + '#' + id + '.sr-carousel .sr-card{flex:0 0 calc(50% - 8px)}'
        + '}';
  }

  function buildSkeleton() {
    return '<div style="padding:24px;border:1px solid #e4e0d8;border-radius:16px;background:#f8f7f4;">'
      + '<div style="display:flex;gap:10px;margin-bottom:20px;">'
        + '<div style="width:80px;height:28px;background:#e4e0d8;border-radius:50px;animation:sr-pulse 1.5s ease infinite"></div>'
        + '<div style="width:120px;height:28px;background:#e4e0d8;border-radius:50px;animation:sr-pulse 1.5s ease .1s infinite"></div>'
      + '</div>'
      + '<div style="display:flex;gap:14px;">'
        + [0, 0, 0].map(function (_, i) {
            return '<div style="flex:1;background:#e4e0d8;border-radius:12px;height:140px;'
              + 'animation:sr-pulse 1.5s ease ' + (i * 0.1) + 's infinite"></div>';
          }).join('')
      + '</div>'
      + '<style>@keyframes sr-pulse{0%,100%{opacity:1}50%{opacity:0.4}}</style>'
      + '</div>';
  }

  // ─── UTILS ───────────────────────────────

  function buildStarString(rating, accent) {
    var full  = Math.round(rating || 0);
    var empty = 5 - full;
    return '<span style="color:' + accent + '">' + '★'.repeat(full) + '</span>'
         + '<span style="color:#e4e0d8">' + '★'.repeat(empty) + '</span>';
  }

  function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectBaseStyles() {
    injectStyle('sr-base', '@keyframes sr-pulse{0%,100%{opacity:1}50%{opacity:.4}}');
  }

  function injectJsonLd(jsonLd, token) {
    var existing = document.getElementById('sr-jsonld-' + token);
    if (existing) return;
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'sr-jsonld-' + token;
    script.textContent = jsonLd;
    document.head.appendChild(script);
  }

})(window, document);
