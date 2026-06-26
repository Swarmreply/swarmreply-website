/* attribution.js — first-touch acquisition capture.
 *
 * Add <script src="/attribution.js"></script> to your landing pages (the
 * homepage at minimum) so the utm_* / gclid from an ad click survive the
 * navigation to /signup.html. It stores the FIRST touch once in localStorage
 * and never overwrites it, then exposes window.srAttribution() which the signup
 * page reads and sends to /customers/register.
 *
 * Privacy note: this only records campaign tags, referrer, and landing path —
 * no personal data — and stays in the visitor's own browser until they sign up.
 */
(function () {
  var KEY = 'sr_attribution';
  var FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];

  function fromUrl() {
    try {
      var p = new URLSearchParams(window.location.search);
      var out = {}, any = false;
      FIELDS.forEach(function (k) {
        var v = p.get(k);
        if (v) { out[k] = String(v).slice(0, 300); any = true; }
      });
      out.referrer = (document.referrer || '').slice(0, 300);
      out.landing_path = (window.location.pathname || '').slice(0, 300);
      // Worth storing if there are campaign tags OR an external referrer.
      var externalRef = out.referrer && out.referrer.indexOf(window.location.host) === -1;
      return (any || externalRef) ? out : null;
    } catch (e) { return null; }
  }

  // Store first touch once.
  try {
    if (!localStorage.getItem(KEY)) {
      var first = fromUrl();
      if (first) { first.ts = Date.now(); localStorage.setItem(KEY, JSON.stringify(first)); }
    }
  } catch (e) {}

  // Reader for the signup page: stored first-touch wins, current URL fills gaps.
  window.srAttribution = function () {
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    var live = fromUrl() || {};
    var merged = {};
    FIELDS.concat(['referrer', 'landing_path']).forEach(function (k) {
      merged[k] = stored[k] || live[k] || null;
    });
    merged.signup_source = merged.utm_source || (merged.referrer ? 'referral' : 'direct');
    return merged;
  };
})();
