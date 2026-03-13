/**
 * Render markdown to safe HTML for chat messages.
 */
const FORBIDDEN_TAGS = ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'];
const BLOCKED_SELECTORS = 'script,style,iframe,object,embed,link,meta,form,input,textarea,select,button';

export function renderSafeMarkdown(markdown) {
  const input = typeof markdown === 'string' ? markdown : '';
  const html = window.marked ? marked.parse(input) : escapeHtml(input);
  return sanitizeHtml(html);
}

function sanitizeHtml(html) {
  if (window.DOMPurify?.sanitize) {
    return window.DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: FORBIDDEN_TAGS,
      FORBID_ATTR: ['style'],
      ALLOW_DATA_ATTR: false,
    });
  }

  // Fallback sanitizer for environments where DOMPurify is unavailable.
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll(BLOCKED_SELECTORS).forEach(el => el.remove());

  template.content.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (name.startsWith('on') || name === 'style') {
        el.removeAttribute(attr.name);
        return;
      }

      if ((name === 'href' || name === 'src') && !isSafeUrl(value)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}

function isSafeUrl(url) {
  const value = (url || '').trim().toLowerCase();

  if (!value || value.startsWith('#') || value.startsWith('/')) {
    return true;
  }

  return ['http://', 'https://', 'mailto:', 'tel:']
    .some((prefix) => value.startsWith(prefix));
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}