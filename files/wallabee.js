// ============================================
// files/wallabee.js  —  v6 (Yext, Broadly, ReviewTrackers comparisons + hub)
// Wallabee — SwarmReply's floating support bee, for the marketing site.
// Self-contained: inject <script src="/wallabee.js" defer></script> on any
// page. Answers come from the Help Center catalog (word-overlap matching,
// instant + free). Visitors aren't logged in, so escalation is a prefilled
// mailto to hello@swarmreply.com. Conversation persists per-tab via
// sessionStorage.
// ============================================
(function () {
  'use strict';
  if (window.__wallabeeLoaded) return;
  window.__wallabeeLoaded = true;

  var HELP_BASE = '/help';
  var SUPPORT_EMAIL = 'hello@swarmreply.com';
  var STORE_KEY = 'wallabee_site_v1';

  // Help Center catalog — mirrors help.html. Add new articles in both places.
  var ARTICLES = [
    { id: 'vs-yext', t: 'SwarmReply vs Yext — own your listings, don\u2019t rent them', c: 'Compare', u: '/compare/yext-alternative.html', k: 'yext alternative listings compare versus rent own sync' },
    { id: 'vs-broadly', t: 'SwarmReply vs Broadly — honest comparison', c: 'Compare', u: '/compare/broadly-alternative.html', k: 'broadly alternative compare versus price cheaper onboarding' },
    { id: 'vs-reviewtrackers', t: 'SwarmReply vs ReviewTrackers — honest comparison', c: 'Compare', u: '/compare/reviewtrackers-alternative.html', k: 'reviewtrackers alternative compare versus monitoring' },
    { id: 'vs-birdeye', t: 'SwarmReply vs Birdeye — honest comparison', c: 'Compare', u: '/compare/birdeye-alternative.html', k: 'birdeye alternative compare versus price cheaper switch' },
    { id: 'vs-podium', t: 'SwarmReply vs Podium — honest comparison', c: 'Compare', u: '/compare/podium-alternative.html', k: 'podium alternative compare versus price cheaper switch contract' },
    { id: 'vs-nicejob', t: 'SwarmReply vs NiceJob — honest comparison', c: 'Compare', u: '/compare/nicejob-alternative.html', k: 'nicejob alternative compare versus reviews only' },
    { id: 'ai-visibility-explained', t: 'AI search visibility — show up in ChatGPT answers', c: 'Get Found', u: '/ai-search-visibility.html', k: 'chatgpt gemini claude ai visibility recommendations search appear' },
    { id: 'welcome', t: 'Welcome to SwarmReply', c: 'Getting started' },
    { id: 'connect-google', t: 'How to connect Google Business Profile', c: 'Getting started' },
    { id: 'first-review-request', t: 'Sending your first review request', c: 'Getting started' },
    { id: 'onboarding-checklist', t: 'Onboarding checklist', c: 'Getting started' },
    { id: 'invite-team', t: 'Inviting team members', c: 'Getting started' },
    { id: 'reply-templates', t: 'Customising AI reply style', c: 'AI Replies' },
    { id: 'edit-reply', t: 'Reviewing replies before they post', c: 'AI Replies' },
    { id: 'reply-quality', t: 'How reply quality is protected', c: 'AI Replies' },
    { id: 'multi-language', t: 'Multi-language replies', c: 'AI Replies' },
    { id: 'import-contacts', t: 'Importing contacts from CSV', c: 'Review Generation' },
    { id: 'review-platforms', t: 'Choosing your review platform', c: 'Review Generation' },
    { id: 'sms-requests', t: 'Sending review requests via SMS', c: 'Review Generation' },
    { id: 'template-customise', t: 'Customising review request templates', c: 'Review Generation' },
    { id: 'review-widget', t: 'Setting up the review widget', c: 'Review Generation' },
    { id: 'request-timing', t: 'When to send review requests', c: 'Review Generation' },
    { id: 'bulk-send', t: 'Sending review requests in bulk', c: 'Review Generation' },
    { id: 'survey-setup', t: 'Setting up your NPS survey', c: 'Surveys & NPS' },
    { id: 'nps-routing', t: 'How NPS routing works', c: 'Surveys & NPS' },
    { id: 'promoter-destination', t: 'Setting your promoter destination', c: 'Surveys & NPS' },
    { id: 'survey-link', t: 'Sharing your survey link', c: 'Surveys & NPS' },
    { id: 'detractor-handling', t: 'Handling detractor responses', c: 'Surveys & NPS' },
    { id: 'embed-webchat', t: 'Adding the webchat widget to your website', c: 'Webchat & Inbox' },
    { id: 'webchat-setup', t: 'Webchat appearance settings', c: 'Webchat & Inbox' },
    { id: 'ai-agent-setup', t: 'Setting up the AI chat agent', c: 'Webchat & Inbox' },
    { id: 'knowledge-base', t: 'Building your AI knowledge base', c: 'Webchat & Inbox' },
    { id: 'handoff', t: 'How handoffs work', c: 'Webchat & Inbox' },
    { id: 'inbox-manage', t: 'Managing your inbox', c: 'Webchat & Inbox' },
    { id: 'sms-bridge', t: 'How the SMS bridge works', c: 'Webchat & Inbox' },
    { id: 'webchat-notifications', t: 'Webchat notification settings', c: 'Webchat & Inbox' },
    { id: 'sms-campaign', t: 'Creating your first SMS campaign', c: 'SMS Campaigns' },
    { id: 'contact-import', t: 'Importing contacts for campaigns', c: 'SMS Campaigns' },
    { id: 'segments', t: 'Creating audience segments', c: 'SMS Campaigns' },
    { id: 'campaign-limits', t: 'SMS campaign limits by plan', c: 'SMS Campaigns' },
    { id: 'tcpa-compliance', t: 'TCPA compliance guide', c: 'SMS Campaigns' },
    { id: 'opt-outs', t: 'Managing opt-outs', c: 'SMS Campaigns' },
    { id: 'sms-best-practices', t: 'SMS campaign best practices', c: 'SMS Campaigns' },
    { id: 'listings-overview', t: 'How listings sync will work', c: 'Listings Sync' },
    { id: 'fix-mismatch', t: 'Fixing a listing mismatch', c: 'Listings Sync' },
    { id: 'apple-maps', t: 'Getting listed on Apple Maps', c: 'Listings Sync' },
    { id: 'bing-places', t: 'Getting listed on Bing Places', c: 'Listings Sync' },
    { id: 'insights-overview', t: 'Reports dashboard overview', c: 'Insights & Analytics' },
    { id: 'sentiment-score', t: 'Understanding your sentiment score', c: 'Insights & Analytics' },
    { id: 'keyword-tracker', t: 'Using the keyword tracker', c: 'Insights & Analytics' },
    { id: 'competitor-benchmarking', t: 'Competitor benchmarking', c: 'Insights & Analytics' },
    { id: 'rating-velocity', t: 'Rating velocity explained', c: 'Insights & Analytics' },
    { id: 'monthly-report', t: 'Your weekly summary email', c: 'Insights & Analytics' },
    { id: 'llm-overview', t: 'Understanding AI Visibility Monitoring', c: 'AI Visibility Monitoring' },
    { id: 'visibility-score', t: 'Understanding your visibility score', c: 'AI Visibility Monitoring' },
    { id: 'improve-visibility', t: 'How to improve your AI visibility', c: 'AI Visibility Monitoring' },
    { id: 'llm-setup', t: 'Setting up AI visibility monitoring', c: 'AI Visibility Monitoring' },
    { id: 'facebook-reviews', t: 'Connecting Facebook Reviews', c: 'Integrations' },
    { id: 'connect-square', t: 'Connecting Square', c: 'Integrations' },
    { id: 'connect-hubspot', t: 'Connecting HubSpot CRM', c: 'Integrations' },
    { id: 'connect-shopify', t: 'Connecting Shopify', c: 'Integrations' },
    { id: 'connect-mindbody', t: 'Connecting Mindbody', c: 'Integrations' },
    { id: 'connect-calendly', t: 'Connecting Calendly', c: 'Integrations' },
    { id: 'connect-acuity', t: 'Connecting Acuity Scheduling', c: 'Integrations' },
    { id: 'connect-stripe-trigger', t: 'Setting up the Stripe payment trigger', c: 'Integrations' },
    { id: 'zapier-setup', t: 'Zapier integration', c: 'Integrations' },
    { id: 'csv-import', t: 'Importing contacts via CSV', c: 'Integrations' },
    { id: 'api-key', t: 'Does SwarmReply have an API?', c: 'Integrations' },
    { id: 'connect-jobber', t: 'Connecting Jobber', c: 'Integrations' },
    { id: 'billing-faq', t: 'Billing FAQ', c: 'Billing & Plans' },
    { id: 'upgrade-plan', t: 'Adding locations to your plan', c: 'Billing & Plans' },
    { id: 'cancel', t: 'Cancelling your subscription', c: 'Billing & Plans' },
    { id: 'update-card', t: 'Updating your payment method', c: 'Billing & Plans' },
    { id: 'invoices', t: 'Viewing and downloading invoices', c: 'Billing & Plans' },
    { id: 'account-settings', t: 'Account settings overview', c: 'Settings' },
    { id: 'alert-preferences', t: 'Setting your alert preferences', c: 'Settings' },
    { id: 'google-posts-settings', t: 'Google Posts auto-publisher', c: 'Settings' },
    { id: 'locations', t: 'Managing multiple locations', c: 'Settings' },
    { id: 'review-links', t: 'Setting up your review links', c: 'Settings' },
  ];

  // ── Matching (same logic as the in-app Wallabee) ──────────────────────────
  var STOP = {};
  ['the','a','an','to','of','in','on','for','my','i','do','how','can','is','it',
   'me','with','and','or','what','where','when','why','does','am','are','your',
   'our','this','that','about','help','need','want','get','set','up','have',
   'please','you','swarmreply','work','works','working','use','using','make','new','still','really','just'].forEach(function (w) { STOP[w] = 1; });

  var SYNONYMS = {
    gbp: 'google', gmb: 'google', text: 'sms', texts: 'sms', texting: 'sms',
    pay: 'billing', payment: 'billing', card: 'billing', credit: 'billing',
    charge: 'billing', debit: 'billing',
    price: 'plan', pricing: 'plan', cost: 'plan', subscription: 'billing',
    chat: 'webchat', chatbot: 'webchat', widget: 'webchat', bot: 'agent',
    csv: 'import', upload: 'import', cancel: 'cancelling', email: 'request',
    staff: 'team', employee: 'team', invite: 'team', star: 'review',
    stars: 'review', rating: 'review', ratings: 'review', chatgpt: 'ai',
    facebook: 'reviews', nps: 'survey', feedback: 'survey', stop: 'opt-outs',
    unsubscribe: 'opt-outs', ask: 'request', asking: 'request', texted: 'sms'
  };

  function tokenize(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 1 && !STOP[w]; })
      .map(function (w) { return SYNONYMS[w] || w; });
  }

  function findArticles(q) {
    var qT = tokenize(q);
    if (!qT.length) return [];
    var scored = [];
    ARTICLES.forEach(function (a) {
      var hay = tokenize(a.t + ' ' + a.c);
      var score = 0;
      qT.forEach(function (qt) {
        var hit = hay.some(function (h) {
          return h === qt || (qt.length >= 4 && h.indexOf(qt) === 0) || (h.length >= 4 && qt.indexOf(h) === 0);
        });
        if (hit) score += 1;
      });
      if (score > 0) scored.push({ id: a.id, t: a.t, c: a.c, score: score });
    });
    scored.sort(function (x, y) { return y.score - x.score; });
    return scored.slice(0, 3);
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── State ──────────────────────────────────────────────────────────────────
  var GREETING = { who: 'bee', type: 'text',
    text: "Hi! I'm Wallabee \uD83D\uDC1D \u2014 SwarmReply's support bee. Ask me anything, like \u201chow do I connect Google\u201d or \u201chow does pricing work\u201d, and I'll point you to the right guide." };

  var state = { open: false, messages: [GREETING], lastQuestion: '' };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE_KEY));
    if (saved && saved.messages && saved.messages.length) state = saved;
  } catch (e) { /* fresh start */ }

  function persist() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  var css = '' +
  '.wb-bubble{position:fixed;bottom:24px;right:20px;z-index:9000;display:flex;align-items:center;gap:9px;padding:9px 18px 9px 11px;border-radius:50px;border:none;cursor:pointer;background:linear-gradient(135deg,#f5c842,#d4a515);box-shadow:0 6px 24px rgba(212,165,21,.45);transition:transform .15s ease;font-family:"DM Sans",sans-serif;font-size:.85rem;font-weight:700;color:#0a0a0a}' +
  '.wb-bubble:hover{transform:scale(1.05)}' +
  '.wb-ic{width:34px;height:34px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
  '.wb-ic img{width:26px;height:26px;object-fit:contain}' +
  '.wb-ic.x{background:rgba(10,10,10,.12);font-size:1rem;font-weight:700}' +
  '.wb-panel{position:fixed;bottom:96px;right:20px;z-index:9000;width:min(360px,calc(100vw - 32px));height:min(540px,calc(100vh - 140px));height:min(540px,calc(100dvh - 140px));background:#f8f7f4;border-radius:18px;border:1px solid #e4e0d8;box-shadow:0 12px 48px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;font-family:"DM Sans",sans-serif}' +
  '.wb-head{background:linear-gradient(135deg,#f5c842,#d4a515);padding:14px 16px;display:flex;align-items:center;gap:11px}' +
  '.wb-avatar{width:40px;height:40px;border-radius:50%;background:#fff;border:1px solid #e4e0d8;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}' +
  '.wb-avatar img{width:32px;height:32px;object-fit:contain}' +
  '.wb-avatar.sm{width:26px;height:26px}.wb-avatar.sm img{width:18px;height:18px}' +
  '.wb-name{font-family:"Playfair Display",serif;font-weight:900;font-size:1.05rem;color:#0a0a0a}' +
  '.wb-sub{font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:rgba(10,10,10,.65)}' +
  '.wb-close{background:rgba(10,10,10,.12);border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:.85rem;font-weight:700;color:#0a0a0a;margin-left:auto}' +
  '.wb-msgs{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:10px}' +
  '.wb-row{display:flex;gap:8px;align-items:flex-end}' +
  '.wb-row.user{justify-content:flex-end}' +
  '.wb-msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:.875rem;line-height:1.55;white-space:pre-wrap;word-break:break-word}' +
  '.wb-msg.bee{background:#fff;border:1px solid #e4e0d8;color:#0a0a0a;border-top-left-radius:4px}' +
  '.wb-msg.user{background:#0a0a0a;color:#fff;border-top-right-radius:4px}' +
  '.wb-msg.typing{color:#7a7670;font-style:italic}' +
  '.wb-arts{display:flex;flex-direction:column;gap:6px;max-width:88%}' +
  '.wb-art{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e4e0d8;border-radius:12px;padding:10px 13px;text-decoration:none}' +
  '.wb-art-t{display:block;font-size:.83rem;font-weight:600;color:#0a0a0a}' +
  '.wb-art-c{display:block;font-size:.7rem;color:#7a7670;margin-top:1px}' +
  '.wb-chips{display:flex;gap:7px;flex-wrap:wrap}' +
  '.wb-chip{padding:8px 14px;border-radius:50px;border:1.5px solid #e4e0d8;background:#fff;cursor:pointer;font-family:inherit;font-size:.8rem;font-weight:600;color:#0a0a0a}' +
  '.wb-mail{display:inline-block;margin-top:8px;color:#0a0a0a;font-weight:700;font-size:.8rem}' +
  '.wb-mailbtn{display:inline-block;margin-top:10px;padding:10px 18px;border-radius:50px;background:#0a0a0a;color:#fff !important;text-decoration:none;font-size:.82rem;font-weight:700}' +
  '.wb-foot{padding:10px 12px;background:#fff;border-top:1px solid #e4e0d8;display:flex;gap:8px}' +
  '.wb-input{flex:1;border:none;background:#f8f7f4;border-radius:50px;padding:11px 16px;font-family:inherit;font-size:.85rem;outline:none}' +
  '.wb-send{width:42px;height:42px;border-radius:50%;border:none;background:linear-gradient(135deg,#f5c842,#d4a515);cursor:pointer;font-size:1rem;flex-shrink:0}' +
  '@media(max-width:640px){' +
    '.wb-panel{left:10px;right:10px;width:auto;bottom:80px;height:min(420px,calc(100dvh - 170px));border-radius:16px}' +
    '.wb-bubble{padding:8px 15px 8px 10px}' +
    '.wb-input{font-size:16px}' +
  '}' +
  '';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── DOM ────────────────────────────────────────────────────────────────────
  var root = document.createElement('div');
  document.body.appendChild(root);

  var bubble = document.createElement('button');
  bubble.className = 'wb-bubble';
  bubble.setAttribute('aria-label', 'Chat with Wallabee, our support bee');

  var panel = document.createElement('div');
  panel.className = 'wb-panel';
  panel.style.display = 'none';
  panel.innerHTML =
    '<div class="wb-head">' +
      '<span class="wb-avatar"><img src="/bee-logo.png" alt="Wallabee"></span>' +
      '<span><span class="wb-name" style="display:block">Wallabee</span>' +
      '<span class="wb-sub">SwarmReply support bee</span></span>' +
      '<button class="wb-close" aria-label="Close chat">\u2715</button>' +
    '</div>' +
    '<div class="wb-msgs"></div>' +
    '<div class="wb-foot">' +
      '<input class="wb-input" placeholder="Ask Wallabee anything\u2026">' +
      '<button class="wb-send" aria-label="Send">\u2191</button>' +
    '</div>';

  root.appendChild(bubble);
  root.appendChild(panel);

  var msgsEl  = panel.querySelector('.wb-msgs');
  var inputEl = panel.querySelector('.wb-input');

  function beeAvatarSm() {
    return '<span class="wb-avatar sm"><img src="/bee-logo.png" alt=""></span>';
  }

  function render() {
    var html = '';
    state.messages.forEach(function (m, i) {
      if (m.type === 'articles') {
        html += '<div class="wb-arts">';
        m.articles.forEach(function (a) {
          html += '<a class="wb-art" href="' + (a.u ? a.u : HELP_BASE + '#' + esc(a.id)) + '" target="_blank" rel="noreferrer">' +
            '<span style="flex:1"><span class="wb-art-t">' + esc(a.t) + '</span>' +
            '<span class="wb-art-c">' + esc(a.c) + '</span></span>' +
            '<span style="font-size:.75rem;color:#7a7670">\u2197</span></a>';
        });
        html += '</div>';
      } else if (m.type === 'chips') {
        if (!m.done) {
          html += '<div class="wb-chips" data-i="' + i + '">';
          m.chips.forEach(function (c) {
            html += '<button class="wb-chip">' + esc(c) + '</button>';
          });
          html += '</div>';
        }
      } else {
        var mail = '';
        if (m.mailto) {
          mail = '<div><a class="wb-mail" href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + ' \u2197</a></div>' +
            '<a class="wb-mailbtn" href="mailto:' + SUPPORT_EMAIL +
            '?subject=' + encodeURIComponent('Support: ' + (state.lastQuestion || 'question from swarmreply.com')) +
            '">Email our team \u2192</a>';
        }
        html += '<div class="wb-row ' + (m.who === 'user' ? 'user' : '') + '">' +
          (m.who === 'bee' ? beeAvatarSm() : '') +
          '<div class="wb-msg ' + m.who + '">' + esc(m.text) + mail + '</div></div>';
      }
    });
    msgsEl.innerHTML = html;
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function setOpen(o) {
    state.open = o;
    panel.style.display = o ? 'flex' : 'none';
    bubble.innerHTML = o
      ? '<span class="wb-ic x">\u2715</span><span>Close</span>'
      : '<span class="wb-ic"><img src="/bee-logo.png" alt=""></span><span>Support</span>';
    if (o) { render(); inputEl.focus(); }
    persist();
  }

  function beeSay(msgs) {
    var typing = document.createElement('div');
    typing.className = 'wb-row';
    typing.innerHTML = beeAvatarSm() + '<div class="wb-msg bee typing">Wallabee is buzzing\u2026</div>';
    msgsEl.appendChild(typing);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    setTimeout(function () {
      msgs.forEach(function (m) { state.messages.push(m); });
      persist();
      render();
    }, 550);
  }

  function escalate() {
    beeSay([{ who: 'bee', type: 'text', mailto: true,
      text: "Hmm, I couldn't find a guide for that one. Our human team can help \u2014 we read and reply to every message." }]);
  }

  function ask(text) {
    var q = String(text || '').trim();
    if (!q) return;
    state.lastQuestion = q;
    state.messages.push({ who: 'user', type: 'text', text: q });
    inputEl.value = '';
    persist();
    render();
    var hits = findArticles(q);
    if (hits.length) {
      beeSay([
        { who: 'bee', type: 'text', text: 'These guides should help:' },
        { who: 'bee', type: 'articles', articles: hits },
        { who: 'bee', type: 'chips', chips: ['That helped \uD83D\uDC1D', 'I still need help'] }
      ]);
    } else {
      escalate();
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  bubble.addEventListener('click', function () { setOpen(!state.open); });
  panel.querySelector('.wb-close').addEventListener('click', function () { setOpen(false); });
  panel.querySelector('.wb-send').addEventListener('click', function () { ask(inputEl.value); });
  inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(inputEl.value); });

  msgsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.wb-chip');
    if (!btn) return;
    var wrap = btn.closest('.wb-chips');
    var idx = parseInt(wrap.getAttribute('data-i'), 10);
    if (state.messages[idx]) state.messages[idx].done = true;
    var labelTxt = btn.textContent;
    state.messages.push({ who: 'user', type: 'text', text: labelTxt });
    persist();
    render();
    if (labelTxt.indexOf('That helped') === 0) {
      beeSay([{ who: 'bee', type: 'text', text: 'Happy to help! Buzz me anytime. \uD83D\uDC1D' }]);
    } else {
      escalate();
    }
  });

  // Restore: if the visitor navigated mid-conversation with the panel open
  setOpen(state.open);
})();
