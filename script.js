(function () {
  var root = document.documentElement,
    $ = function (id) {
      return document.getElementById(id);
    },
    qa = function (s, el) {
      return [].slice.call((el || document).querySelectorAll(s));
    },
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* old tab links (#quests, #hire, ...) -> new section ids */
  var alias = {
    quests: "work",
    projects: "work",
    overview: "about",
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

  /* headline: wrap each word so it can rise in */
  var wi = 0;
  function split(node) {
    [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          var w = document.createElement("span"),
            inner = document.createElement("span");
          w.className = "w";
          inner.textContent = part;
          inner.style.setProperty("--i", wi++);
          w.appendChild(inner);
          frag.appendChild(w);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) split(n);
    });
  }
  qa(".split").forEach(function (el) {
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    split(el);
    qa(".w", el).forEach(function (w) {
      w.setAttribute("aria-hidden", "true");
    });
  });

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

  /* reveal on scroll, staggered among siblings */
  var hero = $("top");
  qa(".rv").forEach(function (el) {
    var sibs = qa(":scope > .rv", el.parentNode),
      i = sibs.indexOf(el),
      d = hero.contains(el) ? 0.55 + i * 0.1 : Math.min(i, 6) * 0.08;
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
      { rootMargin: "0px 0px -10% 0px" },
    );
    rv.forEach(function (el) {
      io.observe(el);
    });
  } else
    rv.forEach(function (el) {
      el.classList.add("in");
    });

  /* scroll progress + active nav pill */
  var pg = $("pg"),
    links = $("links"),
    ind = $("ind"),
    navLinks = qa("a", links),
    sections = navLinks.map(function (a) {
      return $(a.getAttribute("href").slice(1));
    }),
    current = null,
    ticking = false;

  function moveInd(a) {
    if (!a) {
      ind.style.opacity = 0;
      return;
    }
    ind.style.opacity = 1;
    ind.style.width = a.offsetWidth + "px";
    ind.style.transform = "translateX(" + a.offsetLeft + "px)";
  }
  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    pg.style.setProperty("--p", max > 0 ? Math.min(scrollY / max, 1) : 0);

    var y = scrollY + innerHeight * 0.4,
      cur = null;
    sections.forEach(function (s, i) {
      if (s && s.offsetTop <= y) cur = i;
    });
    if (scrollY >= max - 4) cur = sections.length - 1;
    if (cur !== current) {
      current = cur;
      navLinks.forEach(function (a, i) {
        a.classList.toggle("on", i === cur);
      });
      var a = cur === null ? null : navLinks[cur];
      moveInd(a);
      if (a && links.scrollWidth > links.clientWidth)
        links.scrollTo({
          left: a.offsetLeft - (links.clientWidth - a.offsetWidth) / 2,
          behavior: reduce ? "auto" : "smooth",
        });
    }
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", function () {
    current = -1;
    onScroll();
  });
  update();
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(function () {
      current = -1;
      update();
    });

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
    li = 0;
  function openL(i) {
    li = (i + shots.length) % shots.length;
    var b = shots[li],
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
    openL(li - 1);
  };
  $("lbn").onclick = function () {
    openL(li + 1);
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
      idx = m === lb ? li : ci;
    if (e.key === "Escape") closeModal(m);
    if (e.key === "ArrowLeft") step(idx - 1);
    if (e.key === "ArrowRight") step(idx + 1);
  });
})();
