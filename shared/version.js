/**
 * Aside - version helpers shared by the service worker and the popup.
 * Exposed on self.AsideVersion so it works in both.
 */
(function () {
  // Plain dotted versions only (1.1.6, 1.2.0.3): what manifest.json and the
  // release tags use. Anything else is rejected instead of half-compared.
  const PLAIN = /^\d+(\.\d+){1,3}$/;

  function isPlain(v) { return typeof v === 'string' && PLAIN.test(v); }

  /** <0 if a is older than b, 0 if equal, >0 if newer. Missing parts count as 0. */
  function compare(a, b) {
    const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return d;
    }
    return 0;
  }

  self.AsideVersion = { isPlain, compare };
})();
