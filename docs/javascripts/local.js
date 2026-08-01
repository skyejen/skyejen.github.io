(function () {
  var snippets = [
    { lang: "python", code:
"jen = {\n" +
"    \"was\": \"QA + tech ops\",\n" +
"    \"now\": [\"security\", \"devops\", \"ai\"],\n" +
"    \"fuel\": \"preworkout, not coffee\",\n" +
"}" },
    { lang: "python", code:
"while curious:  # i.e. always\n" +
"    system = pick_something()\n" +
"    problem = pull_apart(system)\n" +
"    write_up(what_i_learned)\n" +
"    repeat()" },
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
        cards.forEach(function(c){
          c.style.display = (f === "all" || c.getAttribute("data-disc") === f) ? "" : "none";
        });
        updateFade();
        tagClippedFeat();
      });
    });

    // carousel + scroll-aware edge fade (peek into darkness)
    var track = document.querySelector(".sj-carousel-track");
    var prev = document.querySelector(".sj-carousel-prev");
    var next = document.querySelector(".sj-carousel-next");
    window.updateFade = function(){
      if (!track) return;
      var sl = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      track.classList.remove("fade-l", "fade-r", "fade-lr");
      if (max <= 2) return;                       // no overflow -> no fade
      if (sl <= 2) track.classList.add("fade-r"); // at start -> fade right only
      else if (sl >= max - 2) track.classList.add("fade-l"); // at end -> fade left only
      else track.classList.add("fade-lr");        // middle -> both
    };
    if (track && prev && next){
      var tileStep = function(){
        var cs = track.querySelectorAll(".sj-feat-card");
        if (cs.length >= 2) return cs[1].offsetLeft - cs[0].offsetLeft;   // one tile + gap
        if (cs.length) return cs[0].offsetWidth + 13;
        return track.clientWidth * 0.5;
      };
      prev.addEventListener("click", function(){
        var max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft <= 2) track.scrollTo({ left: max, behavior: "smooth" });   // wrap to end
        else track.scrollBy({ left: -tileStep(), behavior: "smooth" });
      });
      next.addEventListener("click", function(){
        var max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= max - 2) track.scrollTo({ left: 0, behavior: "smooth" }); // wrap to start
        else track.scrollBy({ left: tileStep(), behavior: "smooth" });
      });
      track.addEventListener("scroll", function(){ window.requestAnimationFrame(updateFade); });
      window.addEventListener("resize", updateFade);
      updateFade();
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
