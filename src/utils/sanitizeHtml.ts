import DOMPurify from 'dompurify';

/**
 * Strict HTML Sanitizer wrapping DOMPurify.
 * - Forbids dangerous executable tags: script, iframe, object, embed, form, link, base
 * - Strips all inline event handler attributes (onerror, onload, onclick, etc.)
 * - Strips javascript: URLs
 * - Enforces rel="noopener noreferrer" and target="_blank" on anchor links
 * - Retains safe typography, structure, and styled presentation
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  // Hook to ensure links get rel="noopener noreferrer" and target="_blank"
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  try {
    const sanitized = DOMPurify.sanitize(dirtyHtml, {
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'link', 'base'],
      FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onfocus',
        'onblur',
        'onchange',
        'onsubmit',
        'onkeydown',
        'onkeypress',
        'onkeyup',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/|#)/i,
    });

    return typeof sanitized === 'string' ? sanitized : String(sanitized);
  } finally {
    // Clean up hook so it does not accumulate across calls
    DOMPurify.removeHook('afterSanitizeAttributes');
  }
}
