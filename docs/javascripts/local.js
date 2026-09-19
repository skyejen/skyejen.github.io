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

  // Read per call rather than once, so a local API can be pointed at while the
  // page is open, and remembered so a refresh cannot send half the requests
  // back to production:
  //   localStorage.setItem("sj-twin-api", "http://127.0.0.1:8010")
  function api() {
    if (window.SJ_TWIN_API) return window.SJ_TWIN_API;
    try { return localStorage.getItem("sj-twin-api") || LIVE_API; } catch (e) { return LIVE_API; }
  }

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

  function bubble(role, markdown) {
    var b = document.createElement("div");
    b.className = "sj-twin-msg sj-twin-msg--" + role;
    if (role === "user") b.textContent = markdown;
    else b.innerHTML = toHtml(markdown);
    b.querySelectorAll("a[href]").forEach(function (a) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    return b;
  }

  function drawLog() {
    el.feed.innerHTML = "";
    log.forEach(function (m) { el.feed.appendChild(bubble(m.role, m.content)); });
    drawChips();
    scrollDown();
  }

  function scrollDown() {
    el.feed.scrollTop = el.feed.scrollHeight;
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

  function fillChips() {
    if (chips) return drawChips();
    fetch(api() + "/api/chips")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (body) {
        if (!body || !Array.isArray(body.chips)) return;
        chips = body.chips;
        drawChips();
      })
      .catch(function () { /* no chips is a quieter failure than a broken panel */ });
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
      b.textContent = c.label;
      b.addEventListener("click", function () { send(c.question); });
      el.chips.appendChild(b);
    });
    el.chipwrap.hidden = chips.length === 0;
    el.chipwrap.classList.toggle("sj-twin-chips--started", asked.length > 0);
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
    el.feed.appendChild(bubble("assistant", message));
    scrollDown();
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    el.send.disabled = true;
    el.input.value = "";

    var history = trimmed();
    log.push({ role: "user", content: text });
    save();
    drawChips();
    el.feed.appendChild(bubble("user", text));

    // Something moves from the moment the request leaves, rather than from
    // the first event: a turn can take up to 30 seconds.
    var wait = document.createElement("div");
    wait.className = "sj-twin-thinking";
    wait.innerHTML = "<span></span><span></span><span></span>";
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
        log.push({ role: "assistant", content: textOut });
        save();
        el.feed.appendChild(bubble("assistant", textOut));
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
    document.documentElement.classList.add("sj-twin-open");
    fillChips();
    ensureLibs().then(drawLog, drawLog);
    setTimeout(function () { el.input.focus(); }, 60);
  }

  function close() {
    el.panel.hidden = true;
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
          '<em>She built it. Ask about her work.</em>' +
        "</div>" +
        '<button type="button" class="sj-twin-icon sj-twin-max" aria-label="Expand">' +
          icon('<path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path>' +
               '<path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path>', "sj-twin-i-out") +
          icon('<path d="M21 9h-6V3"></path><path d="M3 15h6v6"></path>' +
               '<path d="M14 10l7-7"></path><path d="M10 14l-7 7"></path>', "sj-twin-i-in") +
        "</button>" +
        '<button type="button" class="sj-twin-icon sj-twin-close" aria-label="Close">' +
          icon('<path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>') +
        "</button>" +
      "</header>" +
      '<div class="sj-twin-feed" tabindex="0"></div>' +
      '<div class="sj-twin-chipwrap"><div class="sj-twin-chips"></div></div>' +
      '<form class="sj-twin-ask">' +
        '<input class="sj-twin-input" type="text" autocomplete="off" ' +
          'placeholder="Ask about her work" aria-label="Ask about her work">' +
        '<button class="sj-twin-send" type="submit" aria-label="Send">Send</button>' +
      "</form>";

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
    panel.querySelector(".sj-twin-max").addEventListener("click", function () {
      panel.classList.toggle("sj-twin-panel--max");
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
  }

  if (document.readyState !== "loading") build();
  else document.addEventListener("DOMContentLoaded", build);
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(build);
})();
