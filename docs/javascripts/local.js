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
      });
    });

    // carousel
    var track = document.querySelector(".sj-carousel-track");
    var prev = document.querySelector(".sj-carousel-prev");
    var next = document.querySelector(".sj-carousel-next");
    if (track && prev && next){
      prev.addEventListener("click", function(){ track.scrollBy({ left: -track.clientWidth * 0.55, behavior: "smooth" }); });
      next.addEventListener("click", function(){ track.scrollBy({ left: track.clientWidth * 0.55, behavior: "smooth" }); });
    }
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
})();
