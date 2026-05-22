(function () {
  const nav = document.querySelector(".nav-links");
  if (!nav || !document.getElementById("about")) return;

  const hashLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const sectionIds = hashLinks
    .map((link) => link.getAttribute("href").slice(1))
    .filter((id) => document.getElementById(id));

  if (!sectionIds.length) return;

  const NAV_OFFSET = 120;
  let activeId = null;
  let hashLockedId = null;
  let scrollTracking = true;
  let lockTimer;

  function applyActive(id) {
    if (activeId === id) return;
    activeId = id;
    nav.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const linkId = href.startsWith("#") ? href.slice(1) : "";
      a.classList.toggle("active", Boolean(id) && linkId === id);
    });
  }

  function lockHash(id, duration = 1000) {
    hashLockedId = id;
    scrollTracking = false;
    applyActive(id);
    clearTimeout(lockTimer);
    lockTimer = setTimeout(() => {
      hashLockedId = null;
      scrollTracking = true;
      updateFromScroll();
    }, duration);
  }

  function updateFromScroll() {
    if (!scrollTracking || hashLockedId) return;

    const scrollY = window.scrollY + NAV_OFFSET;
    let current = null;

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el && scrollY >= el.offsetTop) {
        current = id;
      }
    }

    if (current) {
      applyActive(current);
    } else if (!location.hash) {
      applyActive(null);
    }
  }

  hashLinks.forEach((link) => {
    link.addEventListener("click", () => {
      lockHash(link.getAttribute("href").slice(1), 900);
    });
  });

  nav.querySelectorAll('a:not([href^="#"])').forEach((link) => {
    link.addEventListener("pointerdown", () => {
      scrollTracking = false;
      hashLockedId = null;
      clearTimeout(lockTimer);
      applyActive(null);
    });
  });

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateFromScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (id && document.getElementById(id)) {
      lockHash(id, 1000);
    }
  });

  const initialHash = location.hash.slice(1);
  if (initialHash && document.getElementById(initialHash)) {
    lockHash(initialHash, 1200);
  } else {
    updateFromScroll();
  }
})();
