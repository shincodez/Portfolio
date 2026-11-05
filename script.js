(function () {
  var root = document.documentElement,
    $ = function (id) {
      return document.getElementById(id);
    },
    qa = function (s, el) {
      return [].slice.call((el || document).querySelectorAll(s));
    },
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* old links (#quests, #hire, #about, ...) -> current section ids */
  var alias = {
    quests: "work",
    projects: "work",
    overview: "stack",
    about: "top",
    journey: "experience",
    hire: "contact",
  };
  var h = location.hash.slice(1);
  if (alias[h]) {
    history.replaceState(null, "", "#" + alias[h]);
    addEventListener("load", function () {
      var el = $(alias[h]);
      if (el) el.scrollIntoView();
    });
  }

  /* name: wrap each letter so it can rise in */
  var li = 0;
  qa(".letters").forEach(function (el) {
    var txt = el.textContent.trim();
    el.setAttribute("aria-label", txt);
    el.textContent = "";
    txt.split("").forEach(function (ch) {
      var o = document.createElement("span"),
        i = document.createElement("span");
      o.className = "l";
      o.setAttribute("aria-hidden", "true");
      i.textContent = ch;
      i.style.setProperty("--i", li++);
      o.appendChild(i);
      el.appendChild(o);
    });
  });

  /* live local time in the Philippines */
  var clock = $("clock");
  try {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
    });
    var tick = function () {
      clock.textContent = fmt.format(new Date()) + " local time";
    };
    tick();
    clock.hidden = false;
    setInterval(tick, 30000);
  } catch (e) {}

  /* theme */
  $("th").onclick = function () {
    root.classList.add("tt");
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", root.dataset.theme);
    } catch (e) {}
    setTimeout(function () {
      root.classList.remove("tt");
    }, 500);
  };

  /* reveal on scroll (intro items follow the name, others stagger) */
  var side = qa(".side .rv");
  qa(".rv").forEach(function (el) {
    var d,
      si = side.indexOf(el);
    if (si > -1) d = 0.45 + si * 0.08;
    else {
      var sibs = qa(":scope > .rv", el.parentNode);
      d = Math.min(sibs.indexOf(el), 5) * 0.07;
    }
    el.style.setProperty("--d", d + "s");
  });
  var rv = qa(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    rv.forEach(function (el) {
      io.observe(el);
    });
  } else
    rv.forEach(function (el) {
      el.classList.add("in");
    });

  /* highlight the section in view */
  var links = $("links"),
    navLinks = qa("a", links),
    sections = navLinks.map(function (a) {
      return $(a.getAttribute("href").slice(1));
    }),
    current = null,
    ticking = false;
  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - innerHeight,
      y = scrollY + innerHeight * 0.35,
      cur = 0;
    sections.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top + scrollY <= y) cur = i;
    });
    if (scrollY >= max - 4) cur = sections.length - 1;
    if (cur === current) return;
    current = cur;
    navLinks.forEach(function (a, i) {
      a.classList.toggle("on", i === cur);
      if (i === cur) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    var a = navLinks[cur];
    if (links.scrollWidth > links.clientWidth + 1)
      links.scrollTo({
        left: a.offsetLeft - (links.clientWidth - a.offsetWidth) / 2,
        behavior: reduce ? "auto" : "smooth",
      });
  }
  addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  addEventListener("resize", function () {
    current = null;
    update();
  });
  update();

  /* gentle 3D tilt on the featured screenshot */
  if (!reduce && matchMedia("(hover: hover)").matches) {
    qa(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(),
          x = (e.clientX - r.left) / r.width - 0.5,
          y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* copy email */
  var cp = $("cp"),
    cpl = cp.querySelector("span");
  cp.onclick = function () {
    var m = cp.dataset.mail;
    (navigator.clipboard ? navigator.clipboard.writeText(m) : Promise.reject())
      .then(function () {
        cpl.textContent = "Copied ✓";
      })
      .catch(function () {
        cpl.textContent = m;
      })
      .then(function () {
        setTimeout(function () {
          cpl.textContent = "Copy email";
        }, 1800);
      });
  };

  /* modals: certificate viewer + screenshot lightbox */
  var lastFocus = null;
  function openModal(m) {
    if (!m.classList.contains("open")) lastFocus = document.activeElement;
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    m.querySelector(".x").focus({ preventScroll: true });
  }
  function closeModal(m) {
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  var cm = $("cm"),
    certs = qa(".certc"),
    ci = 0;
  function openC(i) {
    ci = (i + certs.length) % certs.length;
    var b = certs[ci],
      im = $("mi");
    $("mt").textContent = b.dataset.title;
    $("md").textContent = b.dataset.desc;
    im.src = b.dataset.img;
    im.alt = b.dataset.title;
    $("mp").href = b.dataset.pdf;
    openModal(cm);
  }
  certs.forEach(function (b, i) {
    b.onclick = function () {
      openC(i);
    };
  });
  $("mc").onclick = function () {
    closeModal(cm);
  };
  $("mv").onclick = function () {
    openC(ci - 1);
  };
  $("mn").onclick = function () {
    openC(ci + 1);
  };

  var lb = $("lb"),
    shots = qa(".shot"),
    si = 0;
  function openL(i) {
    si = (i + shots.length) % shots.length;
    var b = shots[si],
      im = $("lbi");
    $("lbt").textContent = b.dataset.title;
    im.src = b.dataset.img;
    im.alt = b.dataset.title;
    openModal(lb);
  }
  shots.forEach(function (b, i) {
    b.onclick = function () {
      openL(i);
    };
  });
  $("lbc").onclick = function () {
    closeModal(lb);
  };
  $("lbp").onclick = function () {
    openL(si - 1);
  };
  $("lbn").onclick = function () {
    openL(si + 1);
  };

  [cm, lb].forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m) closeModal(m);
    });
  });
  document.addEventListener("keydown", function (e) {
    var m = lb.classList.contains("open")
      ? lb
      : cm.classList.contains("open")
        ? cm
        : null;
    if (!m) return;
    var step = m === lb ? openL : openC,
      idx = m === lb ? si : ci;
    if (e.key === "Escape") closeModal(m);
    if (e.key === "ArrowLeft") step(idx - 1);
    if (e.key === "ArrowRight") step(idx + 1);
  });
})();
