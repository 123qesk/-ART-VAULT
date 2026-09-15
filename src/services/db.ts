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
          if (item.title) {
            item.title = item.title.replace(/[《》]/g, '');
          }
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
          if (item.title) {
            item.title = item.title.replace(/[《》]/g, '');
          }
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
    if (artwork.title) {
      artwork.title = artwork.title.replace(/[《》]/g, '').trim();
    }
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

  async batchUpdateArtworkCategory(
    ids: string[],
    targetCategory: string
  ): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('artworks', 'readwrite');
    const store = tx.objectStore('artworks');

    for (const id of ids) {
      const art = await this.getArtworkById(id);
      if (!art) continue;

      art.type = targetCategory;
      art.updatedAt = new Date().toISOString();
      store.put(art);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
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
    const wallpaper = await this.getWallpaper();

    // Extract aesthetic presets and theme custom settings
    let presets = [];
    try {
      const rawPresets = localStorage.getItem('art_vault_saved_presets_v1');
      if (rawPresets) {
        presets = JSON.parse(rawPresets);
      }
    } catch (e) {
      console.error('Error reading presets for backup:', e);
    }

    let themePalettes = {};
    try {
      const rawPalettes = localStorage.getItem('art_vault_theme_palettes_v3');
      if (rawPalettes) {
        themePalettes = JSON.parse(rawPalettes);
      }
    } catch (e) {
      console.error('Error reading theme palettes for backup:', e);
    }

    const currentTheme = localStorage.getItem('art_vault_theme_mode_v3') || 'ivory';
    const displayMode = localStorage.getItem('art_vault_display_mode_v1') || 'normal';
    const fontSize = Number(localStorage.getItem('art_vault_font_size_v1')) || 16;
    const activePresetId = localStorage.getItem('art_vault_active_preset_id_v1') || null;

    // Artist Profile Settings
    const artistProfile = {
      avatar: localStorage.getItem('art_vault_artist_avatar') || (await this.getSetting<string>('artist_avatar')) || '',
      name: localStorage.getItem('art_vault_artist_name') || '',
      signature: localStorage.getItem('art_vault_artist_signature') || '',
      role: localStorage.getItem('art_vault_artist_role') || '',
      status: localStorage.getItem('art_vault_artist_status') || '',
      greetingTitle: localStorage.getItem('art_vault_greeting_title') || '',
      greetingSubtitle: localStorage.getItem('art_vault_greeting_subtitle') || '',
      archiveTitle: localStorage.getItem('art_vault_archive_title') || '',
    };
    const customTags = localStorage.getItem('art_vault_all_available_tags') || localStorage.getItem('art_vault_custom_user_tags') || '';

    const payload = {
      version: 3,
      appName: '画匣 · ART VAULT',
      exportedAt: new Date().toISOString(),
      artworks,
      diaries,
      categories,
      statuses,
      presets,
      themePalettes,
      artistProfile,
      customTags,
      themeSettings: {
        theme: currentTheme,
        displayMode,
        fontSize,
        activePresetId,
      },
      wallpaper,
    };
    return JSON.stringify(payload, null, 2);
  }

  async importBackup(jsonString: string): Promise<{ artworksCount: number; diariesCount: number; presetsCount: number }> {
    const data = JSON.parse(jsonString);
    if (!data.artworks || !Array.isArray(data.artworks)) {
      throw new Error('无效的画匣备份文件格式');
    }

    const db = await this.getDB();
    const tx = db.transaction(['artworks', 'diaries'], 'readwrite');
    const artStore = tx.objectStore('artworks');
    const diaryStore = tx.objectStore('diaries');

    for (const art of data.artworks) {
      if (art.title) {
        art.title = art.title.replace(/[《》]/g, '').trim();
      }
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

    // Restore Artist Profile safely
    if (data.artistProfile && typeof data.artistProfile === 'object') {
      const p = data.artistProfile;
      if (typeof p.avatar === 'string' && p.avatar.trim() && p.avatar !== 'undefined' && p.avatar !== 'null') {
        localStorage.setItem('art_vault_artist_avatar', p.avatar);
        await this.saveSetting('artist_avatar', p.avatar);
      }
      if (p.name && typeof p.name === 'string') localStorage.setItem('art_vault_artist_name', p.name);
      if (p.signature && typeof p.signature === 'string') localStorage.setItem('art_vault_artist_signature', p.signature);
      if (p.role && typeof p.role === 'string') localStorage.setItem('art_vault_artist_role', p.role);
      if (p.status && typeof p.status === 'string') localStorage.setItem('art_vault_artist_status', p.status);
      if (p.greetingTitle && typeof p.greetingTitle === 'string') localStorage.setItem('art_vault_greeting_title', p.greetingTitle);
      if (p.greetingSubtitle && typeof p.greetingSubtitle === 'string') localStorage.setItem('art_vault_greeting_subtitle', p.greetingSubtitle);
      if (p.archiveTitle && typeof p.archiveTitle === 'string') localStorage.setItem('art_vault_archive_title', p.archiveTitle);
    }

    // Restore Custom Tags
    if (data.customTags) {
      if (typeof data.customTags === 'string') {
        localStorage.setItem('art_vault_all_available_tags', data.customTags);
      } else if (Array.isArray(data.customTags)) {
        localStorage.setItem('art_vault_all_available_tags', JSON.stringify(data.customTags));
      }
    }

    // Restore Custom Theme Presets (自定义美化预设)
    let presetsCount = 0;
    if (data.presets && Array.isArray(data.presets)) {
      localStorage.setItem('art_vault_saved_presets_v1', JSON.stringify(data.presets));
      presetsCount = data.presets.length;
    }

    // Restore Theme Palettes & Customizations
    if (data.themePalettes && typeof data.themePalettes === 'object') {
      localStorage.setItem('art_vault_theme_palettes_v3', JSON.stringify(data.themePalettes));
    }

    // Restore Theme Settings
    if (data.themeSettings) {
      if (data.themeSettings.theme) {
        localStorage.setItem('art_vault_theme_mode_v3', data.themeSettings.theme);
      }
      if (data.themeSettings.displayMode) {
        localStorage.setItem('art_vault_display_mode_v1', data.themeSettings.displayMode);
      }
      if (data.themeSettings.fontSize) {
        localStorage.setItem('art_vault_font_size_v1', String(data.themeSettings.fontSize));
      }
      if (data.themeSettings.activePresetId !== undefined) {
        if (data.themeSettings.activePresetId) {
          localStorage.setItem('art_vault_active_preset_id_v1', data.themeSettings.activePresetId);
        } else {
          localStorage.removeItem('art_vault_active_preset_id_v1');
        }
      }
    }

    // Restore Custom Wallpaper
    if (data.wallpaper) {
      await this.saveWallpaper(data.wallpaper);
      try {
        if (data.wallpaper.url && data.wallpaper.url.length < 500000) {
          localStorage.setItem('art_vault_wallpaper_state_v1', JSON.stringify(data.wallpaper));
        }
      } catch (e) {
        console.error('Error caching wallpaper to localStorage:', e);
      }
    }

    // Trigger theme & profile update notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('art_vault_artist_updated'));
      window.dispatchEvent(new Event('art_vault_theme_reloaded'));
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve({
          artworksCount: data.artworks.length,
          diariesCount: data.diaries?.length || 0,
          presetsCount,
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
