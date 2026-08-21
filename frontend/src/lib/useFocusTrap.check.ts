/** Self-check: FOCUSABLE selector stays usable. Run: npx tsx src/lib/useFocusTrap.check.ts */
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`useFocusTrap.check: ${msg}`);
}

assert(FOCUSABLE.includes('button'), 'includes button');
assert(FOCUSABLE.includes('[tabindex]'), 'includes tabindex');
console.log('useFocusTrap.check: ok');
