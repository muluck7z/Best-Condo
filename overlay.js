(function () {
  'use strict';

  /* ── Storage keys ──────────────────────────────────── */
  var LANG_KEY      = 'rc2_lang';
  var TOKEN_KEY     = 'rc_acct_token';
  var USER_KEY      = 'rc_acct_user';
  var DAYS_KEY      = 'rc_acct_days';
  var UID_KEY       = 'rc_acct_uid';
  var MIN_DAYS      = 80;

  /* ── Storage helpers ───────────────────────────────── */
  function getToken()   { return localStorage.getItem(TOKEN_KEY); }
  function getUser()    { return localStorage.getItem(USER_KEY); }
  function getDays()    { return parseInt(localStorage.getItem(DAYS_KEY) || '0', 10); }

  function saveVerification(id, name, days) {
    var arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    var hex = Array.from(arr).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
    var token = 'RBX-' + id + '-' + hex.toUpperCase();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  name);
    localStorage.setItem(DAYS_KEY,  String(days));
    localStorage.setItem(UID_KEY,   String(id));
    return token;
  }

  /* ── Sound ─────────────────────────────────────────── */
  var audio = null;
  function playClick() {
    try {
      if (!audio) { audio = new Audio('/click-sound.mp3'); audio.volume = 0.5; }
      audio.currentTime = 0;
      audio.play().catch(function(){});
    } catch(e){}
  }

  /* ── Toast warning ─────────────────────────────────── */
  var WARN_MSGS = {
    en: 'Verify your Roblox account first to access the game.',
    es: 'Verifica tu cuenta de Roblox primero para acceder al juego.',
    pt: 'Verifique sua conta Roblox primeiro para acessar o jogo.',
    ru: 'Сначала подтвердите учётную запись Roblox.',
  };
  function showWarning() {
    var lang = localStorage.getItem(LANG_KEY) || 'pt';
    var msg  = WARN_MSGS[lang] || WARN_MSGS.pt;
    var old  = document.getElementById('rc-token-warning');
    if (old) old.remove();
    var warn = document.createElement('div');
    warn.id = 'rc-token-warning';
    warn.style.cssText = [
      'position:fixed','bottom:24px','left:50%','transform:translateX(-50%)',
      'background:#0c1a3d','border:1px solid rgba(59,130,246,0.4)','color:#93c5fd',
      'font-size:13px','font-weight:600','padding:10px 22px',
      'border-radius:12px','z-index:999999','white-space:nowrap',
      'box-shadow:0 8px 32px rgba(37,99,235,0.3)',
      'font-family:Outfit,Inter,sans-serif',
    ].join(';');
    warn.textContent = msg;
    document.body.appendChild(warn);
    setTimeout(function(){ warn.remove(); }, 3200);
  }

  /* ── Language overlay dismiss ───────────────────────── */
  function dismissLangOverlay(lang) {
    localStorage.setItem(LANG_KEY, lang);
    var overlay = document.getElementById('rc-lang-overlay');
    if (overlay) {
      overlay.style.animation = 'rc-fadeout .2s ease forwards';
      setTimeout(function(){ overlay.classList.add('rc-hidden'); }, 210);
    }
  }

  /* ═══════════════════════════════════════════════════
     VERIFICATION OVERLAY
  ═══════════════════════════════════════════════════ */
  function injectVerifyStyles() {
    if (document.getElementById('rc-vs')) return;
    var s = document.createElement('style');
    s.id = 'rc-vs';
    s.textContent = '\
      #rc-verify-overlay{\
        position:fixed;inset:0;z-index:999998;\
        background:rgba(4,9,19,0.97);\
        backdrop-filter:blur(20px);\
        -webkit-backdrop-filter:blur(20px);\
        display:flex;align-items:center;justify-content:center;\
        font-family:Outfit,Inter,sans-serif;\
        animation:rcfi .3s ease;\
      }\
      @keyframes rcfi{from{opacity:0}to{opacity:1}}\
      @keyframes rcfo{from{opacity:1}to{opacity:0}}\
      .rc-vm{\
        position:relative;width:100%;max-width:430px;margin:0 16px;\
        background:linear-gradient(180deg,rgba(12,22,50,.98) 0%,rgba(8,16,38,.98) 100%);\
        border:1px solid rgba(59,130,246,.2);border-radius:24px;\
        padding:40px 36px 32px;\
        box-shadow:0 40px 80px rgba(0,0,0,.8),0 0 100px rgba(37,99,235,.08),inset 0 1px 0 rgba(255,255,255,.05);\
        text-align:center;overflow:hidden;\
      }\
      .rc-vm::before{\
        content:"";position:absolute;top:0;left:20%;right:20%;height:1px;\
        background:linear-gradient(90deg,transparent,rgba(96,165,250,.6),transparent);\
      }\
      .rc-vglow{\
        position:absolute;top:-60px;left:50%;transform:translateX(-50%);\
        width:220px;height:220px;border-radius:50%;\
        background:radial-gradient(circle,rgba(59,130,246,.15) 0%,transparent 70%);\
        pointer-events:none;\
      }\
      .rc-vlogo{\
        width:56px;height:56px;border-radius:16px;margin:0 auto 20px;\
        background:linear-gradient(135deg,#1d4ed8,#3b82f6);\
        display:flex;align-items:center;justify-content:center;\
        box-shadow:0 0 40px rgba(59,130,246,.5),0 0 80px rgba(59,130,246,.15);\
      }\
      .rc-vtitle{\
        font-size:1.5rem;font-weight:800;margin:0 0 8px;\
        background:linear-gradient(90deg,#fff 40%,rgba(147,197,253,.9) 100%);\
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;\
      }\
      .rc-vsub{\
        font-size:.875rem;color:rgba(148,163,184,.8);margin:0 0 24px;line-height:1.6;\
      }\
      .rc-vinput{\
        width:100%;padding:12px 16px;border-radius:12px;\
        background:rgba(37,99,235,.06);border:1px solid rgba(59,130,246,.2);\
        color:#e2e8f0;font-family:Outfit,Inter,sans-serif;\
        font-size:.9rem;font-weight:500;outline:none;\
        transition:border-color .2s,box-shadow .2s;box-sizing:border-box;margin-bottom:12px;\
      }\
      .rc-vinput::placeholder{color:rgba(148,163,184,.5);}\
      .rc-vinput:focus{\
        border-color:rgba(59,130,246,.5);\
        box-shadow:0 0 0 3px rgba(59,130,246,.12);\
      }\
      .rc-verr{\
        border-radius:12px;padding:12px 16px;margin-bottom:12px;\
        font-size:.82rem;font-weight:500;line-height:1.6;text-align:left;\
        background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.3);color:#fca5a5;\
        white-space:pre-line;\
      }\
      .rc-vbtn{\
        width:100%;padding:13px;border-radius:14px;border:none;cursor:pointer;\
        background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 60%,#2563eb 100%);\
        color:#fff;font-family:Outfit,Inter,sans-serif;font-size:.95rem;font-weight:700;\
        letter-spacing:.01em;margin-bottom:16px;\
        box-shadow:0 0 0 1px rgba(59,130,246,.3),0 4px 20px rgba(37,99,235,.4),inset 0 1px 0 rgba(255,255,255,.15);\
        transition:all .25s ease;display:flex;align-items:center;justify-content:center;gap:8px;\
      }\
      .rc-vbtn:hover:not(:disabled){\
        background:linear-gradient(135deg,#2563eb 0%,#60a5fa 60%,#3b82f6 100%);\
        box-shadow:0 0 0 1px rgba(96,165,250,.5),0 6px 30px rgba(59,130,246,.55),inset 0 1px 0 rgba(255,255,255,.2);\
        transform:translateY(-1px);\
      }\
      .rc-vbtn:disabled{opacity:.6;cursor:not-allowed;transform:none;}\
      .rc-spin{\
        width:16px;height:16px;border:2px solid rgba(255,255,255,.3);\
        border-top-color:#fff;border-radius:50%;\
        animation:rcsp .7s linear infinite;\
      }\
      @keyframes rcsp{to{transform:rotate(360deg)}}\
      .rc-vhint{font-size:.78rem;color:rgba(148,163,184,.5);margin:0;}\
      .rc-vhint strong{color:rgba(96,165,250,.7);}\
      .rch{display:none!important;}\
    ';
    document.head.appendChild(s);
  }

  function createVerifyOverlay() {
    injectVerifyStyles();
    var el = document.createElement('div');
    el.id = 'rc-verify-overlay';
    el.innerHTML = '<div class="rc-vm">'
      + '<div class="rc-vglow"></div>'
      + '<div class="rc-vlogo">'
      + '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      + '</div>'
      + '<h2 class="rc-vtitle">Verificação de Conta</h2>'
      + '<p class="rc-vsub">Para acessar os jogos, informe seu usuário do Roblox. Verificaremos se sua conta atende os requisitos mínimos.</p>'
      + '<input id="rc-vi" class="rc-vinput" type="text" placeholder="Seu usuário do Roblox" autocomplete="off" spellcheck="false"/>'
      + '<div id="rc-ve" class="rc-verr rch"></div>'
      + '<button id="rc-vb" class="rc-vbtn"><span id="rc-vbt">Verificar Conta</span><span id="rc-vsp" class="rc-spin rch"></span></button>'
      + '<p class="rc-vhint">Sua conta precisa ter no mínimo <strong>80 dias</strong> de criação.</p>'
      + '</div>';
    document.body.appendChild(el);
    bindVerifyEvents();
  }

  function dismissVerifyOverlay() {
    var ov = document.getElementById('rc-verify-overlay');
    if (ov) {
      ov.style.animation = 'rcfo .25s ease forwards';
      setTimeout(function(){ ov.remove(); }, 260);
    }
  }

  function bindVerifyEvents() {
    var input = document.getElementById('rc-vi');
    var btn   = document.getElementById('rc-vb');
    var btext = document.getElementById('rc-vbt');
    var spin  = document.getElementById('rc-vsp');
    var errdiv= document.getElementById('rc-ve');

    function setErr(msg) {
      errdiv.textContent = msg;
      errdiv.classList.remove('rch');
    }
    function clearErr() { errdiv.classList.add('rch'); }

    function setLoading(on) {
      btn.disabled = on;
      btext.textContent = on ? 'Verificando...' : 'Verificar Conta';
      if (on) spin.classList.remove('rch'); else spin.classList.add('rch');
    }

    input && input.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { btn && btn.click(); }
    });

    btn && btn.addEventListener('click', function() {
      var username = input ? input.value.trim() : '';
      if (!username) { setErr('Por favor, informe seu usuário do Roblox.'); return; }

      clearErr();
      setLoading(true);
      playClick();

      fetch('/api/check-account?username=' + encodeURIComponent(username))
        .then(function(r) { return r.json().then(function(d){ return { ok: r.ok, status: r.status, data: d }; }); })
        .then(function(res) {
          setLoading(false);
          if (res.status === 404 || (res.data && res.data.error === 'User not found')) {
            setErr('Usuário não encontrado. Verifique o nome e tente novamente.');
            return;
          }
          if (!res.ok) {
            setErr('Erro ao verificar a conta. Tente novamente em instantes.');
            return;
          }
          var d = res.data;
          if (d.days < MIN_DAYS) {
            var missing = MIN_DAYS - d.days;
            setErr(
              'Utilize outra conta ou aguarde sua conta ficar mais velha.\n\n'
              + 'Conta @' + d.name + ': ' + d.days + ' dia' + (d.days !== 1 ? 's' : '') + '. '
              + 'Faltam ' + missing + ' dia' + (missing !== 1 ? 's' : '') + ' para atingir os ' + MIN_DAYS + ' dias necessários.'
            );
            return;
          }
          // Eligible
          saveVerification(d.id, d.name, d.days);
          dismissVerifyOverlay();
        })
        .catch(function() {
          setLoading(false);
          setErr('Erro de conexão. Verifique sua internet e tente novamente.');
        });
    });
  }

  /* ═══════════════════════════════════════════════════
     TOKEN INFO INJECTION (replaces generate-token btn)
  ═══════════════════════════════════════════════════ */
  function injectTokenStyles() {
    if (document.getElementById('rc-ts')) return;
    var s = document.createElement('style');
    s.id = 'rc-ts';
    s.textContent = '\
      .rc-td{width:100%;font-family:Outfit,Inter,sans-serif;}\
      .rc-tcard{\
        background:rgba(37,99,235,.05);border:1px solid rgba(59,130,246,.18);\
        border-radius:14px;padding:14px;margin-bottom:4px;\
      }\
      .rc-tlabel{\
        font-size:.68rem;font-weight:700;text-transform:uppercase;\
        letter-spacing:.09em;color:rgba(96,165,250,.7);margin-bottom:10px;\
      }\
      .rc-trow{\
        display:flex;align-items:center;gap:8px;margin-bottom:10px;\
        background:rgba(37,99,235,.08);border-radius:8px;padding:8px 10px;\
        border:1px solid rgba(59,130,246,.1);\
      }\
      .rc-tval{\
        flex:1;font-family:monospace;font-size:.67rem;\
        color:#93c5fd;word-break:break-all;line-height:1.5;\
      }\
      .rc-tcopy{\
        flex-shrink:0;width:28px;height:28px;border-radius:6px;\
        background:rgba(37,99,235,.1);border:1px solid rgba(59,130,246,.18);\
        color:#93c5fd;cursor:pointer;font-size:.85rem;\
        display:flex;align-items:center;justify-content:center;\
        transition:background .2s;font-family:monospace;line-height:1;\
      }\
      .rc-tcopy:hover{background:rgba(59,130,246,.22);}\
      .rc-tmeta{display:flex;flex-direction:column;gap:6px;}\
      .rc-tmi{\
        display:flex;justify-content:space-between;align-items:center;gap:8px;\
        padding:5px 0;border-bottom:1px solid rgba(59,130,246,.07);\
      }\
      .rc-tmi:last-child{border-bottom:none;padding-bottom:0;}\
      .rc-tml{font-size:.73rem;color:rgba(148,163,184,.6);}\
      .rc-tmv{font-size:.73rem;font-weight:600;color:#e2e8f0;text-align:right;}\
    ';
    document.head.appendChild(s);
  }

  function buildTokenCard(token, user, days) {
    var uid = localStorage.getItem(UID_KEY) || '';
    var wrap = document.createElement('div');
    wrap.className = 'rc-td';
    wrap.setAttribute('data-rc-token-injected', '1');
    wrap.innerHTML = '<div class="rc-tcard">'
      + '<div class="rc-tlabel">Token de Acesso</div>'
      + '<div class="rc-trow">'
      + '<span class="rc-tval" id="rc-tv">' + token + '</span>'
      + '<button class="rc-tcopy" id="rc-tcp" title="Copiar token">&#x2398;</button>'
      + '</div>'
      + '<div class="rc-tmeta">'
      + '<div class="rc-tmi"><span class="rc-tml">Para que serve</span><span class="rc-tmv">Acesso exclusivo aos jogos</span></div>'
      + '<div class="rc-tmi"><span class="rc-tml">Vinculado a</span><span class="rc-tmv">@' + user + '</span></div>'
      + '<div class="rc-tmi"><span class="rc-tml">Quem pode usar</span><span class="rc-tmv">Somente @' + user + '</span></div>'
      + '<div class="rc-tmi"><span class="rc-tml">Conta com</span><span class="rc-tmv">' + days + ' dias</span></div>'
      + '</div>'
      + '</div>';

    // copy button logic
    setTimeout(function() {
      var copyBtn = document.getElementById('rc-tcp');
      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          playClick();
          navigator.clipboard && navigator.clipboard.writeText(token).then(function() {
            copyBtn.innerHTML = '&#x2713;';
            setTimeout(function(){ copyBtn.innerHTML = '&#x2398;'; }, 1800);
          });
        });
      }
    }, 100);

    return wrap;
  }

  function tryInjectTokenInfo() {
    var token = getToken();
    var user  = getUser();
    var days  = getDays();
    if (!token || !user) return;

    injectTokenStyles();

    document.querySelectorAll('[data-testid="button-generate-token"]:not([data-rc-ti])').forEach(function(btn) {
      btn.setAttribute('data-rc-ti', '1');
      var parent = btn.parentElement;
      if (!parent) return;
      var card = buildTokenCard(token, user, days);
      parent.replaceChild(card, btn);
    });
  }

  /* ═══════════════════════════════════════════════════
     MUTATION OBSERVER
  ═══════════════════════════════════════════════════ */
  var observer = new MutationObserver(function() {
    // Sound on all buttons/links
    document.querySelectorAll('button:not([data-rc-s]),a:not([data-rc-s])').forEach(function(el) {
      el.setAttribute('data-rc-s', '1');
      el.addEventListener('click', playClick);
    });

    // Inject token info in modal
    tryInjectTokenInfo();

    // Enforce account verification before accessing game
    document.querySelectorAll('[data-testid="button-access-game"]:not([data-rc-e])').forEach(function(el) {
      el.setAttribute('data-rc-e', '1');
      el.addEventListener('click', function(e) {
        if (!getToken()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          showWarning();
        }
      }, true);
    });

    // Wire language buttons
    document.querySelectorAll('#rc-lang-overlay .rc-btn:not([data-rc-l])').forEach(function(btn) {
      btn.setAttribute('data-rc-l', '1');
      btn.addEventListener('click', function() {
        playClick();
        dismissLangOverlay(btn.dataset.lang);
      });
    });
  });

  /* ═══════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════ */
  function init() {
    observer.observe(document.body, { childList: true, subtree: true });

    if (!getToken()) {
      createVerifyOverlay();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
