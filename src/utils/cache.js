const store = new Map();

export const sessionCache = {
  has: (key) => store.has(key),
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
  clear: () => store.clear(),
};
