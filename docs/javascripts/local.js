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

    // filters
    var filters = document.querySelectorAll(".sj-filter");
    var cards = document.querySelectorAll(".sj-feat-card");
    filters.forEach(function(btn){
      btn.addEventListener("click", function(){
        filters.forEach(function(b){ b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var f = btn.getAttribute("data-filter");
        document.querySelectorAll(".sj-feat-card:not(.sj-clone)").forEach(function(c){
          var discs = (c.getAttribute("data-disc") || "").split(/\s+/);   // supports multiple, space-separated
          c.style.display = (f === "all" || discs.indexOf(f) !== -1) ? "" : "none";
        });
        if (window.buildLoop) window.buildLoop();
        tagClippedFeat();
      });
    });

    // ===== Featured carousel: infinite loop (prev sliver + focus + next peek) =====
    var track = document.querySelector(".sj-carousel-track");
    var prev = document.querySelector(".sj-carousel-prev");
    var next = document.querySelector(".sj-carousel-next");
    var loopOn = false, loopUnit = 0, loopStart = 0;
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
      if (loopOn){ track.classList.add("fade-lr"); return; }          // loop: always feather both edges
      var sl = track.scrollLeft, max = track.scrollWidth - track.clientWidth;
      if (max <= 2) return;
      if (sl <= 2) track.classList.add("fade-r");
      else if (sl >= max - 2) track.classList.add("fade-l");
      else track.classList.add("fade-lr");
    };
    function normalize(){
      if (!loopOn) return;
      var N = realCards().length; if (N < 2) return;
      var st = stepPx(), pk = peekPx();
      var k = Math.round((track.scrollLeft - (loopStart - pk)) / st);  // nearest tile index (may be <0 or >=N)
      var kmod = ((k % N) + N) % N;                                     // wrap into the real set
      track.scrollLeft = Math.round(loopStart + kmod * st - pk);        // exact real-tile gutter (drift-free)
    }
    window.buildLoop = function(){
      if (!track) return;
      track.querySelectorAll(".sj-clone").forEach(function(n){ n.remove(); });
      track.style.paddingRight = "";
      var rs = realCards();
      loopOn = rs.length >= 3;
      if (!loopOn){ track.scrollLeft = 0; updateFade(); return; }
      var mk = function(c){ var cl = c.cloneNode(true); cl.classList.add("sj-clone"); cl.setAttribute("aria-hidden", "true"); return cl; };
      var af = document.createDocumentFragment(); rs.forEach(function(c){ af.appendChild(mk(c)); }); track.appendChild(af);            // clone-set AFTER
      var pf = document.createDocumentFragment(); rs.forEach(function(c){ pf.appendChild(mk(c)); }); track.insertBefore(pf, track.firstChild); // clone-set BEFORE
      var tl = track.getBoundingClientRect().left, sl = track.scrollLeft;
      var first = rs[0], last = rs[rs.length - 1];
      loopStart = Math.round(first.getBoundingClientRect().left - tl + sl);
      loopUnit = Math.round((last.getBoundingClientRect().right - tl + sl) + gapPx() - loopStart);  // one set-width
      track.scrollLeft = loopStart - peekPx();          // first real tile focused at the gutter
      updateFade();
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
        var go = function(dir){ if (!animating) animateTo(track.scrollLeft + dir * stepPx(), normalize); };
        prev.addEventListener("click", function(){ go(-1); });
        next.addEventListener("click", function(){ go(1); });
        track.addEventListener("scroll", function(){ window.requestAnimationFrame(updateFade); });
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
  function bind(){
    document.querySelectorAll('a[href="#portfolio"], a[href="#learning"]').forEach(function(a){
      if (a.__sjFlash) return;
      a.__sjFlash = true;
      a.addEventListener("click", function(){
        var el = document.getElementById(a.getAttribute("href").slice(1));
        var hub = el && el.closest ? el.closest(".sj-hub") : null;
        if (!hub) return;
        hub.classList.remove("sj-flash");
        void hub.offsetWidth;            // force reflow so a repeat click restarts the animation
        hub.classList.add("sj-flash");
        setTimeout(function(){ hub.classList.remove("sj-flash"); }, 4200);
      });
    });
  }
  if (document.readyState !== "loading") bind();
  else document.addEventListener("DOMContentLoaded", bind);
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(bind);
})();
