(() => {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const linksWrap = nav.querySelector(".nav-links");
  const toggle = nav.querySelector(".nav-toggle");
  const links = Array.from(nav.querySelectorAll(".nav-link"));
  if (!linksWrap || !toggle || links.length === 0) return;

  document.body.classList.add("nav-js");

  const pathname = window.location.pathname || "/";
  const normalize = (href) => (href || "").replace(/\/+$/, "") || "/";
  const current = normalize(pathname);

  links.forEach((link) => link.classList.remove("active"));

  const byHref = new Map(links.map((link) => [normalize(link.getAttribute("href")), link]));
  const exact = byHref.get(current);

  const isDiagnostics = current === "/submit" || current.startsWith("/deals");
  const isCapital = current.startsWith("/capital");

  let active = exact;
  if (!active && isDiagnostics) active = byHref.get("/deals") || byHref.get("/submit");
  if (!active && isCapital) {
    active = links.find((link) => normalize(link.getAttribute("href")).startsWith("/capital"));
  }
  if (!active && current === "/") active = byHref.get("/");

  if (active) active.classList.add("active");

  const closeMenu = () => {
    linksWrap.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = linksWrap.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  links.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
})();
