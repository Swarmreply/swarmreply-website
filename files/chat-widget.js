/*!
 * SwarmReply Chat Widget v1.0
 * Embeddable webchat for any website — no dependencies
 *
 * USAGE (paste before </body>):
 *
 *   <script
 *     src="https://swarmreply.com/chat-widget.js"
 *     data-token="YOUR_CHAT_TOKEN"
 *   ></script>
 *
 * OPTIONAL OVERRIDES (all come from dashboard by default):
 *   data-color      Brand color  e.g. "#f5c842"
 *   data-position   "bottom-right" or "bottom-left"
 *   data-title      Greeting title
 *   data-subtitle   Greeting subtitle
 */
(function (w, d) {
  'use strict';

  var API = 'https://your-railway-url.up.railway.app/api/webchat';
  var token = null;
  var cfg = null;
  var sessionId = null;
  var sessionToken = null;
  var eventSource = null;
  var isOpen = false;
  var leadSubmitted = false;

  // ── FIND SCRIPT TAG ────────────────────────────────────────────────────────
  var scripts = d.querySelectorAll('script[data-token]');
  var scriptTag = scripts[scripts.length - 1];
  if (!scriptTag) return;
  token = scriptTag.getAttribute('data-token');
  if (!token) return;

  var overrides = {
    color:    scriptTag.getAttribute('data-color'),
    position: scriptTag.getAttribute('data-position'),
    title:    scriptTag.getAttribute('data-title'),
    subtitle: scriptTag.getAttribute('data-subtitle')
  };

  // ── STYLES ─────────────────────────────────────────────────────────────────
  function injectStyles(color, textColor, position) {
    var pos = position === 'bottom-left'
      ? 'left:20px;right:auto'
      : 'right:20px;left:auto';

    var css = [
      '#sr-chat-btn{position:fixed;bottom:20px;' + pos + ';z-index:2147483647;',
      'width:56px;height:56px;border-radius:50%;background:' + color + ';',
      'border:none;cursor:pointer;box-shadow:0 4px 24px rgba(0,0,0,.22);',
      'display:flex;align-items:center;justify-content:center;',
      'transition:transform .2s,box-shadow .2s;outline:none;',
      'font-size:1.4rem;-webkit-tap-highlight-color:transparent}',

      '#sr-chat-btn:hover{transform:scale(1.09);box-shadow:0 8px 32px rgba(0,0,0,.28)}',
      '#sr-chat-btn:active{transform:scale(.96)}',

      '#sr-chat-btn .sr-badge{position:absolute;top:-4px;right:-4px;',
      'width:18px;height:18px;border-radius:50%;background:#e53e3e;',
      'color:#fff;font-size:.62rem;font-weight:700;',
      'display:none;align-items:center;justify-content:center;',
      'font-family:system-ui,sans-serif;border:2px solid #fff}',
      '#sr-chat-btn .sr-badge.show{display:flex}',

      '#sr-chat-win{position:fixed;bottom:88px;' + pos + ';z-index:2147483646;',
      'width:360px;max-width:calc(100vw - 24px);',
      'border-radius:20px;overflow:hidden;',
      'box-shadow:0 16px 64px rgba(0,0,0,.18);',
      'display:none;flex-direction:column;',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",DM Sans,sans-serif;',
      'background:#fff;',
      'transform:translateY(12px) scale(.96);opacity:0;',
      'transition:transform .25s cubic-bezier(.34,1.56,.64,1),opacity .22s ease;',
      'max-height:calc(100vh - 120px)}',

      '#sr-chat-win.sr-open{display:flex;transform:translateY(0) scale(1);opacity:1}',

      '#sr-chat-head{background:' + color + ';padding:16px 18px;',
      'display:flex;align-items:center;gap:12px;flex-shrink:0}',
      '#sr-chat-head .sr-avatar{width:40px;height:40px;border-radius:50%;',
      'background:rgba(255,255,255,.25);display:flex;align-items:center;',
      'justify-content:center;font-size:1.2rem;flex-shrink:0}',
      '#sr-chat-head .sr-head-text{flex:1;min-width:0}',
      '#sr-chat-head .sr-head-title{font-weight:700;font-size:.95rem;',
      'color:' + textColor + ';line-height:1.2}',
      '#sr-chat-head .sr-head-sub{font-size:.75rem;color:' + textColor + ';',
      'opacity:.7;margin-top:2px}',
      '#sr-chat-close{background:transparent;border:none;',
      'cursor:pointer;color:' + textColor + ';opacity:.65;',
      'font-size:1.3rem;padding:4px;line-height:1;',
      '-webkit-tap-highlight-color:transparent;flex-shrink:0}',
      '#sr-chat-close:hover{opacity:1}',

      '#sr-chat-body{flex:1;overflow-y:auto;padding:16px;',
      'display:flex;flex-direction:column;gap:10px;',
      'background:#f8f7f4;min-height:200px;max-height:360px}',

      '.sr-msg{display:flex;gap:8px;align-items:flex-end}',
      '.sr-msg.sr-visitor{flex-direction:row-reverse}',
      '.sr-bubble{max-width:75%;padding:10px 13px;border-radius:16px;',
      'font-size:.875rem;line-height:1.55;word-wrap:break-word}',
      '.sr-msg.sr-agent .sr-bubble{background:#fff;color:#1a1a18;',
      'border-radius:4px 16px 16px 16px;',
      'box-shadow:0 1px 4px rgba(0,0,0,.08)}',
      '.sr-msg.sr-visitor .sr-bubble{background:' + color + ';',
      'color:' + textColor + ';border-radius:16px 4px 16px 16px}',
      '.sr-msg .sr-ts{font-size:.65rem;color:#aaa;flex-shrink:0;margin-bottom:3px}',

      '.sr-typing{display:flex;gap:4px;padding:10px 13px;',
      'background:#fff;border-radius:4px 16px 16px 16px;',
      'width:fit-content;box-shadow:0 1px 4px rgba(0,0,0,.08)}',
      '.sr-typing span{width:7px;height:7px;border-radius:50%;',
      'background:#ccc;animation:sr-bounce .9s infinite}',
      '.sr-typing span:nth-child(2){animation-delay:.15s}',
      '.sr-typing span:nth-child(3){animation-delay:.3s}',
      '@keyframes sr-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}',

      '#sr-chat-lead{padding:16px;background:#fff;',
      'border-top:1px solid #f0eeea;flex-shrink:0}',
      '#sr-chat-lead .sr-lead-title{font-weight:600;font-size:.875rem;',
      'color:#1a1a18;margin-bottom:12px}',
      '.sr-input{width:100%;padding:9px 12px;',
      'border:1.5px solid #e4e0d8;border-radius:10px;',
      'font-size:.875rem;color:#1a1a18;outline:none;',
      'font-family:inherit;transition:border-color .15s;',
      'box-sizing:border-box;background:#fff}',
      '.sr-input:focus{border-color:' + color + '}',
      '.sr-lead-fields{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}',
      '.sr-textarea{width:100%;padding:9px 12px;',
      'border:1.5px solid #e4e0d8;border-radius:10px;',
      'font-size:.875rem;color:#1a1a18;outline:none;',
      'font-family:inherit;resize:none;min-height:70px;',
      'line-height:1.5;box-sizing:border-box;transition:border-color .15s}',
      '.sr-textarea:focus{border-color:' + color + '}',
      '.sr-submit-btn{width:100%;padding:11px;border:none;',
      'border-radius:50px;background:' + color + ';color:' + textColor + ';',
      'font-size:.875rem;font-weight:700;cursor:pointer;',
      'font-family:inherit;transition:all .15s;',
      '-webkit-tap-highlight-color:transparent}',
      '.sr-submit-btn:hover{filter:brightness(.92)}',
      '.sr-submit-btn:disabled{opacity:.5;cursor:not-allowed}',

      '#sr-chat-compose{padding:10px 12px;background:#fff;',
      'border-top:1px solid #f0eeea;',
      'display:none;align-items:center;gap:8px;flex-shrink:0}',
      '#sr-chat-compose.sr-show{display:flex}',
      '#sr-compose-input{flex:1;border:1.5px solid #e4e0d8;',
      'border-radius:50px;padding:9px 14px;font-size:.875rem;',
      'outline:none;font-family:inherit;color:#1a1a18;',
      'transition:border-color .15s;background:#fff}',
      '#sr-compose-input:focus{border-color:' + color + '}',
      '#sr-send-btn{width:36px;height:36px;border-radius:50%;',
      'background:' + color + ';border:none;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;',
      'flex-shrink:0;font-size:1rem;',
      'transition:transform .15s;-webkit-tap-highlight-color:transparent}',
      '#sr-send-btn:hover{transform:scale(1.08)}',
      '#sr-send-btn:active{transform:scale(.95)}',

      '#sr-chat-win .sr-powered{text-align:center;',
      'font-size:.65rem;color:#ccc;padding:6px 0 8px;',
      'background:#fff;flex-shrink:0}',
      '#sr-chat-win .sr-powered a{color:#ccc;text-decoration:none}',
      '#sr-chat-win .sr-powered a:hover{color:#999}'
    ].join('');

    var style = d.createElement('style');
    style.textContent = css;
    d.head.appendChild(style);
  }

  // ── BUILD UI ───────────────────────────────────────────────────────────────
  function buildUI() {
    var color    = overrides.color    || cfg.brand_color   || '#f5c842';
    var textColor= cfg.text_color     || '#0a0a0a';
    var position = overrides.position || cfg.position      || 'bottom-right';
    var title    = overrides.title    || cfg.greeting_title    || 'Chat with us';
    var subtitle = overrides.subtitle || cfg.greeting_subtitle || 'We usually reply in minutes';
    var avatar   = cfg.avatar_emoji || '🐝';

    injectStyles(color, textColor, position);

    // Chat button
    var btn = d.createElement('button');
    btn.id = 'sr-chat-btn';
    btn.setAttribute('aria-label', 'Open chat');
    btn.innerHTML = '<span class="sr-icon">💬</span><span class="sr-badge" id="sr-badge"></span>';
    btn.onclick = toggleChat;
    d.body.appendChild(btn);

    // Chat window
    var win = d.createElement('div');
    win.id = 'sr-chat-win';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Chat window');

    // Header
    var headHtml = '<div id="sr-chat-head">';
    if (cfg.show_avatar !== false) {
      headHtml += '<div class="sr-avatar">' + avatar + '</div>';
    }
    headHtml += '<div class="sr-head-text">'
      + '<div class="sr-head-title">' + escHtml(title) + '</div>'
      + '<div class="sr-head-sub">' + escHtml(subtitle) + '</div>'
      + '</div>'
      + '<button id="sr-chat-close" aria-label="Close chat" onclick="document.getElementById(\'sr-chat-btn\').click()">✕</button>'
      + '</div>';

    // Message body
    var bodyHtml = '<div id="sr-chat-body"></div>';

    // Lead form — name, phone, message
    var leadFields = '';
    if (cfg.collect_name !== false) {
      leadFields += '<input class="sr-input" id="sr-lead-name" placeholder="'
        + escHtml(cfg.name_placeholder || 'Your name') + '" autocomplete="name">';
    }
    if (cfg.collect_phone !== false) {
      leadFields += '<input class="sr-input" id="sr-lead-phone" type="tel" placeholder="'
        + escHtml(cfg.phone_placeholder || 'Your phone number') + '" autocomplete="tel">';
    }
    if (cfg.collect_email) {
      leadFields += '<input class="sr-input" id="sr-lead-email" type="email" placeholder="'
        + escHtml(cfg.email_placeholder || 'Email (optional)') + '" autocomplete="email">';
    }

    var leadHtml = '<div id="sr-chat-lead">'
      + '<div class="sr-lead-title">Start a conversation</div>'
      + '<div class="sr-lead-fields">' + leadFields + '</div>'
      + '<textarea class="sr-textarea" id="sr-lead-msg" placeholder="How can we help you?" rows="3"></textarea>'
      + '<button class="sr-submit-btn" id="sr-submit" style="margin-top:8px" onclick="window.SR_submitLead()">Send message →</button>'
      + '</div>';

    // Compose bar (shown after lead submitted)
    var composeHtml = '<div id="sr-chat-compose">'
      + '<input id="sr-compose-input" placeholder="Type a message…" autocomplete="off">'
      + '<button id="sr-send-btn" aria-label="Send" onclick="window.SR_sendMessage()">➤</button>'
      + '</div>';

    var poweredHtml = '<div class="sr-powered">Powered by <a href="https://swarmreply.com" target="_blank" rel="noopener">SwarmReply</a></div>';

    win.innerHTML = headHtml + bodyHtml + leadHtml + composeHtml + poweredHtml;
    d.body.appendChild(win);

    // Add welcome message to body
    appendMessage({
      sender: 'agent',
      body: cfg.welcome_message || 'Hi! 👋 How can we help you today?',
      time: now()
    });

    // Keyboard — send on Enter
    var ci = d.getElementById('sr-compose-input');
    if (ci) {
      ci.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); w.SR_sendMessage(); }
      });
    }

    // Also send lead form on Ctrl+Enter in textarea
    var ta = d.getElementById('sr-lead-msg');
    if (ta) {
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { w.SR_submitLead(); }
      });
    }
  }

  // ── TOGGLE ─────────────────────────────────────────────────────────────────
  function toggleChat() {
    isOpen = !isOpen;
    var win = d.getElementById('sr-chat-win');
    var btn = d.getElementById('sr-chat-btn');
    if (isOpen) {
      win.classList.add('sr-open');
      win.style.display = 'flex';
      btn.querySelector('.sr-icon').textContent = '✕';
      btn.setAttribute('aria-label', 'Close chat');
      d.getElementById('sr-badge').classList.remove('show');
      // Focus first input
      var first = win.querySelector('input,textarea');
      if (first) setTimeout(function () { first.focus(); }, 300);
    } else {
      win.classList.remove('sr-open');
      btn.querySelector('.sr-icon').textContent = '💬';
      btn.setAttribute('aria-label', 'Open chat');
      setTimeout(function () {
        if (!isOpen) win.style.display = 'none';
      }, 260);
    }
  }

  // ── MESSAGES ───────────────────────────────────────────────────────────────
  function appendMessage(msg) {
    var body = d.getElementById('sr-chat-body');
    if (!body) return;
    var isVisitor = msg.sender === 'visitor';
    var div = d.createElement('div');
    div.className = 'sr-msg ' + (isVisitor ? 'sr-visitor' : 'sr-agent');
    div.innerHTML = '<div class="sr-bubble">' + escHtml(msg.body) + '</div>'
      + '<span class="sr-ts">' + (msg.time || '') + '</span>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    var body = d.getElementById('sr-chat-body');
    var el = d.createElement('div');
    el.className = 'sr-msg sr-agent';
    el.id = 'sr-typing';
    el.innerHTML = '<div class="sr-typing"><span></span><span></span><span></span></div>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function hideTyping() {
    var el = d.getElementById('sr-typing');
    if (el) el.remove();
  }

  // ── LEAD FORM SUBMIT ───────────────────────────────────────────────────────
  w.SR_submitLead = function () {
    var nameEl  = d.getElementById('sr-lead-name');
    var phoneEl = d.getElementById('sr-lead-phone');
    var emailEl = d.getElementById('sr-lead-email');
    var msgEl   = d.getElementById('sr-lead-msg');
    var btn     = d.getElementById('sr-submit');

    var message = msgEl ? msgEl.value.trim() : '';
    if (!message) { if (msgEl) msgEl.focus(); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    var payload = {
      token:        token,
      firstMessage: message,
      visitorName:  nameEl  ? nameEl.value.trim()  : '',
      visitorPhone: phoneEl ? phoneEl.value.trim()  : '',
      visitorEmail: emailEl ? emailEl.value.trim()  : '',
      pageUrl:      w.location.href,
      referrer:     d.referrer
    };

    fetch(API + '/session/start', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) throw new Error(data.error || 'Failed');
      sessionId    = data.sessionId;
      sessionToken = token;
      leadSubmitted = true;

      // Hide lead form, show compose bar
      var lead = d.getElementById('sr-chat-lead');
      var compose = d.getElementById('sr-chat-compose');
      if (lead) lead.style.display = 'none';
      if (compose) compose.classList.add('sr-show');

      // Show visitor's message in chat
      appendMessage({ sender: 'visitor', body: message, time: now() });

      // Show typing indicator for ~1.5s
      showTyping();
      setTimeout(function () {
        hideTyping();
        appendMessage({
          sender: 'agent',
          body: '✓ Got it! We\'ll reply here or text you right back.',
          time: now()
        });
      }, 1500);

      // Start SSE stream for agent replies
      startStream();

      // Focus compose
      var ci = d.getElementById('sr-compose-input');
      if (ci) ci.focus();
    })
    .catch(function (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Send message →'; }
      appendMessage({
        sender: 'agent',
        body: 'Something went wrong. Please try again.',
        time: now()
      });
    });
  };

  // ── SEND MESSAGE ───────────────────────────────────────────────────────────
  w.SR_sendMessage = function () {
    var input = d.getElementById('sr-compose-input');
    if (!input || !input.value.trim() || !sessionId) return;
    var body = input.value.trim();
    input.value = '';

    appendMessage({ sender: 'visitor', body: body, time: now() });

    fetch(API + '/session/' + sessionId + '/message', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ body: body, token: sessionToken })
    }).catch(function () {});
  };

  // ── SSE STREAM ─────────────────────────────────────────────────────────────
  function startStream() {
    if (!sessionId || eventSource) return;
    eventSource = new EventSource(API + '/session/' + sessionId + '/stream');
    eventSource.onmessage = function (e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'message' && data.message.sender === 'agent') {
          hideTyping();
          appendMessage({
            sender: 'agent',
            body:   data.message.body,
            time:   now()
          });
          // Badge if window is closed
          if (!isOpen) {
            var badge = d.getElementById('sr-badge');
            if (badge) badge.classList.add('show');
          }
        }
        if (data.type === 'resolved') {
          appendMessage({ sender: 'agent', body: '✓ This conversation has been resolved. Thanks for reaching out!', time: now() });
          eventSource.close();
        }
      } catch (e) {}
    };
    eventSource.onerror = function () {
      // Reconnect after 5 seconds
      setTimeout(function () { eventSource = null; startStream(); }, 5000);
    };
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ── INIT ───────────────────────────────────────────────────────────────────
  function init() {
    fetch(API + '/config/' + token)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success || !data.config) return;
        cfg = data.config;
        buildUI();
      })
      .catch(function (err) {
        console.warn('SwarmReply chat widget failed to load:', err);
      });
  }

  // Wait for DOM
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window, document));
