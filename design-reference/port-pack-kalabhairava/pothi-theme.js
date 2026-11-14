/* ==========================================================================
   The Pothi — night-reading control
   One file, loaded by every template. Markup in the running head:

   <button class="theme" type="button" data-theme-toggle aria-pressed="false"
           aria-label="Switch to night reading">
     <span class="sw" aria-hidden="true"></span><span class="lbl">Night</span>
   </button>

   The pre-paint script that applies the stored choice lives inline in <head>
   (see the templates); this file only handles the interaction.
   ========================================================================== */
(function () {
  var root = document.documentElement;
  var KEY = 'pothi-theme';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function isNight() {
    return root.getAttribute('data-theme') === 'night';
  }

  function label() {
    var night = isNight();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(night));
      b.setAttribute('aria-label', night ? 'Switch to day reading' : 'Switch to night reading');
      var l = b.querySelector('.lbl');
      if (l) l.textContent = night ? 'Day' : 'Night';
    });
  }

  function apply(night, persist) {
    if (night) root.setAttribute('data-theme', 'night');
    else root.removeAttribute('data-theme');
    if (persist) {
      try { localStorage.setItem(KEY, night ? 'night' : 'day'); } catch (e) {}
    }
    label();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    apply(!isNight(), true);
  });

  // Follow the system while the reader has not made an explicit choice.
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function (ev) {
      var stored = null;
      try { stored = localStorage.getItem(KEY); } catch (e) {}
      if (!stored) apply(ev.matches, false);
    });
  }

  label();
})();
