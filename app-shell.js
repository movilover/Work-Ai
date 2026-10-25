/* BANA FASHION Admin — অ্যাপ শেল: ব্যাক বাটন, স্মুথ স্ক্রল, ইনস্টল বাটন, সার্ভিস ওয়ার্কার */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Service Worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }

  /* ---------- হালকা টোস্ট (ব্যাক বাটনের জন্য) ---------- */
  var tEl, tTimer;
  function hint(msg) {
    if (!tEl) {
      tEl = document.createElement('div');
      tEl.style.cssText = 'position:fixed;left:50%;bottom:calc(86px + env(safe-area-inset-bottom,0px));transform:translate(-50%,10px);z-index:400;background:#16161a;color:#fff;border:1px solid rgba(251,191,36,.35);padding:10px 16px;border-radius:999px;font:700 12.5px "Hind Siliguri","Plus Jakarta Sans",sans-serif;box-shadow:0 14px 40px -12px #000;opacity:0;transition:.25s;pointer-events:none;white-space:nowrap';
      document.body.appendChild(tEl);
    }
    tEl.textContent = msg;
    requestAnimationFrame(function () { tEl.style.opacity = 1; tEl.style.transform = 'translate(-50%,0)'; });
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { tEl.style.opacity = 0; tEl.style.transform = 'translate(-50%,10px)'; }, 2000);
  }

  /* ---------- ট্যাব ইতিহাস + স্ক্রল পজিশন ---------- */
  var cur = 'dash', stack = [], scrolls = {}, origT = null, internal = false;

  function wrapT() {
    if (origT || typeof window.T !== 'function') return !!origT;
    origT = window.T;
    window.T = function (k) {
      if (!internal) {
        scrolls[cur] = window.scrollY;
        if (k !== cur) { stack.push(cur); if (stack.length > 30) stack.shift(); }
      }
      cur = k;
      return origT.apply(this, arguments);
    };
    return true;
  }
  var wt = setInterval(function () { if (wrapT()) clearInterval(wt); }, 150);

  function goBackTo(k) {
    internal = true;
    try { origT(k); } finally { internal = false; }
    cur = k;
    var y = scrolls[k] || 0;
    setTimeout(function () { window.scrollTo(0, y); }, 60);
  }

  /* ---------- ওপরের লেয়ার (মডাল/পপআপ) বন্ধ করা ---------- */
  function zOf(el) { var m = /z-\[(\d+)\]/.exec(el.className || ''); return m ? +m[1] : 0; }
  function closeTop() {
    var list = Array.prototype.slice.call(document.querySelectorAll('.fixed.inset-0'))
      .filter(function (el) { return el.id !== 'login' && el.id !== 'app' && el.getClientRects().length > 0; });
    if (!list.length) {
      // এডিটর ফর্ম খোলা থাকলে (ব্যাকড্রপ ছাড়া) বর্তমান ট্যাব রিসেট করে বন্ধ
      if (document.querySelector('#v .ed') && origT) { internal = true; origT(cur); internal = false; return true; }
      return false;
    }
    list.sort(function (a, b) { return zOf(b) - zOf(a); });
    var el = list[0];
    if (el.id === 'invWrap') { el.remove(); return true; }
    if (el.id === 'odm' && window.CVD) { window.CVD(); return true; }
    if (el.id === 'rlm' && window.RLC) { window.RLC(); return true; }
    el.click();
    if (document.body.contains(el) && !el.closest('#v')) el.remove();
    return true;
  }

  /* ---------- ব্যাক বাটন সিস্টেম ---------- */
  var armed = false, armTimer;
  function guard() { if (!history.state || history.state.bf !== 1) history.pushState({ bf: 1 }, ''); }
  function disarm() { if (!armed) return; armed = false; clearTimeout(armTimer); guard(); }
  try { history.replaceState({ bf: 0 }, ''); history.pushState({ bf: 1 }, ''); } catch (e) {}

  window.addEventListener('popstate', function () {
    if (closeTop()) { guard(); return; }                          // ১) পপআপ বন্ধ
    if (stack.length) { goBackTo(stack.pop()); guard(); return; }    // ২) আগের পেজে
    if (cur !== 'dash') { goBackTo('dash'); guard(); return; }       // ৩) ড্যাশবোর্ডে
    if (armed) return;                                               // ৪) দ্বিতীয় ব্যাক = সিস্টেম নিজেই বের করে দেবে
    armed = true; clearTimeout(armTimer);
    armTimer = setTimeout(disarm, 2200);
    hint('বের হতে আবার ব্যাক চাপুন');                                // (এখানে ইচ্ছে করেই guard দিইনি)
  });
  // ২ সেকেন্ডের মধ্যে স্ক্রিনে টাচ করলে বা সময় শেষ হলে আবার নিরাপদ মোডে ফেরে
  document.addEventListener('pointerdown', disarm, true);

  /* ---------- অ্যান্ড্রয়েড APK (Capacitor) এর ব্যাক বাটন ---------- */
  function nativeBack() {
    var A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (!A || !A.addListener || nativeBack.done) return !!nativeBack.done;
    nativeBack.done = true;
    A.addListener('backButton', function (ev) {
      if (ev && ev.canGoBack) history.back(); else if (A.exitApp) A.exitApp();
    });
    return true;
  }
  var nb = 0, nbt = setInterval(function () { if (nativeBack() || ++nb > 40) clearInterval(nbt); }, 250);

  /* ---------- ইনস্টল বাটন ---------- */
  var dp = null;
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); dp = e;
    if (standalone || sessionStorage.getItem('bf-inst')) return;
    var b = document.createElement('button');
    b.innerHTML = '<i class="fa-solid fa-download" style="margin-right:8px"></i>অ্যাপ ইনস্টল করুন';
    b.style.cssText = 'position:fixed;right:14px;bottom:calc(90px + env(safe-area-inset-bottom,0px));z-index:350;background:linear-gradient(135deg,#FBBF24,#D97706);color:#000;font:800 13px "Hind Siliguri","Plus Jakarta Sans",sans-serif;padding:11px 16px;border-radius:14px;border:0;box-shadow:0 12px 30px -10px rgba(245,158,11,.7)';
    b.onclick = function () { dp.prompt(); dp.userChoice.finally(function () { b.remove(); dp = null; }); };
    var x = document.createElement('span'); x.textContent = ' ✕'; x.style.cssText = 'margin-left:10px;opacity:.6';
    x.onclick = function (ev) { ev.stopPropagation(); sessionStorage.setItem('bf-inst', '1'); b.remove(); };
    b.appendChild(x); document.body.appendChild(b);
  });
  window.addEventListener('appinstalled', function () { hint('অ্যাপ ইনস্টল হয়েছে ✓'); });

  /* ---------- অফলাইন নোটিশ ---------- */
  window.addEventListener('offline', function () { hint('ইন্টারনেট নেই — ডাটা আপডেট হবে না'); });
  window.addEventListener('online', function () { hint('ইন্টারনেট ফিরেছে ✓'); });
})();
