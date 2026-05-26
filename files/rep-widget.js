/**
 * SwarmReply Reputation Widget
 * Drop-in script — shows live Google rating on any website
 *
 * Usage:
 *   <script src="https://swarmreply.com/rep-widget.js"
 *           data-token="YOUR_TOKEN" async></script>
 *
 * Optional attributes:
 *   data-style    = floating | bar | badge | card  (default: floating)
 *   data-position = bottom-right | bottom-left | top-right | top-left
 *   data-color    = #hex accent color
 */
(function () {
  'use strict';

  var script   = document.currentScript ||
                 document.querySelector('script[data-token]');
  if (!script) return;

  var TOKEN    = script.getAttribute('data-token');
  var STYLE    = script.getAttribute('data-style')    || 'floating';
  var POSITION = script.getAttribute('data-position') || null; // server default
  var COLOR    = script.getAttribute('data-color')    || null;
  var API      = 'https://YOUR-RAILWAY-URL.up.railway.app/api';

  if (!TOKEN) { console.warn('[SwarmReply] data-token is required'); return; }

  // Don't render twice
  if (document.getElementById('sr-rep-widget')) return;

  function stars(rating) {
    var full  = Math.round(rating);
    var empty = 5 - full;
    return '★'.repeat(full) + '☆'.repeat(empty);
  }

  function trackClick() {
    fetch(API + '/rep-widget/' + TOKEN + '/click', { method: 'POST' }).catch(function(){});
  }

  function renderFloating(data) {
    var pos      = POSITION || data.position || 'bottom-right';
    var accent   = COLOR    || data.accentColor || '#f5c842';
    var isRight  = pos.includes('right');
    var isBottom = pos.includes('bottom');

    var container = document.createElement('div');
    container.id  = 'sr-rep-widget';
    container.style.cssText = [
      'position:fixed',
      isBottom ? 'bottom:20px' : 'top:20px',
      isRight  ? 'right:20px'  : 'left:20px',
      'z-index:999999',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    ].join(';');

    var reviewUrl = data.reviewLink ||
      (data.placeId
        ? 'https://search.google.com/local/writereview?placeid=' + data.placeId
        : 'https://www.google.com/search?q=' + encodeURIComponent(data.businessName + ' reviews'));

    container.innerHTML = [
      '<div id="sr-widget-inner" style="',
        'background:white;',
        'border:1px solid #e4e0d8;',
        'border-radius:14px;',
        'box-shadow:0 4px 24px rgba(0,0,0,.13);',
        'padding:14px 18px;',
        'cursor:pointer;',
        'transition:transform .15s,box-shadow .15s;',
        'min-width:180px;',
        'border-top:3px solid ' + accent + ';',
        '">',
          '<div style="font-size:11px;font-weight:700;color:#7a7670;',
               'letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px">',
            'Google Reviews',
          '</div>',
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">',
            '<span style="font-size:22px;font-weight:900;color:#0a0a0a;line-height:1">',
              data.avgRating.toFixed(1),
            '</span>',
            '<span style="font-size:17px;color:' + accent + ';letter-spacing:1px">',
              stars(data.avgRating),
            '</span>',
          '</div>',
          data.showCount
            ? '<div style="font-size:12px;color:#7a7670;margin-bottom:10px">' +
                data.reviewCount.toLocaleString() + ' reviews' +
              '</div>'
            : '',
          '<a href="' + reviewUrl + '" target="_blank" rel="noopener"',
             ' id="sr-cta-btn"',
             ' onclick="(function(){var f=fetch(\'' + API + '/rep-widget/' + TOKEN + '/click\',{method:\'POST\'}).catch(function(){});})()" ',
             ' style="',
               'display:block;text-align:center;',
               'background:' + accent + ';',
               'color:#0a0a0a;',
               'padding:7px 14px;',
               'border-radius:50px;',
               'font-size:12px;font-weight:700;',
               'text-decoration:none;',
               'transition:opacity .15s;',
             '">',
            data.ctaText || 'Leave a review',
          '</a>',
      '</div>',
    ].join('');

    // Hover effect
    var inner = container.querySelector('#sr-widget-inner');
    inner.addEventListener('mouseenter', function() {
      this.style.transform  = 'translateY(-2px)';
      this.style.boxShadow  = '0 8px 32px rgba(0,0,0,.18)';
    });
    inner.addEventListener('mouseleave', function() {
      this.style.transform  = '';
      this.style.boxShadow  = '0 4px 24px rgba(0,0,0,.13)';
    });

    document.body.appendChild(container);
  }

  function renderBar(data) {
    var accent  = COLOR || data.accentColor || '#f5c842';
    var reviewUrl = data.reviewLink || '#';

    var bar       = document.createElement('div');
    bar.id        = 'sr-rep-widget';
    bar.style.cssText = [
      'position:fixed;bottom:0;left:0;right:0;',
      'background:white;border-top:3px solid ' + accent + ';',
      'box-shadow:0 -2px 20px rgba(0,0,0,.1);',
      'z-index:999999;',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'padding:10px 20px;',
      'display:flex;align-items:center;justify-content:center;gap:16px;',
    ].join('');

    bar.innerHTML = [
      '<span style="font-size:13px;font-weight:700;color:#0a0a0a">',
        data.businessName,
      '</span>',
      '<span style="font-size:15px;color:' + accent + '">' + stars(data.avgRating) + '</span>',
      '<span style="font-size:14px;font-weight:900;color:#0a0a0a">' + data.avgRating.toFixed(1) + '</span>',
      data.showCount
        ? '<span style="font-size:12px;color:#7a7670">' + data.reviewCount.toLocaleString() + ' Google reviews</span>'
        : '',
      '<a href="' + reviewUrl + '" target="_blank" rel="noopener"',
         ' style="background:' + accent + ';color:#0a0a0a;padding:6px 16px;',
         'border-radius:50px;font-size:12px;font-weight:700;text-decoration:none;',
         'white-space:nowrap"',
         ' onclick="' + trackClick.toString() + '()">',
        data.ctaText || 'Leave a review',
      '</a>',
      '<button onclick="document.getElementById(\'sr-rep-widget\').style.display=\'none\'"',
             ' style="background:none;border:none;cursor:pointer;color:#7a7670;',
             'font-size:18px;padding:0 4px;line-height:1">×</button>',
    ].join('');

    document.body.appendChild(bar);
  }

  // Fetch data and render
  fetch(API + '/rep-widget/' + TOKEN + '/data')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) return;
      var style = STYLE || data.style || 'floating';
      if (style === 'bar')           renderBar(data);
      else                           renderFloating(data);
    })
    .catch(function(err) {
      console.warn('[SwarmReply] Widget failed to load:', err.message);
    });
})();
