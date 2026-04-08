window.StoneBridge = {
  async api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message =
        typeof data === "object" && data && data.error
          ? data.error
          : typeof data === "string" && data.trim()
            ? data.trim()
            : "Request failed";
      throw new Error(message);
    }
    return data;
  },
  formatDate(value) {
    if (!value) return "Pending";
    return new Date(value).toLocaleString();
  },
  verdictClass(verdict) {
    const value = String(verdict || "pending").toLowerCase();
    if (value === "proceed") return "proceed";
    if (value === "caution") return "caution";
    if (value === "escalate") return "escalate";
    return "pending";
  },
  severityClass(severity) {
    const value = String(severity || "low").toLowerCase();
    if (value === "critical") return "critical";
    if (value === "high") return "high";
    if (value === "medium") return "medium";
    return "low";
  },
  capitalize(value) {
    if (!value) return "Pending";
    return String(value)
      .toLowerCase()
      .split(/[\s_]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  },
  formatCurrency(value) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) return value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(numeric);
  },
  renderVerdictBadge(verdict) {
    const label = StoneBridge.capitalize(verdict || "pending");
    return `<span class="v-badge ${StoneBridge.verdictClass(verdict)}">${label}</span>`;
  },
  renderScoreTriptych({ before, verdict, after, beforeSource, verdictSource, afterSource }) {
    return `
      <div class="triptych triptych-inline">
        <div class="t-col">
          <div class="t-label">Risk score</div>
          <div class="t-score ${StoneBridge.verdictClass(verdict)}" data-animate-number="${Number(before || 0)}">${before ?? "—"}</div>
          <div class="t-unit">${beforeSource || "/ 100"}</div>
        </div>
        <div class="t-sep">→</div>
        <div class="t-col">
          <div class="t-label">Verdict</div>
          <div class="t-verdict ${StoneBridge.verdictClass(verdict)}">${StoneBridge.capitalize(verdict)}</div>
          <div class="t-unit">${verdictSource || "Decision support"}</div>
        </div>
        <div class="t-sep">→</div>
        <div class="t-col">
          <div class="t-label">Outcome</div>
          <div class="t-score dim" data-animate-number="${Number(after || 0)}">${after ?? "—"}</div>
          <div class="t-unit">${afterSource || "Pending"}</div>
        </div>
      </div>
    `;
  },
  bindScoreAnimations(root = document) {
    root.querySelectorAll("[data-animate-number]").forEach((node) => {
      const target = Number(node.getAttribute("data-animate-number") || 0);
      if (target > 0) StoneBridge.animateNumber(node, target);
    });
  },
  animateNumber(node, target) {
    if (!node) return;
    const end = Number(target || 0);
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = Math.round(end * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  setQueryError(containerId) {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (!error) return;
    const container = document.getElementById(containerId);
    if (!container) return;
    const banner = document.createElement("div");
    banner.className = "error-banner";
    banner.textContent = error;
    container.appendChild(banner);
  },
  parseRoomUrl(path) {
    if (!path) return "";
    return path.startsWith("http") ? path : path;
  },
  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
  safeHref(url) {
    try {
      const u = new URL(String(url).trim());
      return u.protocol === "http:" || u.protocol === "https:" ? u.href : "#";
    } catch {
      return "#";
    }
  },
  severityBadgeClass(severity) {
    const v = String(severity || "").toLowerCase();
    if (v === "critical" || v === "high") return "escalate";
    if (v === "medium") return "caution";
    if (v === "low") return "proceed";
    return "pending";
  },
  renderSignal(signal) {
    const badge = StoneBridge.severityBadgeClass(signal.severity);
    const sevLabel = StoneBridge.escapeHtml(String(signal.severity || "").toUpperCase());
    const cat = StoneBridge.escapeHtml(String(signal.category || "").replace(/_/g, " "));
    const src = StoneBridge.escapeHtml(signal.source || "");
    const lbl = StoneBridge.escapeHtml(signal.label || "");
    const link = signal.url
      ? `<a href="${StoneBridge.safeHref(signal.url)}" target="_blank" rel="noreferrer" class="btn-ghost" style="font-size:11px">Open source</a>`
      : "";
    return `
    <div class="scenario-signal" style="border:1px solid var(--border);padding:14px 16px;margin-bottom:12px;background:var(--white)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div class="signal-source-chip">${src}</div>
        <span class="v-badge ${badge}">${sevLabel}</span>
      </div>
      <div class="signal-label" style="margin-top:10px">${lbl}</div>
      <div class="signal-category" style="margin-top:6px;text-align:left">${cat}</div>
      ${link ? `<div style="margin-top:10px">${link}</div>` : ""}
    </div>
  `;
  }
};
