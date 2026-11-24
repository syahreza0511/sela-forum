import DOMPurify from 'dompurify';

const timestamp = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const relativeTime = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });

const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function toApiHtml(text) {
  return text.trim()
    .replace(/[&<>"']/g, (character) => entities[character])
    .replace(/\r?\n/g, '<br>');
}

export function sanitizeContent(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'pre', 'code', 'blockquote', 'h2', 'h3', 'h4', 'hr'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}

export function excerpt(html) {
  const text = sanitizeContent(html).replace(/<\/?(?:br|p|div|li|h[2-4])\b[^>]*>/gi, ' ');
  const document = new DOMParser().parseFromString(text, 'text/html');
  return document.body.textContent.replace(/\s+/g, ' ').trim();
}

export function formatDate(value) {
  return timestamp.format(new Date(value));
}

export function formatRelativeDate(value) {
  const minutes = Math.trunc((new Date(value).getTime() - Date.now()) / 60000);

  if (Math.abs(minutes) < 1) {
    return 'baru saja';
  }
  if (Math.abs(minutes) < 60) {
    return relativeTime.format(minutes, 'minute');
  }
  if (Math.abs(minutes) < 1440) {
    return relativeTime.format(Math.trunc(minutes / 60), 'hour');
  }
  if (Math.abs(minutes) < 10080) {
    return relativeTime.format(Math.trunc(minutes / 1440), 'day');
  }

  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

export function topicName(category) {
  return category?.trim() || 'umum';
}
