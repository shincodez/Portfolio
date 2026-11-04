(function () {
  var root = document.documentElement,
    $ = function (i) {
      return document.getElementById(i);
    };
  /* tabs */
  var tabs = document.querySelectorAll(".tabs button"),
    panels = document.querySelectorAll(".panel"),
    ids = [].map.call(tabs, function (b) {
      return b.dataset.t;
    });
  var alias = { quests: "projects", hire: "contact" };
  function show(id) {
    id = alias[id] || id;
    if (!$(id)) id = "projects";
    panels.forEach(function (p) {
      p.classList.toggle("on", p.id === id);
    });
    tabs.forEach(function (b) {
      var on = b.dataset.t === id;
      b.setAttribute("aria-selected", on);
      if (on) b.scrollIntoView({ block: "nearest", inline: "center" });
    });
  }
  tabs.forEach(function (b) {
    b.onclick = function () {
      history.replaceState(null, "", "#" + b.dataset.t);
      show(b.dataset.t);
    };
  });
  addEventListener("hashchange", function () {
    show(location.hash.slice(1));
  });
  show(location.hash.slice(1));
  if (location.hash)
    setTimeout(function () {
      scrollTo(0, 0);
    }, 0);
  /* copy email */
  var cp = $("cp");
  cp.onclick = function () {
    var m = cp.dataset.mail;
    (navigator.clipboard ? navigator.clipboard.writeText(m) : Promise.reject())
      .catch(function () {})
      .then(function () {
        cp.textContent = "Copied ✓";
        setTimeout(function () {
          cp.textContent = "Copy email";
        }, 1600);
      });
  };
  /* theme */
  var th = $("th");
  function paint() {
    var d = root.dataset.theme === "dark";
    th.textContent = d ? "☀" : "☾";
    th.setAttribute("aria-pressed", d);
  }
  paint();
  th.onclick = function () {
    root.classList.add("tt");
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", root.dataset.theme);
    } catch (e) {}
    paint();
    setTimeout(function () {
      root.classList.remove("tt");
    }, 350);
  };
  /* certificate viewer with prev/next */
  var cm = $("cm"),
    certs = [].slice.call(document.querySelectorAll(".certc")),
    cur = 0;
  function openC(i) {
    cur = (i + certs.length) % certs.length;
    var b = certs[cur];
    $("mt").textContent = b.dataset.title;
    $("md").textContent = b.dataset.desc;
    var im = $("mi");
    im.src = b.dataset.img;
    im.alt = b.dataset.title;
    $("mp").href = b.dataset.pdf;
    cm.classList.add("open");
    cm.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeM() {
    cm.classList.remove("open");
    cm.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  certs.forEach(function (b, i) {
    b.onclick = function () {
      openC(i);
    };
  });
  $("mc").onclick = closeM;
  $("mv").onclick = function () {
    openC(cur - 1);
  };
  $("mn").onclick = function () {
    openC(cur + 1);
  };
  cm.addEventListener("click", function (e) {
    if (e.target === cm) closeM();
  });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (lb.classList.contains("open")) {
      if (e.key === "Escape") closeL();
      if (e.key === "ArrowLeft") openL(li - 1);
      if (e.key === "ArrowRight") openL(li + 1);
      return;
    }
    if (cm.classList.contains("open")) {
      if (e.key === "Escape") closeM();
      if (e.key === "ArrowLeft") openC(cur - 1);
      if (e.key === "ArrowRight") openC(cur + 1);
      return;
    }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= ids.length) {
      history.replaceState(null, "", "#" + ids[n - 1]);
      show(ids[n - 1]);
    }
  });
  /* screenshot lightbox */
  var lb = $("lb"),
    shots = [].slice.call(document.querySelectorAll(".shot")),
    li = 0;
  function openL(i) {
    li = (i + shots.length) % shots.length;
    var b = shots[li],
      im = $("lbi");
    $("lbt").textContent = b.dataset.title;
    im.src = b.dataset.img;
    im.alt = b.dataset.title;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeL() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  shots.forEach(function (b, i) {
    b.onclick = function () {
      openL(i);
    };
  });
  $("lbc").onclick = closeL;
  $("lbp").onclick = function () {
    openL(li - 1);
  };
  $("lbn").onclick = function () {
    openL(li + 1);
  };
  lb.addEventListener("click", function (e) {
    if (e.target === lb) closeL();
  });
})();
