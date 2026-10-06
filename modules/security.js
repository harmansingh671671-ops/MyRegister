// Modules/security.js
// Security utilities for the application

/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeHTML(str) {
  if (str === null || str === undefined) {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/**
 * Sanitize a string for use in HTML attributes
 */
export function sanitizeAttribute(str) {
  if (str === null || str === undefined) {
    return '';
  }
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize a URL to prevent XSS
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  try {
    const parsed = new URL(url);
    // Only allow http, https, and data protocols
    if (!['http:', 'https:', 'data:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch (e) {
    return '';
  }
}

/**
 * Safely create HTML from a template with sanitized data
 * @param {string} template - HTML template with placeholders
 * @param {Object} data - Data to insert into template
 * @returns {string} Sanitized HTML
 */
export function safeTemplate(template, data) {
  return template.replace(/\{\{(.+?)\}\}/g, (match, key) => {
    const value = data[key.trim()];
    return sanitizeHTML(value);
  });
}

/**
 * Check if a string contains potentially dangerous content
 */
export function isPotentiallyDangerous(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }
  const dangerousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i
  ];
  return dangerousPatterns.some(pattern => pattern.test(str));
}

/**
 * Safely set innerHTML with sanitized content
 */
export function safeInnerHTML(element, html) {
  if (!element || !html) {
    return;
  }
  element.innerHTML = sanitizeHTML(html);
}

/**
 * Safely set text content
 */
export function safeText(element, text) {
  if (!element || !text) {
    return;
  }
  element.textContent = String(text);
}

/**
 * Create a safe DOM element from HTML string
 */
export function createSafeElement(html) {
  const template = document.createElement('template');
  template.innerHTML = sanitizeHTML(html);
  return template.content.firstChild;
}
