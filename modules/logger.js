// Modules/logger.js
// Centralized logging utility with configurable levels

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

let currentLogLevel = LOG_LEVELS.INFO;
let errorHandler = null;

// Set the log level (default: INFO)
export function setLogLevel(level) {
  const levelUpper = String(level || 'INFO').toUpperCase();
  if (LOG_LEVELS[levelUpper] !== undefined) {
    currentLogLevel = LOG_LEVELS[levelUpper];
  }
}

// Set a custom error handler for production
export function setErrorHandler(handler) {
  errorHandler = handler;
}

// Log a message with the appropriate level
function log(level, message, data = null) {
  const levelValue = LOG_LEVELS[level];
  if (levelValue === undefined || levelValue > currentLogLevel) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;

  // Call custom error handler if available
  if (level === 'ERROR' && errorHandler) {
    try {
      errorHandler(message, data);
    } catch (e) {
      // Fallback to console if error handler fails
      error('Error handler failed:', e);
    }
  }

  // Log to console based on level
  switch (level) {
    case 'ERROR':
      error(logEntry, data);
      break;
    case 'WARN':
      warn(logEntry, data);
      break;
    case 'INFO':
      console.info(logEntry, data);
      break;
    case 'DEBUG':
      console.debug(logEntry, data);
      break;
    default:
      info(logEntry, data);
  }
}

// Export convenience methods
export function error(message, data = null) {
  log('ERROR', message, data);
}

export function warn(message, data = null) {
  log('WARN', message, data);
}

export function info(message, data = null) {
  log('INFO', message, data);
}

export function debug(message, data = null) {
  log('DEBUG', message, data);
}

// Utility to sanitize strings for logging
export function sanitizeForLog(input) {
  if (input === null || input === undefined) {
    return String(input);
  }
  if (typeof input === 'object') {
    try {
      return JSON.stringify(input);
    } catch (e) {
      return '[Object]';
    }
  }
  return String(input).substring(0, 1000); // Limit length
}

// In production, you can disable all logging by setting level to -1
// setLogLevel(-1);
