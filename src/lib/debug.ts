let overlayEl: HTMLDivElement | null = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.id = "debug-error-overlay";
  overlayEl.style.position = "fixed";
  overlayEl.style.top = "0";
  overlayEl.style.left = "0";
  overlayEl.style.right = "0";
  overlayEl.style.background = "rgba(0,0,0,0.85)";
  overlayEl.style.color = "#fff";
  overlayEl.style.zIndex = "9999";
  overlayEl.style.padding = "12px";
  overlayEl.style.fontFamily = "monospace";
  overlayEl.style.whiteSpace = "pre-wrap";
  overlayEl.style.lineHeight = "1.4";
  overlayEl.style.maxHeight = "40vh";
  overlayEl.style.overflow = "auto";
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Fechar";
  closeBtn.style.position = "absolute";
  closeBtn.style.right = "12px";
  closeBtn.style.top = "8px";
  closeBtn.style.background = "#333";
  closeBtn.style.border = "1px solid #666";
  closeBtn.style.borderRadius = "6px";
  closeBtn.style.color = "#fff";
  closeBtn.style.padding = "4px 8px";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = () => overlayEl && overlayEl.remove();
  overlayEl.appendChild(closeBtn);
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function stringify(value: unknown) {
  try {
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function showErrorOverlay(title: string, detail: unknown) {
  const el = ensureOverlay();
  const ts = new Date().toLocaleTimeString();
  const block = `\n[${ts}] ${title}\n${stringify(detail)}\n`;
  el.textContent = (el.textContent || "") + block;
}

export function installGlobalDebug() {
  if (typeof window === "undefined") return;
  const isDev = import.meta.env.DEV;

  // Apenas mostrar overlay em desenvolvimento
  if (!isDev) return;

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalError(...args);
    showErrorOverlay("console.error", args.map(stringify).join(" "));
  };

  window.addEventListener("error", (evt) => {
    const err = (evt as ErrorEvent).error || (evt as ErrorEvent).message;
    originalError("[GlobalError]", err, evt);
    showErrorOverlay("GlobalError", err);
  });

  window.addEventListener("unhandledrejection", (evt) => {
    const reason = (evt as PromiseRejectionEvent).reason;
    originalError("[UnhandledRejection]", reason);
    showErrorOverlay("UnhandledRejection", reason);
  });
}