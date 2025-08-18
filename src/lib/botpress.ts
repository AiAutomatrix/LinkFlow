
// src/lib/botpress.ts
type Attrs = Record<string, string>;

const copyAttributes = (from: HTMLScriptElement, to: HTMLScriptElement) => {
  for (const { name, value } of Array.from(from.attributes)) {
    to.setAttribute(name, value);
  }
};

const loadExternalScript = (src: string, attrs: Attrs, target: HTMLElement) =>
  new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;

    // Preserve async/defer/crossorigin/data-* etc.
    Object.entries(attrs).forEach(([k, v]) => {
      if (k !== 'src') s.setAttribute(k, v);
    });

    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));

    target.appendChild(s);
  });

const runInlineScript = (code: string, attrs: Attrs, target: HTMLElement) => {
  const s = document.createElement('script');
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  s.textContent = code;
  target.appendChild(s);
};

export const unescapeHtmlIfNeeded = (html: string) => {
  // If Firestore or forms stored &lt;script&gt; etc., unescape safely.
  if (!html || html.indexOf('&lt;') === -1) return html;
  const ta = document.createElement('textarea');
  ta.innerHTML = html;
  return ta.value;
};

/**
 * Injects Botpress embed HTML safely, guaranteeing script execution order.
 * - Cleans container first (you should close any existing instance before calling).
 * - Loads external scripts sequentially; then inline scripts, also in order.
 */
export const injectEmbedHtmlSequentially = async (
  container: HTMLElement,
  rawHtml: string,
  options?: { cacheBustKey?: string }
) => {
  const html = unescapeHtmlIfNeeded(rawHtml);

  // Clear previous DOM nodes from container
  container.innerHTML = '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Preserve order exactly as provided
  const nodes = Array.from(doc.body.childNodes);

  // Split into scripts and non-scripts but keep order when appending
  const scriptNodes: HTMLScriptElement[] = [];
  const nonScriptNodes: Node[] = [];

  for (const n of nodes) {
    if (n.nodeName.toLowerCase() === 'script') {
      scriptNodes.push(n as HTMLScriptElement);
    } else {
      nonScriptNodes.push(n);
    }
  }

  // Append non-script nodes as-is
  nonScriptNodes.forEach((n) => container.appendChild(n.cloneNode(true)));

  // Load scripts sequentially to avoid races
  for (const oldScript of scriptNodes) {
    const attrs: Attrs = {};
    for (const { name, value } of Array.from(oldScript.attributes)) {
      attrs[name] = value;
    }

    const src = oldScript.getAttribute('src');

    if (src) {
      const u = new URL(src, location.origin);
      // Optional: add cache buster to avoid CDN staleness
      if (options?.cacheBustKey) {
        u.searchParams.set('_v', options.cacheBustKey);
      }
      await loadExternalScript(u.toString(), attrs, container);
    } else {
      const code = oldScript.textContent ?? '';
      runInlineScript(code, attrs, container);
    }
  }
};
