import { Artwork, DiaryEntry, CategoryItem, StatusItem, WallpaperConfig } from '../types';
import { INITIAL_ARTWORKS, INITIAL_DIARIES, DEFAULT_CATEGORIES, DEFAULT_STATUSES } from './defaultData';

const DB_NAME = 'ArtVaultDB';
const DB_VERSION = 2;

class ArtVaultDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('artworks')) {
          const artworkStore = db.createObjectStore('artworks', { keyPath: 'id' });
          artworkStore.createIndex('date', 'date', { unique: false });
          artworkStore.createIndex('type', 'type', { unique: false });
          artworkStore.createIndex('status', 'status', { unique: false });
          artworkStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          artworkStore.createIndex('isDeleted', 'isDeleted', { unique: false });
        }

        if (!db.objectStoreNames.contains('diaries')) {
          const diaryStore = db.createObjectStore('diaries', { keyPath: 'id' });
          diaryStore.createIndex('date', 'date', { unique: false });
          diaryStore.createIndex('artworkId', 'artworkId', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        
        // Clean out initial demo items if they were from the old pre-set list
        try {
          const clearedFlag = localStorage.getItem('art_vault_demo_cleared_v2');
          if (!clearedFlag) {
            // Check if there are legacy demo artworks like 'art-001'
            const tx = db.transaction(['artworks', 'diaries'], 'readwrite');
            const artStore = tx.objectStore('artworks');
            const diaryStore = tx.objectStore('diaries');
            
            const req = artStore.getAll();
            req.onsuccess = () => {
              const all = req.result as Artwork[];
              // If only legacy demo works exist (or starting fresh), clean them
              const hasLegacyDemo = all.some(a => a.id.startsWith('art-00'));
              if (hasLegacyDemo) {
                all.forEach(item => {
                  if (item.id.startsWith('art-00')) {
                    artStore.delete(item.id);
                  }
                });
              }
              localStorage.setItem('art_vault_demo_cleared_v2', 'true');
            };
          }
        } catch (e) {
          console.error('Error checking legacy demo works:', e);
        }

        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Artworks
  async getAllArtworks(includeDeleted = false): Promise<Artwork[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('artworks', 'readonly');
      const store = tx.objectStore('artworks');
      const req = store.getAll();

      req.onsuccess = () => {
        let items = (req.result as Artwork[]) || [];
        if (!includeDeleted) {
          items = items.filter((item) => !item.isDeleted);
        }
        items.forEach((item) => {
          if (item.imageBlob && item.imageBlob instanceof Blob) {
            if (!item.imageUrl || item.imageUrl.startsWith('blob:')) {
              item.imageUrl = URL.createObjectURL(item.imageBlob);
            }
          }
        });
        // Pinned artworks first, then by date descending
        items.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.date || b.updatedAt).getTime() - new Date(a.date || a.updatedAt).getTime();
        });
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getArtworkById(id: string): Promise<Artwork | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('artworks', 'readonly');
      const store = tx.objectStore('artworks');
      const req = store.get(id);
      req.onsuccess = () => {
        const item = req.result as Artwork | undefined;
        if (item) {
          if (item.imageBlob && item.imageBlob instanceof Blob) {
            if (!item.imageUrl || item.imageUrl.startsWith('blob:')) {
              item.imageUrl = URL.createObjectURL(item.imageBlob);
            }
          }
          resolve(item);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveArtwork(artwork: Artwork): Promise<Artwork> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('artworks', 'readwrite');
      const store = tx.objectStore('artworks');
      const req = store.put(artwork);
      req.onsuccess = () => resolve(artwork);
      req.onerror = () => reject(req.error);
    });
  }

  async togglePinArtwork(id: string): Promise<boolean> {
    const art = await this.getArtworkById(id);
    if (!art) return false;
    art.isPinned = !art.isPinned;
    art.updatedAt = new Date().toISOString();
    await this.saveArtwork(art);
    return !!art.isPinned;
  }

  async softDeleteArtwork(id: string): Promise<void> {
    const art = await this.getArtworkById(id);
    if (art) {
      art.isDeleted = true;
      art.deletedAt = new Date().toISOString();
      await this.saveArtwork(art);
    }
  }

  async restoreArtwork(id: string): Promise<void> {
    const art = await this.getArtworkById(id);
    if (art) {
      art.isDeleted = false;
      art.deletedAt = undefined;
      await this.saveArtwork(art);
    }
  }

  async permanentDeleteArtwork(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('artworks', 'readwrite');
      const store = tx.objectStore('artworks');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async batchSoftDeleteArtworks(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.softDeleteArtwork(id);
    }
  }

  async batchRestoreArtworks(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.restoreArtwork(id);
    }
  }

  async batchPermanentDeleteArtworks(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.permanentDeleteArtwork(id);
    }
  }

  async batchUpdateArtworkTags(
    ids: string[],
    action: 'add' | 'remove' | 'set',
    tagsToApply: string[]
  ): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('artworks', 'readwrite');
    const store = tx.objectStore('artworks');

    for (const id of ids) {
      const art = await this.getArtworkById(id);
      if (!art) continue;

      let currentTags = art.tags ? [...art.tags] : [];

      if (action === 'add') {
        tagsToApply.forEach((t) => {
          const trimmed = t.trim();
          if (trimmed && !currentTags.includes(trimmed)) {
            currentTags.push(trimmed);
          }
        });
      } else if (action === 'remove') {
        const removeSet = new Set(tagsToApply.map((t) => t.trim()));
        currentTags = currentTags.filter((t) => !removeSet.has(t));
      } else if (action === 'set') {
        currentTags = tagsToApply.map((t) => t.trim()).filter(Boolean);
      }

      art.tags = currentTags;
      art.updatedAt = new Date().toISOString();
      store.put(art);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async emptyRecycleBin(): Promise<void> {
    const all = await this.getAllArtworks(true);
    const deleted = all.filter((a) => a.isDeleted);
    const db = await this.getDB();
    const tx = db.transaction('artworks', 'readwrite');
    const store = tx.objectStore('artworks');
    for (const art of deleted) {
      store.delete(art.id);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAllArtworks(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('artworks', 'readwrite');
    tx.objectStore('artworks').clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Diaries
  async getAllDiaries(): Promise<DiaryEntry[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('diaries', 'readonly');
      const store = tx.objectStore('diaries');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as DiaryEntry[]) || [];
        // Sort by date descending
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveDiary(diary: DiaryEntry): Promise<DiaryEntry> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('diaries', 'readwrite');
      const store = tx.objectStore('diaries');
      const req = store.put(diary);
      req.onsuccess = () => resolve(diary);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteDiary(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('diaries', 'readwrite');
      const store = tx.objectStore('diaries');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Custom Categories & Statuses
  getCategories(): CategoryItem[] {
    try {
      const saved = localStorage.getItem('art_vault_categories');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CATEGORIES;
  }

  saveCategories(categories: CategoryItem[]): void {
    localStorage.setItem('art_vault_categories', JSON.stringify(categories));
  }

  getStatuses(): StatusItem[] {
    try {
      const saved = localStorage.getItem('art_vault_statuses');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STATUSES;
  }

  saveStatuses(statuses: StatusItem[]): void {
    localStorage.setItem('art_vault_statuses', JSON.stringify(statuses));
  }

  // Backup & Restore
  async exportBackup(): Promise<string> {
    const artworks = await this.getAllArtworks(true);
    const diaries = await this.getAllDiaries();
    const categories = this.getCategories();
    const statuses = this.getStatuses();
    const payload = {
      version: 2,
      appName: '画匣 · ART VAULT',
      exportedAt: new Date().toISOString(),
      artworks,
      diaries,
      categories,
      statuses,
    };
    return JSON.stringify(payload, null, 2);
  }

  async importBackup(jsonString: string): Promise<{ artworksCount: number; diariesCount: number }> {
    const data = JSON.parse(jsonString);
    if (!data.artworks || !Array.isArray(data.artworks)) {
      throw new Error('无效的画匣备份文件格式');
    }

    const db = await this.getDB();
    const tx = db.transaction(['artworks', 'diaries'], 'readwrite');
    const artStore = tx.objectStore('artworks');
    const diaryStore = tx.objectStore('diaries');

    for (const art of data.artworks) {
      artStore.put(art);
    }
    if (data.diaries && Array.isArray(data.diaries)) {
      for (const diary of data.diaries) {
        diaryStore.put(diary);
      }
    }

    if (data.categories && Array.isArray(data.categories)) {
      this.saveCategories(data.categories);
    }
    if (data.statuses && Array.isArray(data.statuses)) {
      this.saveStatuses(data.statuses);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve({
          artworksCount: data.artworks.length,
          diariesCount: data.diaries?.length || 0,
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async resetToDefaults(): Promise<void> {
    await this.resetToEmpty();
    localStorage.removeItem('art_vault_categories');
    localStorage.removeItem('art_vault_statuses');
  }

  async resetToEmpty(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['artworks', 'diaries'], 'readwrite');
    tx.objectStore('artworks').clear();
    tx.objectStore('diaries').clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Custom Wallpaper (Stored in IndexedDB for large images and video files)
  async getWallpaper(): Promise<WallpaperConfig | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const req = store.get('app_wallpaper');
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            resolve(req.result.value);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async saveWallpaper(wallpaper: WallpaperConfig): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        const req = store.put({ key: 'app_wallpaper', value: wallpaper });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error(e);
    }
  }

  async deleteWallpaper(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        const req = store.delete('app_wallpaper');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Generic key-value settings store for IndexedDB (e.g. artist avatar, preferences)
  async getSetting<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && req.result.value !== undefined) {
            resolve(req.result.value as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async saveSetting(key: string, value: any): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        const req = store.put({ key, value });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error(e);
    }
  }
}

export const vaultDB = new ArtVaultDatabase();
