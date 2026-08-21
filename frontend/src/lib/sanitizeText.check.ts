/** Minimal runnable check for sanitizePlainText — fails loudly if CRUD strip regresses. */
import { sanitizePlainText, TITLE_MAX } from './sanitizeText';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`sanitizeText.check: ${msg}`);
}

assert(sanitizePlainText('<script>alert(1)</script>hi') === 'alert(1)hi', 'strips tags');
assert(sanitizePlainText('a'.repeat(500), TITLE_MAX).length === TITLE_MAX, 'enforces max');
assert(sanitizePlainText('<b></b>').trim() === '', 'HTML-only becomes empty');
assert(sanitizePlainText('ok &lt;x&gt;') === 'ok <x>', 'decodes entities after strip');
assert(!sanitizePlainText('a\0b').includes('\0'), 'strips null bytes');

console.log('sanitizeText.check: ok');
