// Modules/utils.js
// Utility functions for the application

/**
 * Debounce a function to prevent rapid firing
 */
export function debounce(func, wait = 100) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function to limit execution rate
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe function execution with error handling
 */
export function safeExecute(fn, context = null, ...args) {
  try {
    return fn.apply(context, args);
  } catch (e) {
    console.error('Safe execute error:', e);
    return null;
  }
}

/**
 * Async safe function execution
 */
export async function safeExecuteAsync(fn, context = null, ...args) {
  try {
    return await fn.apply(context, args);
  } catch (e) {
    console.error('Async safe execute error:', e);
    return null;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, delay = 100) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

/**
 * Check if an element exists in the DOM
 */
export function elementExists(selector, container = document) {
  return container.querySelector(selector) !== null;
}

/**
 * Wait for an element to exist in the DOM
 */
export async function waitForElement(selector, container = document, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = container.querySelector(selector);
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format a date for display
 */
export function formatDisplayDate(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time as HH:MM
 */
export function formatTime(date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clone an object deeply
 */
export function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj;
  }
}

/**
 * Merge objects deeply
 */
export function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

/**
 * Check if two objects are deeply equal
 */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Escape regex special characters
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get the difference between two dates in days
 */
export function dateDiffInDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today
 */
export function isToday(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past
 */
export function isPastDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  return date < today;
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  return date > today;
}
