/** Strip HTML tags / null bytes from user text (CRUD safety). Plain text only — never render as HTML. */
export function sanitizePlainText(input: string, maxLen = 2000): string {
  return String(input ?? '')
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .slice(0, maxLen);
}

export const TITLE_MAX = 200;
export const DESC_MAX = 5000;
export const COMMENT_MAX = 2000;
