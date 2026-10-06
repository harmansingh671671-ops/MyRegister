// Modules/eventManager.js
// Centralized event listener management to prevent memory leaks

const eventRegistry = new Map();
const eventIdCounter = 0;

/**
 * Generate a unique ID for an event listener
 */
function generateEventId() {
  return `event_${Date.now()}_${++eventIdCounter}`;
}

/**
 * Add an event listener with automatic cleanup tracking
 * @param {Element|Window|Document} target - The element to add the listener to
 * @param {string} eventType - The event type
 * @param {Function} handler - The event handler function
 * @param {Object} options - Event listener options
 * @returns {string} The event ID for later cleanup
 */
export function addManagedEventListener(target, eventType, handler, options = {}) {
  const eventId = generateEventId();
  
  // Wrap the handler to maintain the same 'this' context
  const wrappedHandler = function(...args) {
    try {
      return handler.apply(this, args);
    } catch (e) {
      console.error(`Error in managed event handler ${eventId}:`, e);
    }
  };

  // Store the original handler and wrapped handler
  eventRegistry.set(eventId, {
    target,
    eventType,
    handler,
    wrappedHandler,
    options
  });

  // Add the event listener
  target.addEventListener(eventType, wrappedHandler, options);

  return eventId;
}

/**
 * Remove a specific managed event listener by ID
 */
export function removeManagedEventListener(eventId) {
  const entry = eventRegistry.get(eventId);
  if (entry) {
    const { target, eventType, wrappedHandler, options } = entry;
    target.removeEventListener(eventType, wrappedHandler, options);
    eventRegistry.delete(eventId);
  }
}

/**
 * Remove all managed event listeners for a specific target
 */
export function removeAllManagedEventListeners(target) {
  const idsToRemove = [];
  
  for (const [eventId, entry] of eventRegistry.entries()) {
    if (entry.target === target) {
      const { eventType, wrappedHandler, options } = entry;
      target.removeEventListener(eventType, wrappedHandler, options);
      idsToRemove.push(eventId);
    }
  }
  
  for (const id of idsToRemove) {
    eventRegistry.delete(id);
  }
}

/**
 * Remove all managed event listeners for a specific event type
 */
export function removeAllManagedEventListenersByType(eventType) {
  const idsToRemove = [];
  
  for (const [eventId, entry] of eventRegistry.entries()) {
    if (entry.eventType === eventType) {
      const { target, wrappedHandler, options } = entry;
      target.removeEventListener(eventType, wrappedHandler, options);
      idsToRemove.push(eventId);
    }
  }
  
  for (const id of idsToRemove) {
    eventRegistry.delete(id);
  }
}

/**
 * Remove all managed event listeners
 */
export function removeAllManagedEventListeners() {
  for (const [eventId, entry] of eventRegistry.entries()) {
    const { target, eventType, wrappedHandler, options } = entry;
    target.removeEventListener(eventType, wrappedHandler, options);
  }
  eventRegistry.clear();
}

/**
 * Get the count of registered event listeners
 */
export function getManagedEventListenerCount() {
  return eventRegistry.size;
}

/**
 * Create a cleanup function that removes multiple event listeners
 */
export function createCleanupFunction(eventIds) {
  return () => {
    for (const eventId of eventIds) {
      removeManagedEventListener(eventId);
    }
  };
}

/**
 * Create a disposable event listener that automatically cleans up
 */
export function createDisposableEventListener(target, eventType, handler, options = {}) {
  const eventId = addManagedEventListener(target, eventType, handler, options);
  
  return {
    eventId,
    dispose: () => removeManagedEventListener(eventId)
  };
}

/**
 * Create a scope for managing multiple event listeners
 */
export function createEventScope() {
  const eventIds = [];
  
  return {
    add: (target, eventType, handler, options = {}) => {
      const eventId = addManagedEventListener(target, eventType, handler, options);
      eventIds.push(eventId);
      return eventId;
    },
    dispose: () => {
      for (const eventId of eventIds) {
        removeManagedEventListener(eventId);
      }
      eventIds.length = 0;
    },
    get count() {
      return eventIds.length;
    }
  };
}

// Auto-cleanup on page unload
document.addEventListener('beforeunload', () => {
  removeAllManagedEventListeners();
});

// Export the registry for debugging (read-only)
export const EventRegistry = {
  get size() {
    return eventRegistry.size;
  },
  list: () => {
    return Array.from(eventRegistry.entries()).map(([id, entry]) => ({
      id,
      target: entry.target,
      eventType: entry.eventType
    }));
  }
};
