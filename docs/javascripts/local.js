(function () {
  var snippets = [
    { lang: "python", code:
"jen = {\n" +
"    \"was\": [\"QA\", \"tech ops\"],\n" +
"    \"now\": [\"security\", \"devops\", \"ai\"],\n" +
"    \"fuel\": \"preworkout and coffee\",\n" +
"}" },
    { lang: "python", code:
"while curious:  # i.e. always\n" +
"    system = pick_something()\n" +
"    problem = pull_apart(system)\n" +
"    lesson = figure_out(problem)\n" +
"    write_up(lesson)" },
    { lang: "bash", code:
"for topic in security devops ai; do\n" +
"    learn \"$topic\"\n" +
"    build \"$topic\"\n" +
"    document \"$topic\"\n" +
"done" }
  ];

  function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function highlight(code){
    var out = "", i = 0;
    // protect strings first
    var parts = code.split(/("(?:[^"\\]|\\.)*")/g);
    for (var p = 0; p < parts.length; p++){
      var seg = parts[p];
      if (p % 2 === 1){ out += '<span class="tk-str">' + esc(seg) + '</span>'; continue; }
      var s = esc(seg);
      s = s.replace(/(#.*)$/gm, '<span class="tk-com">$1</span>');
      s = s.replace(/\b(while|for|in|do|done|def|return|if|else|elif)\b/g, '<span class="tk-kw">$1</span>');
      s = s.replace(/\b(True|False|None)\b/g, '<span class="tk-bool">$1</span>');
      s = s.replace(/\b([a-z_][a-z0-9_]*)(?=\()/g, '<span class="tk-fn">$1</span>');
      out += s;
    }
    return out;
  }

  function init(){
    var el = document.getElementById("sj-code");
    var langEl = document.getElementById("sj-code-lang");
    if (el){
      var idx = Math.floor(Math.random() * snippets.length);
      function show(){
        var s = snippets[idx];
        el.innerHTML = highlight(s.code);
        if (langEl) langEl.textContent = s.lang;
      }
      show();
      setInterval(function(){
        el.style.opacity = "0";
        setTimeout(function(){
          idx = (idx + 1) % snippets.length;
          show();
          el.style.opacity = "1";
        }, 300);
      }, 4500);
    }

    // filters (multi-select):
    //   - domain pills (Cybersecurity / Python / DevOps) OR-combine with each other
    //   - "Built with AI" is a method toggle that AND-combines on top of the domains
    //   - "All" clears everything; it re-activates itself whenever nothing else is on
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".sj-filter"));
    var allBtn = document.querySelector('.sj-filter[data-filter="all"]');
    var methodBtn = document.querySelector(".sj-filter--ai");
    // Reserve the row's real height (measured from a live card) so it never collapses / jumps when filtered to empty.
    var carTrack = document.querySelector(".sj-carousel-track");
    function measureCarousel(){
      if (!carTrack) return;
      var card = carTrack.querySelector(".sj-feat-card:not(.sj-clone)");
      if (card && card.offsetHeight) carTrack.style.minHeight = card.offsetHeight + "px";
    }
    function applyFilters(){
      measureCarousel();
      var domains = filterBtns.filter(function(b){
        return b !== allBtn && b !== methodBtn && b.classList.contains("is-active");
      }).map(function(b){ return b.getAttribute("data-filter"); });
      var methodOn = !!(methodBtn && methodBtn.classList.contains("is-active"));
      if (allBtn) allBtn.classList.toggle("is-active", domains.length === 0 && !methodOn);
      var shown = 0;
      document.querySelectorAll(".sj-feat-card:not(.sj-clone)").forEach(function(c){
        var discs = (c.getAttribute("data-disc") || "").split(/\s+/);   // space-separated, supports multiple
        var domainMatch = domains.length === 0 || domains.some(function(d){ return discs.indexOf(d) !== -1; });
        var methodMatch = !methodOn || discs.indexOf("built-ai") !== -1;
        var vis = domainMatch && methodMatch;
        c.style.display = vis ? "" : "none";
        if (vis) shown++;
      });
      var emptyEl = document.querySelector(".sj-carousel-empty");
      if (emptyEl) emptyEl.hidden = shown > 0;
      var car = document.querySelector(".sj-carousel");
      if (car) car.classList.toggle("sj-carousel--empty", shown === 0);
      if (window.buildLoop) window.buildLoop();
      tagClippedFeat();
    }
    filterBtns.forEach(function(btn){
      if (btn.__sjFilterBound) return;   // avoid double-binding on re-init
      btn.__sjFilterBound = true;
      btn.addEventListener("click", function(){
        // touch devices can synthesise a duplicate click after touchend; ignore the echo
        var now = Date.now();
        if (btn.__sjLastTap && now - btn.__sjLastTap < 400) return;
        btn.__sjLastTap = now;
        if (btn === allBtn){
          filterBtns.forEach(function(b){ b.classList.remove("is-active"); });
          allBtn.classList.add("is-active");
        } else {
          btn.classList.toggle("is-active");
          if (allBtn) allBtn.classList.remove("is-active");
        }
        applyFilters();
      });
    });
    measureCarousel();
    if (!window.__sjMeasureBound){
      window.__sjMeasureBound = true;
      window.addEventListener("load", measureCarousel);
      window.addEventListener("resize", measureCarousel);
    }

    // ===== Featured carousel: infinite loop (prev sliver + focus + next peek) =====
    var track = document.querySelector(".sj-carousel-track");
    var prev = document.querySelector(".sj-carousel-prev");
    var next = document.querySelector(".sj-carousel-next");
    var loopOn = false, loopUnit = 0;
    var LOOP = window.__sjLoop || (window.__sjLoop = { start: 0 });   // shared across bind() re-inits so the arrows read the CURRENT loop geometry
    function peekPx(){ return parseFloat(getComputedStyle(track).scrollPaddingLeft) || 38; }
    function gapPx(){ var g = getComputedStyle(track); return parseFloat(g.columnGap || g.gap) || 16; }
    function realCards(){
      return [].slice.call(track.querySelectorAll(".sj-feat-card")).filter(function(c){
        return !c.classList.contains("sj-clone") && c.style.display !== "none";
      });
    }
    function stepPx(){
      var rs = realCards();
      if (rs.length < 2) return track.clientWidth * 0.5;
      return rs[1].getBoundingClientRect().left - rs[0].getBoundingClientRect().left;   // one tile + gap
    }
    window.updateFade = function(){
      if (!track) return;
      track.classList.remove("fade-l", "fade-r", "fade-lr");
      if (track.querySelector(".sj-clone")){ track.classList.add("fade-lr"); return; }   // clones present = looping; feather both edges
      var sl = track.scrollLeft, max = track.scrollWidth - track.clientWidth;
      if (max <= 2) return;
      if (sl <= 2) track.classList.add("fade-r");
      else if (sl >= max - 2) track.classList.add("fade-l");
      else track.classList.add("fade-lr");
    };
    function normalize(){
      // Read the live DOM, not the closure's loopOn: document$ re-runs bind() so the arrow handlers
      // keep the FIRST closure's loopOn (stale = true), while filtering rebuilds the loop via the latest
      // closure. No clones present = no active loop = nothing to normalize (prevents the snap-back on filtered arrows).
      if (!track.querySelector(".sj-clone")) return;
      var N = realCards().length; if (N < 2) return;
      var st = stepPx(), pk = peekPx();
      var k = Math.round((track.scrollLeft - (LOOP.start - pk)) / st);  // nearest tile index (may be <0 or >=N)
      var kmod = ((k % N) + N) % N;                                     // wrap into the real set
      track.scrollLeft = Math.round(LOOP.start + kmod * st - pk);       // exact real-tile gutter (drift-free)
    }
    window.updateArrows = function(){
      // Non-looping (1-2 cards): disable the arrow that points at nothing (edge-aware, updates on scroll).
      // Looping (3+ cards, clones present): infinite, so both stay active. Read live DOM, not a stale flag.
      if (!track) return;
      var looping = !!track.querySelector(".sj-clone");
      var pd = false, nd = false;
      if (!looping){
        var rs = realCards();
        if (rs.length < 1){ pd = nd = true; }
        else {
          var tr = track.getBoundingClientRect();
          var firstR = rs[0].getBoundingClientRect();
          var lastR = rs[rs.length - 1].getBoundingClientRect();
          var sl = track.scrollLeft, max = track.scrollWidth - track.clientWidth;
          pd = sl <= 1 || firstR.left >= tr.left - 1;         // at scroll start, or first card fully in view
          nd = sl >= max - 1 || lastR.right <= tr.right + 1;  // at scroll end, or last card fully in view
        }
      }
      if (prev) prev.disabled = pd;
      if (next) next.disabled = nd;
    };
    window.buildLoop = function(){
      if (!track) return;
      track.querySelectorAll(".sj-clone").forEach(function(n){ n.remove(); });
      track.style.paddingRight = "";
      var rs = realCards();
      // Loop whenever there are at least 3 visible cards, filtered views included. The arrows read the
      // shared loop geometry (LOOP.start), so they can't snap back using a stale closure value.
      loopOn = rs.length >= 3;
      if (!loopOn){ track.scrollLeft = 0; updateFade(); window.updateArrows(); return; }
      var mk = function(c){ var cl = c.cloneNode(true); cl.classList.add("sj-clone"); cl.setAttribute("aria-hidden", "true"); return cl; };
      var af = document.createDocumentFragment(); rs.forEach(function(c){ af.appendChild(mk(c)); }); track.appendChild(af);            // clone-set AFTER
      var pf = document.createDocumentFragment(); rs.forEach(function(c){ pf.appendChild(mk(c)); }); track.insertBefore(pf, track.firstChild); // clone-set BEFORE
      var tl = track.getBoundingClientRect().left, sl = track.scrollLeft;
      var first = rs[0], last = rs[rs.length - 1];
      LOOP.start = Math.round(first.getBoundingClientRect().left - tl + sl);
      loopUnit = Math.round((last.getBoundingClientRect().right - tl + sl) + gapPx() - LOOP.start);  // one set-width
      track.scrollLeft = LOOP.start - peekPx();          // first real tile focused at the gutter
      updateFade();
      window.updateArrows();
    };
    if (track && prev && next){
      if (!next.__sjbound){
        next.__sjbound = true;
        var animating = false;
        function animateTo(target, done){
          var start = track.scrollLeft, dist = target - start, t0 = 0, dur = 340;
          animating = true;
          (function frame(now){
            if (!t0) t0 = now;
            var p = Math.min(1, (now - t0) / dur);
            var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // easeInOutQuad
            track.scrollLeft = Math.round(start + dist * e);
            if (p < 1) requestAnimationFrame(frame);
            else { animating = false; if (done) done(); }
          })(performance.now());
        }
        var go = function(dir){ if (!animating) animateTo(track.scrollLeft + dir * stepPx(), function(){ normalize(); window.updateArrows(); }); };
        prev.addEventListener("click", function(){ go(-1); });
        next.addEventListener("click", function(){ go(1); });
        track.addEventListener("scroll", function(){ window.requestAnimationFrame(function(){ updateFade(); if (window.updateArrows) window.updateArrows(); }); });
        window.addEventListener("resize", function(){ window.buildLoop(); });
        window.addEventListener("load", function(){ window.buildLoop(); });
      }
      window.buildLoop();
    }

    // clipped-text tooltip for featured tiles (cursor-following bubble, theme-styled)
    tagClippedFeat();
    window.addEventListener("resize", tagClippedFeat);
    if (!window.__sjFeatTipInit){
      window.__sjFeatTipInit = true;
      var featTip = document.createElement("div");
      featTip.className = "sj-cursor-tip";
      document.body.appendChild(featTip);
      var on = false;
      document.addEventListener("mousemove", function(e){
        var card = e.target && e.target.closest ? e.target.closest(".sj-feat-card[data-feat-tip]") : null;
        if (!card){ if (on){ featTip.style.opacity = "0"; on = false; } return; }
        featTip.textContent = card.getAttribute("data-feat-tip");
        if (!on){ featTip.style.opacity = "1"; on = true; }
        var pad = 14, w = featTip.offsetWidth, h = featTip.offsetHeight;
        var x = e.clientX + pad, y = e.clientY + pad;
        if (x + w > window.innerWidth - 8) x = e.clientX - pad - w;
        if (y + h > window.innerHeight - 8) y = e.clientY - pad - h;
        featTip.style.left = Math.max(8, x) + "px";
        featTip.style.top = Math.max(8, y) + "px";
      }, { passive: true });
      window.addEventListener("scroll", function(){ featTip.style.opacity = "0"; on = false; }, { passive: true, capture: true });
    }
  }
  function tagClippedFeat(){
    document.querySelectorAll(".sj-feat-card").forEach(function(card){
      var d = card.querySelector(".sj-card-desc");
      var full = null;
      if (d && d.scrollHeight > d.clientHeight + 1) full = d.textContent.trim();
      if (full) card.setAttribute("data-feat-tip", full);
      else card.removeAttribute("data-feat-tip");
    });
  }
  function updateFade(){ if (window.updateFade) window.updateFade(); }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
})();

/* highlight the target section with a gold pulse when its hero CTA / toc link is clicked */
(function () {
  function boxFor(href){
    if (href === "#featured") return document.querySelector(".sj-featwrap");   // glow the whole featured section (header + tiles)
    var el = document.getElementById(href.slice(1));
    if (!el || !el.closest) return null;
    if (href === "#about-me" || href === "#lets-connect") return el.closest(".sj-panel");
    return el.closest(".sj-hub");     // #portfolio, #learning
  }
  function bind(){
    document.querySelectorAll('a[href="#portfolio"], a[href="#learning"], a[href="#featured"], a[href="#about-me"], a[href="#lets-connect"]').forEach(function(a){
      if (a.__sjFlash) return;
      a.__sjFlash = true;
      a.addEventListener("click", function(){
        var box = boxFor(a.getAttribute("href"));
        if (!box) return;
        box.classList.remove("sj-flash");
        void box.offsetWidth;            // force reflow so a repeat click restarts the animation
        box.classList.add("sj-flash");
        setTimeout(function(){ box.classList.remove("sj-flash"); }, 4200);
      });
    });
  }
  if (document.readyState !== "loading") bind();
  else document.addEventListener("DOMContentLoaded", bind);
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(bind);
})();


/* ==========================================================================
   AI digital twin: launcher + panel
   Streams NDJSON from the twin API and renders the answer as markdown,
   sanitised in the browser. Contract: API.md in the ai-digital-twin repo.
   ========================================================================== */
(function () {
  "use strict";

  var LIVE_API = "https://ai-digital-twin-skyejen.vercel.app";
  var LOG_KEY = "sj-twin-log";
  // How the panel was left. A refresh that throws away an open conversation is
  // the kind of small rudeness people remember. Per browser, like the
  // transcript it belongs to, and wrapped because private mode can throw.
  var VIEW_KEY = "sj-twin-view";

  function remember() {
    try {
      localStorage.setItem(VIEW_KEY, el.panel.hidden ? "closed"
        : el.panel.classList.contains("sj-twin-panel--max") ? "max" : "open");
    } catch (e) { /* the default is a closed panel, which is fine */ }
  }

  function remembered() {
    try { return localStorage.getItem(VIEW_KEY); } catch (e) { return null; }
  }

  // Read per call rather than once, so a local API can be pointed at while the
  // page is open, and remembered so a refresh cannot send half the requests
  // back to production:
  //   localStorage.setItem("sj-twin-api", "http://127.0.0.1:8010")
  // A trailing slash is stripped. Paths are appended directly, so ".../app/" and
  // "/api/chips" make a double slash, which the host answers with a redirect
  // that carries no CORS headers - the request then fails before reaching a
  // handler, and the console blames CORS rather than the slash.
  function api() {
    var url = LIVE_API;
    if (window.SJ_TWIN_API) {
      url = window.SJ_TWIN_API;
    } else {
      try { url = localStorage.getItem("sj-twin-api") || LIVE_API; } catch (e) { url = LIVE_API; }
    }
    return String(url).replace(/\/+$/, "");
  }

  // Shown in place of an empty feed. Deliberately NOT pushed into `log`: it is
  // not something the model said, and putting it in the transcript would send it
  // back as history and let the model treat its own greeting as prior context.
  // Plain text rather than markdown, so it does not wait on the renderer libs.
  var GREETING = "Hey, I'm Jen's AI twin. Ask me about her career, " +
    "her projects, or how she works.";

  // One glyph per chip. The API sends an icon key alongside each label, so the
  // set is chosen server-side and this is only the drawing. An unknown key
  // renders no icon rather than a broken box.
  var CHIP_ICONS = {
    "twin-chip-code": '<polyline points="9 7 4 12 9 17"></polyline>' +
      '<polyline points="15 7 20 12 15 17"></polyline>',
    "twin-chip-flow": '<line x1="6" y1="3" x2="6" y2="15"></line>' +
      '<circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle>' +
      '<path d="M18 9a9 9 0 0 1-9 9"></path>',
    "twin-chip-ops": '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
    "twin-chip-release": '<polyline points="23 4 23 10 17 10"></polyline>' +
      '<polyline points="1 20 1 14 7 14"></polyline>' +
      '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>',
    "twin-chip-qa": '<polyline points="9 11 12 14 22 4"></polyline>' +
      '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
    "twin-chip-docs": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
      '<polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line>' +
      '<line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line>',
    "twin-chip-learn": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>' +
      '<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
    "twin-chip-solve": '<path d="M9 18h6"></path><path d="M10 21h4"></path>' +
      '<path d="M12 3a6 6 0 0 0-4 10c.5.5 1 1.2 1 2h6c0-.8.5-1.5 1-2a6 6 0 0 0-4-10z"></path>',
    "twin-chip-person": '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
      '<circle cx="12" cy="7" r="4"></circle>'
  };

  // Stand-ins shown until the chips arrive, so an opened panel never looks
  // broken while a sleeping function wakes up. Spans, not buttons, so there is
  // nothing to focus or click, and aria-hidden so a screen reader skips them.
  var GHOSTS = [7, 5, 6].map(function (n) {
    return '<span class="sj-twin-chip sj-twin-chip--ghost" aria-hidden="true">' +
      new Array(n + 1).join("\u00a0") + "</span>";
  }).join("");

  // The API rejects a transcript larger than this, so trim before sending
  // rather than letting a long conversation start failing with a 400.
  var MAX_TURNS = 20;
  var MAX_CHARS = 8000;

  // Pinned with an integrity hash, so a compromised CDN cannot swap them out.
  var LIBS = [
    { url: "https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.4.15/purify.min.js", sri: "sha512-jeyPlk6E7VcWU2QTRw5UAe4iKLrWOJkyLc4GkOAOey1tOeTyxfTzrCY7p84VSer8/lRON5p236RGVeTErze9fA==", ready: function () { return window.DOMPurify; } },
    { url: "https://cdnjs.cloudflare.com/ajax/libs/marked/18.0.13/lib/marked.umd.min.js", sri: "sha512-kHavuYjOa82OKvUxD8j04s+kMIH84FmETnuIgj0yFyY9LWU10sXNwU54Iozpewat8VxAzH4aXiwTEZMRrpwfBw==", ready: function () { return window.marked; } }
  ];

  var log = load();
  var chips = null;
  var busy = false;
  var el = {};

  /* ---------------------------------------------------------------- store */

  function load() {
    try {
      var raw = localStorage.getItem(LOG_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-MAX_TURNS)));
    } catch (e) {
      /* private browsing, blocked storage: the conversation still works */
    }
  }

  /* ------------------------------------------------------------ libraries */

  function loadScript(lib) {
    return new Promise(function (resolve, reject) {
      if (lib.ready()) return resolve();
      var s = document.createElement("script");
      s.src = lib.url;
      s.integrity = lib.sri;
      s.crossOrigin = "anonymous";
      s.referrerPolicy = "no-referrer";
      s.onload = function () { lib.ready() ? resolve() : reject(new Error("loaded but absent")); };
      s.onerror = function () { reject(new Error("blocked")); };
      document.head.appendChild(s);
    });
  }

  var libsReady = null;
  function ensureLibs() {
    if (!libsReady) libsReady = Promise.all(LIBS.map(loadScript));
    return libsReady;
  }

  /* --------------------------------------------------------------- render */

  function asText(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function toHtml(markdown) {
    // Sanitising happens here because this is where the HTML is finally
    // parsed. A sanitiser anywhere else reads the markup with a different
    // parser from the one that renders it, and mutation XSS lives in that gap.
    if (!window.marked || !window.DOMPurify) return "<p>" + asText(markdown) + "</p>";
    var html = window.marked.parse(markdown, { breaks: true });
    return window.DOMPurify.sanitize(html, { ADD_ATTR: ["target", "rel"] });
  }

  function clock(at) {
    var d = new Date(at);
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(function (n) { return n < 10 ? "0" + n : String(n); }).join(":");
  }

  // The label and time are hidden until the panel is maximised: in a 380px
  // column they spend a line that belongs to the answer. A transcript restored
  // from before they existed has no time, and simply renders without one.
  function bubble(role, markdown, at) {
    var b = document.createElement("div");
    b.className = "sj-twin-msg sj-twin-msg--" + role;

    var meta = document.createElement("span");
    meta.className = "sj-twin-meta";
    meta.setAttribute("aria-hidden", "true");
    meta.innerHTML = "<b>" + (role === "user" ? "YOU" : "JEN//AI") + "</b>" +
      (at ? "<time>" + clock(at) + "</time>" : "");
    b.appendChild(meta);

    var body = document.createElement("div");
    body.className = "sj-twin-body";
    if (role === "user") body.textContent = markdown;
    else body.innerHTML = toHtml(markdown);
    body.querySelectorAll("a[href]").forEach(function (a) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    b.appendChild(body);
    return b;
  }

  function drawLog() {
    el.feed.innerHTML = "";
    if (!log.length) {
      var hi = document.createElement("div");
      hi.className = "sj-twin-msg sj-twin-msg--assistant sj-twin-greet";
      var hmeta = document.createElement("span");
      hmeta.className = "sj-twin-meta";
      hmeta.setAttribute("aria-hidden", "true");
      hmeta.innerHTML = "<b>JEN//AI</b>";
      var hbody = document.createElement("div");
      hbody.className = "sj-twin-body";
      hbody.textContent = GREETING;
      hi.appendChild(hmeta);
      hi.appendChild(hbody);
      el.feed.appendChild(hi);
    }
    log.forEach(function (m) { el.feed.appendChild(bubble(m.role, m.content, m.at)); });
    drawChips();
    scrollDown();
  }

  // Deferred a frame on purpose. Called straight after appendChild, scrollHeight
  // can be measured before the browser has laid the new message out, which
  // leaves the feed parked somewhere that is no longer the bottom.
  function scrollDown() {
    var go = function () { el.feed.scrollTop = el.feed.scrollHeight; };
    if (window.requestAnimationFrame) window.requestAnimationFrame(go);
    else go();
  }

  function drawChecklist(steps, done, total) {
    // create_checklist replaces the plan, so render the latest rather than
    // merging it into whatever arrived before.
    var box = el.feed.querySelector(".sj-twin-plan") || (function () {
      var d = document.createElement("div");
      d.className = "sj-twin-plan";
      el.feed.appendChild(d);
      return d;
    })();
    var items = (steps || []).map(function (s) {
      return '<li data-state="' + asText(s.status || "pending") + '">' + asText(s.title || "") + "</li>";
    }).join("");
    box.innerHTML = '<p class="sj-twin-plan-head">Working through it (' +
      asText(String(done || 0)) + " of " + asText(String(total || 0)) + ")</p><ol>" + items + "</ol>";
    scrollDown();
  }

  function clearPending() {
    var p = el.feed.querySelector(".sj-twin-plan");
    if (p) p.remove();
    var t = el.feed.querySelector(".sj-twin-thinking");
    if (t) t.remove();
  }

  /* ---------------------------------------------------------------- chips */

  // Called once the page is idle rather than when the panel opens. The API is a
  // serverless function that sleeps, and a cold start is seconds - long enough
  // that a visitor who opened the panel would watch an empty box and leave. The
  // same request wakes the function, so the first question is quicker too.
  var chipsAsked = false;

  function fillChips() {
    if (chips) return drawChips();
    if (chipsAsked) return;
    chipsAsked = true;
    fetch(api() + "/api/chips")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (body) {
        if (!body || !Array.isArray(body.chips)) return;
        chips = body.chips;
        drawChips();
      })
      .catch(function () {
        // No chips is a quieter failure than a broken panel, but allow a retry
        // on the next open in case the first request lost the network.
        chipsAsked = false;
        if (el.chipwrap) el.chipwrap.hidden = true;
      });
  }

  // Fired after load, and after any onload work, so it never competes with the
  // page's own rendering.
  function warmChips() {
    if (window.requestIdleCallback) window.requestIdleCallback(fillChips, { timeout: 3000 });
    else setTimeout(fillChips, 1200);
  }

  function drawChips() {
    if (!chips) return;
    // An asked chip is dimmed rather than removed: it stays a record of what
    // has been covered, and asking the same thing twice is allowed.
    var asked = log.filter(function (m) { return m.role === "user"; })
                   .map(function (m) { return m.content; });
    el.chips.innerHTML = "";
    chips.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "sj-twin-chip" + (asked.indexOf(c.question) === -1 ? "" : " sj-twin-chip--used");
      // Glyph as markup, label as text: the label comes from the API and is
      // never trusted as HTML.
      if (CHIP_ICONS[c.icon]) b.innerHTML = icon(CHIP_ICONS[c.icon], "sj-twin-chip-i");
      var label = document.createElement("span");
      label.textContent = c.label;
      b.appendChild(label);
      b.addEventListener("click", function () { send(c.question); });
      el.chips.appendChild(b);
    });
    el.chipwrap.hidden = chips.length === 0;
  }

  /* ----------------------------------------------------------------- send */

  function trimmed() {
    var out = [], chars = 0;
    for (var i = log.length - 1; i >= 0 && out.length < MAX_TURNS; i--) {
      chars += (log[i].content || "").length;
      if (chars > MAX_CHARS) break;
      out.unshift({ role: log[i].role, content: log[i].content });
    }
    return out;
  }

  function fail(message) {
    clearPending();
    el.feed.appendChild(bubble("assistant", message, Date.now()));
    scrollDown();
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    el.send.disabled = true;
    el.input.value = "";

    var history = trimmed();
    log.push({ role: "user", content: text, at: Date.now() });
    save();
    drawChips();
    el.feed.appendChild(bubble("user", text, Date.now()));

    // Something moves from the moment the request leaves, rather than from
    // the first event: a turn can take up to 30 seconds.
    var wait = bubble("assistant", "", Date.now());
    wait.classList.add("sj-twin-thinking");
    wait.querySelector(".sj-twin-body").innerHTML =
      '<span class="sj-twin-composing">&gt; composing response...</span>' +
      '<span class="sj-twin-caret" aria-hidden="true"></span>';
    el.feed.appendChild(wait);
    scrollDown();

    ensureLibs().catch(function () { /* fall back to plain text rendering */ })
      .then(function () {
        return fetch(api() + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: history })
        });
      })
      .then(function (res) {
        if (!res.ok) {
          // A 429 is generated at the edge and is not one of the API's JSON
          // shapes, so it is recognised by status rather than parsed.
          if (res.status === 429) {
            throw new Error("That is a lot of questions at once. Give it a minute and try again.");
          }
          return res.json()
            .catch(function () { throw new Error("Something went wrong on my side. Please try again."); })
            .then(function (body) { throw new Error(body.message || "Something went wrong on my side."); });
        }
        return stream(res);
      })
      .catch(function (e) { fail(e.message || "I could not reach the server. Please try again."); })
      .then(function () {
        busy = false;
        el.send.disabled = false;
        el.input.focus();
      });
  }

  function stream(res) {
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var answered = false;

    function handle(line) {
      if (!line.trim()) return;
      var ev;
      try { ev = JSON.parse(line); } catch (e) { return; }
      if (ev.type === "checklist") drawChecklist(ev.steps, ev.done, ev.total);
      else if (ev.type === "error") { answered = true; fail(ev.message || "Something went wrong on my side."); }
      else if (ev.type === "answer") {
        answered = true;
        clearPending();
        var textOut = (ev.text || "").trim() || "I do not have an answer for that one. Try asking another way.";
        log.push({ role: "assistant", content: textOut, at: Date.now() });
        save();
        el.feed.appendChild(bubble("assistant", textOut, Date.now()));
        drawChips();
        scrollDown();
      }
    }

    function pump() {
      return reader.read().then(function (chunk) {
        if (chunk.done) {
          if (buffer) handle(buffer);
          if (!answered) fail("That answer stopped part way through. Please try again.");
          return;
        }
        buffer += decoder.decode(chunk.value, { stream: true });
        var lines = buffer.split("\n");
        buffer = lines.pop();
        lines.forEach(handle);
        return pump();
      });
    }
    return pump();
  }

  /* ----------------------------------------------------------------- open */

  function open() {
    el.panel.hidden = false;
    remember();
    document.documentElement.classList.add("sj-twin-open");
    fillChips();
    ensureLibs().then(drawLog, drawLog);
    setTimeout(function () { el.input.focus(); }, 60);
  }

  function close() {
    el.panel.hidden = true;
    remember();
    document.documentElement.classList.remove("sj-twin-open");
    el.launch.focus();
  }

  /* ----------------------------------------------------------------- build */

  function icon(paths, cls) {
    return '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" ' +
      'class="' + (cls || "") + '" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>";
  }

  function build() {
    if (document.getElementById("sj-twin-launch")) return;

    var launch = document.createElement("button");
    launch.id = "sj-twin-launch";
    launch.type = "button";
    launch.className = "sj-twin-launch";
    launch.setAttribute("aria-label", "Ask my AI twin");
    launch.innerHTML =
      '<span class="sj-twin-launch-mark" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 1 1 21 12Z"></path>' +
      '<path d="M8.5 12h.01M12 12h.01M15.5 12h.01"></path></svg></span>' +
      '<span class="sj-twin-launch-label">Ask my AI twin</span>';

    var panel = document.createElement("div");
    panel.className = "sj-twin-panel";
    panel.id = "sj-twin-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-label", "Ask Jen's AI twin");
    panel.innerHTML =
      '<header class="sj-twin-head">' +
        '<div class="sj-twin-title">' +
          "<strong>Jen's AI twin</strong>" +
        "</div>" +
        '<button type="button" class="sj-twin-icon sj-twin-reset" ' +
          'data-tip="Start a new chat" aria-label="Start a new chat">' +
          icon('<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v5h5"></path>') +
        "</button>" +
        '<button type="button" class="sj-twin-icon sj-twin-max" ' +
          'data-tip="Expand" aria-label="Expand">' +
          icon('<path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path>' +
               '<path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path>', "sj-twin-i-out") +
          icon('<path d="M21 9h-6V3"></path><path d="M3 15h6v6"></path>' +
               '<path d="M14 10l7-7"></path><path d="M10 14l-7 7"></path>', "sj-twin-i-in") +
        "</button>" +
        '<button type="button" class="sj-twin-icon sj-twin-close" ' +
          'data-tip="Minimise" aria-label="Minimise">' +
          icon('<path d="M6 9l6 6 6-6"></path>') +
        "</button>" +
      "</header>" +
      '<div class="sj-twin-feed" tabindex="0"></div>' +
      '<div class="sj-twin-chipwrap"><div class="sj-twin-chips">' +
      GHOSTS + '</div></div>' +
      '<form class="sj-twin-ask">' +
        '<span class="sj-twin-field">' +
          '<input class="sj-twin-input" type="text" autocomplete="off" ' +
            'placeholder="Ask about her work" aria-label="Ask about her work">' +
          '<button class="sj-twin-send" type="submit" aria-label="Send">' +
            '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" ' +
            'fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>' +
          "</button>" +
        "</span>" +
      "</form>" +
      '<p class="sj-twin-note">Responses are generated by AI and may not ' +
      "always be accurate.</p>";

    document.body.appendChild(launch);
    document.body.appendChild(panel);

    el = {
      launch: launch,
      panel: panel,
      feed: panel.querySelector(".sj-twin-feed"),
      chipwrap: panel.querySelector(".sj-twin-chipwrap"),
      chips: panel.querySelector(".sj-twin-chips"),
      input: panel.querySelector(".sj-twin-input"),
      send: panel.querySelector(".sj-twin-send")
    };

    launch.addEventListener("click", function () { panel.hidden ? open() : close(); });
    panel.querySelector(".sj-twin-close").addEventListener("click", close);
    // No confirm dialog on purpose: a browser modal blocks everything until it
    // is dismissed, and the cost of a mis-click is one conversation.
    // Two clicks rather than a confirm dialog. A browser modal blocks the whole
    // page until dismissed; arming the button asks the same question in place,
    // and forgets it again after a few seconds if the answer never comes.
    var armed = null;
    var reset = panel.querySelector(".sj-twin-reset");
    reset.addEventListener("click", function () {
      if (!armed) {
        reset.classList.add("sj-twin-reset--armed");
        reset.setAttribute("data-tip", "Click again to clear this chat");
        armed = setTimeout(disarm, 4000);
        return;
      }
      disarm();
      log.length = 0;
      save();
      drawLog();
      el.input.focus();
    });
    function disarm() {
      clearTimeout(armed);
      armed = null;
      reset.classList.remove("sj-twin-reset--armed");
      reset.setAttribute("data-tip", "Start a new chat");
    }
    var maxBtn = panel.querySelector(".sj-twin-max");
    maxBtn.addEventListener("click", function () {
      panel.classList.toggle("sj-twin-panel--max");
      // The label describes what the next click will do. "Expand" on a panel
      // that is already expanded reads as a promise it cannot keep.
      var big = panel.classList.contains("sj-twin-panel--max");
      maxBtn.setAttribute("data-tip", big ? "Compact" : "Expand");
      maxBtn.setAttribute("aria-label", big ? "Compact" : "Expand");
      remember();
    });
    panel.querySelector(".sj-twin-ask").addEventListener("submit", function (e) {
      e.preventDefault();
      send(el.input.value);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) close();
    });

    // Collapse the label once the reader is past the hero, so it stops
    // competing with the page and becomes a handle.
    var shrink = function () {
      launch.classList.toggle("sj-twin-launch--small", window.scrollY > 260);
    };
    shrink();
    window.addEventListener("scroll", shrink, { passive: true });

    warmChips();

    // Shareable entry points, so a link in a post lands someone in the
    // conversation instead of on a page with a button to find.
    //   ?twin=1  or  ?twin  or  #twin   the panel, as it normally opens
    //   ?twin=2                         the panel, maximised
    // Also bound to hashchange: changing only the hash does not reload, and
    // build() returns early once the widget exists, so nothing would re-run.
    function syncMaxLabel() {
      var big = panel.classList.contains("sj-twin-panel--max");
      maxBtn.setAttribute("data-tip", big ? "Compact" : "Expand");
      maxBtn.setAttribute("aria-label", big ? "Compact" : "Expand");
    }

    function deepLink() {
      var q = /(?:^|[?&])twin(?:=([^&]*))?(?:&|$)/.exec(location.search);
      var want = q ? (q[1] || "1") : (location.hash === "#twin" ? "1" : null);
      if (!want) return false;
      panel.classList.toggle("sj-twin-panel--max", want === "2");
      syncMaxLabel();
      if (panel.hidden) open();
      return true;
    }

    // A link wins over whatever was remembered: someone arriving on /?twin=2
    // asked for the big panel in this visit, whatever they did last time.
    if (!deepLink()) {
      var was = remembered();
      if (was === "max") panel.classList.add("sj-twin-panel--max");
      if (was === "max" || was === "open") open();
      syncMaxLabel();
    }
    window.addEventListener("hashchange", deepLink);
  }

  if (document.readyState !== "loading") build();
  else document.addEventListener("DOMContentLoaded", build);
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(build);
})();
