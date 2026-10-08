// In-memory temporary cache to hold parsed resume data and raw file buffers.
// Keyed by resumeId (UUID).
const store = new Map();

export const tempStore = {
  /**
   * Retrieves an item from the cache.
   * @param {string} key - UUID resumeId
   * @returns {Object|null}
   */
  get(key) {
    return store.get(key) || null;
  },

  /**
   * Stores or updates an item in the cache.
   * @param {string} key - UUID resumeId
   * @param {Object} value - Values to set or merge
   */
  set(key, value) {
    const existing = store.get(key) || {};
    store.set(key, {
      ...existing,
      ...value,
      updatedAt: new Date()
    });
  },

  /**
   * Checks if an item exists in the cache.
   * @param {string} key - UUID resumeId
   * @returns {boolean}
   */
  has(key) {
    return store.has(key);
  },

  /**
   * Deletes an item from the cache.
   * @param {string} key - UUID resumeId
   * @returns {boolean}
   */
  delete(key) {
    return store.delete(key);
  },

  /**
   * Clears the entire cache store.
   */
  clear() {
    store.clear();
  }
};
