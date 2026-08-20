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
