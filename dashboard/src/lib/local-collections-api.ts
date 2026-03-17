/**
 * Local (localStorage) implementation of the collections API.
 * Drop-in replacement for collections-api.ts — no Clerk or Neon required.
 * Data persists in the browser across page refreshes.
 */
import type { Collection, CollectionItem } from './types';

const STORAGE_KEY = 'btp_collections';

function load(): Collection[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(collections: Collection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

function uuid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const localCollectionsApi = {
  async list(_token: string): Promise<Collection[]> {
    return load();
  },

  async create(_token: string, name: string): Promise<Collection> {
    const cols = load();
    const col: Collection = {
      id: uuid(),
      clerk_user_id: 'local',
      name,
      position: cols.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      collection_items: [],
    };
    save([...cols, col]);
    return col;
  },

  async rename(_token: string, id: string, name: string): Promise<Collection> {
    const cols = load();
    const updated = cols.map((c) =>
      c.id === id ? { ...c, name, updated_at: new Date().toISOString() } : c
    );
    save(updated);
    return updated.find((c) => c.id === id)!;
  },

  async delete(_token: string, id: string): Promise<void> {
    save(load().filter((c) => c.id !== id));
  },

  async addItem(
    _token: string,
    collectionId: string,
    component: { type: string; path: string; name: string; category?: string }
  ): Promise<CollectionItem> {
    const cols = load();
    const item: CollectionItem = {
      id: uuid(),
      collection_id: collectionId,
      component_type: component.type,
      component_path: component.path,
      component_name: component.name,
      component_category: component.category ?? null,
      added_at: new Date().toISOString(),
    };
    const updated = cols.map((c) =>
      c.id === collectionId
        ? { ...c, collection_items: [...c.collection_items, item] }
        : c
    );
    save(updated);
    return item;
  },

  async removeItem(_token: string, itemId: string, collectionId: string): Promise<void> {
    const cols = load();
    const updated = cols.map((c) =>
      c.id === collectionId
        ? { ...c, collection_items: c.collection_items.filter((i) => i.id !== itemId) }
        : c
    );
    save(updated);
  },

  async moveItem(
    _token: string,
    itemId: string,
    fromCollectionId: string,
    toCollectionId: string
  ): Promise<CollectionItem> {
    const cols = load();
    let movedItem: CollectionItem | undefined;
    const updated = cols.map((c) => {
      if (c.id === fromCollectionId) {
        movedItem = c.collection_items.find((i) => i.id === itemId);
        return { ...c, collection_items: c.collection_items.filter((i) => i.id !== itemId) };
      }
      return c;
    });
    if (movedItem) {
      const withMove = updated.map((c) =>
        c.id === toCollectionId
          ? { ...c, collection_items: [...c.collection_items, { ...movedItem!, collection_id: toCollectionId }] }
          : c
      );
      save(withMove);
      return { ...movedItem, collection_id: toCollectionId };
    }
    save(updated);
    return movedItem!;
  },
};
