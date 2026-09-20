/**
 * Saved memories on this phone, kept for 7 days.
 * IndexedDB can store File/Blob objects. Blob URLs cannot, which is why photos
 * keep a `blob` field in App state.
 *
 * One record per name. Generating again with the same name replaces that person's photos.
 */
const DB_NAME = 'festive-memories';
const STORE_NAME = 'memory';
const RECORD_KEY = 'all';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore(mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = work(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

function stillFresh(record) {
  return record && Date.now() - record.createdAt <= WEEK_MS;
}

function nameKey(name) {
  return name.trim().toLowerCase();
}

function toList(stored) {
  if (!stored) return [];
  if (Array.isArray(stored.list)) return stored.list.filter(stillFresh);
  if (stored.name && stored.photos) return stillFresh(stored) ? [stored] : [];
  return [];
}

export async function saveMemory({ name, photos }) {
  const trimmed = name.trim();
  const next = {
    name: trimmed,
    photos: photos.map((photo) => ({
      id: photo.id,
      blob: photo.blob,
      x: photo.x,
      y: photo.y,
    })),
    createdAt: Date.now(),
  };

  const stored = await withStore('readonly', (store) => store.get(RECORD_KEY));
  const list = toList(stored).filter((item) => nameKey(item.name) !== nameKey(trimmed));
  list.unshift(next);

  return withStore('readwrite', (store) => store.put({ list }, RECORD_KEY));
}

export async function loadMemories() {
  const stored = await withStore('readonly', (store) => store.get(RECORD_KEY));
  let list = toList(stored);

  if (list.length === 0) {
    const legacy = await withStore('readonly', (store) => store.get('current'));
    list = toList(legacy);
  }

  await withStore('readwrite', (store) => store.put({ list }, RECORD_KEY));
  return list;
}

export async function savePhotoPositions(name, positions) {
  const stored = await withStore('readonly', (store) => store.get(RECORD_KEY));
  const list = toList(stored).map((item) => {
    if (nameKey(item.name) !== nameKey(name)) return item;
    return {
      ...item,
      photos: item.photos.map((photo) => ({
        ...photo,
        ...(positions[photo.id] || {}),
      })),
    };
  });
  return withStore('readwrite', (store) => store.put({ list }, RECORD_KEY));
}

export async function deleteMemory(name) {
  const stored = await withStore('readonly', (store) => store.get(RECORD_KEY));
  const list = toList(stored).filter((item) => nameKey(item.name) !== nameKey(name));
  await withStore('readwrite', (store) => store.put({ list }, RECORD_KEY));
  return list;
}
