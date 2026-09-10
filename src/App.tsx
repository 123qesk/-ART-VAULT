import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomeView } from './components/HomeView';
import { GalleryView } from './components/GalleryView';
import { DiaryView } from './components/DiaryView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { ArtworkModal } from './components/ArtworkModal';
import { ArtworkDetailModal } from './components/ArtworkDetailModal';
import { vaultDB } from './services/db';
import { Artwork, DiaryEntry, ViewTab, CategoryItem, StatusItem } from './types';
import { Check } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [deletedArtworks, setDeletedArtworks] = useState<Artwork[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(() => vaultDB.getCategories());
  const [statuses, setStatuses] = useState<StatusItem[]>(() => vaultDB.getStatuses());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & detail view states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [selectedArtworkDetail, setSelectedArtworkDetail] = useState<Artwork | null>(null);
  const [preselectedArtworkForDiary, setPreselectedArtworkForDiary] = useState<Artwork | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Load data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const all = await vaultDB.getAllArtworks(true);
      const active = all.filter((a) => !a.isDeleted);
      const deleted = all.filter((a) => !!a.isDeleted);
      const diaryList = await vaultDB.getAllDiaries();

      setArtworks(active);
      setDeletedArtworks(deleted);
      setDiaries(diaryList);
      setCategories(vaultDB.getCategories());
      setStatuses(vaultDB.getStatuses());

      // If viewing detail of an artwork that was updated, update detail state
      if (selectedArtworkDetail) {
        const fresh = active.find((a) => a.id === selectedArtworkDetail.id);
        if (fresh) setSelectedArtworkDetail(fresh);
      }
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedArtworkDetail]);

  useEffect(() => {
    refreshData();
  }, []);

  // Save or edit Artwork
  const handleSaveArtwork = async (
    data: Omit<Artwork, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    let savedItem: Artwork;

    if (existingId) {
      const prev = await vaultDB.getArtworkById(existingId);
      savedItem = {
        ...data,
        id: existingId,
        createdAt: prev?.createdAt || now,
        updatedAt: now,
      };
    } else {
      savedItem = {
        ...data,
        id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };
    }

    await vaultDB.saveArtwork(savedItem);
    await refreshData();
    showToast(existingId ? `已更新作品《${savedItem.title}》` : `已存入画匣《${savedItem.title}》`);
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const art = await vaultDB.getArtworkById(id);
    if (art) {
      art.isFavorite = !art.isFavorite;
      art.updatedAt = new Date().toISOString();
      await vaultDB.saveArtwork(art);
      await refreshData();
      showToast(art.isFavorite ? `已将《${art.title}》加入收藏` : `已取消收藏《${art.title}》`);
    }
  };

  // Toggle Pin (置顶功能)
  const handleTogglePin = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isPinned = await vaultDB.togglePinArtwork(id);
    await refreshData();
    showToast(isPinned ? '已将作品置顶展示' : '已取消置顶');
  };

  // Soft delete artwork
  const handleSoftDeleteArtwork = async (id: string) => {
    const art = artworks.find((a) => a.id === id);
    await vaultDB.softDeleteArtwork(id);
    setSelectedArtworkDetail(null);
    await refreshData();
    showToast(`已将《${art?.title || '作品'}》移至回收站`);
  };

  // Restore artwork
  const handleRestoreArtwork = async (id: string) => {
    await vaultDB.restoreArtwork(id);
    await refreshData();
    showToast('已将作品恢复至作品库');
  };

  // Permanent delete
  const handlePermanentDeleteArtwork = async (id: string) => {
    await vaultDB.permanentDeleteArtwork(id);
    await refreshData();
    showToast('已彻底删除该作品');
  };

  // Empty recycle bin
  const handleEmptyRecycleBin = async () => {
    await vaultDB.emptyRecycleBin();
    await refreshData();
    showToast('回收站已清空');
  };

  // Category & Status updates
  const handleUpdateCategories = (newCategories: CategoryItem[]) => {
    vaultDB.saveCategories(newCategories);
    setCategories(newCategories);
    showToast('分类已更新');
  };

  const handleUpdateStatuses = (newStatuses: StatusItem[]) => {
    vaultDB.saveStatuses(newStatuses);
    setStatuses(newStatuses);
    showToast('状态已更新');
  };

  const handleAddCategory = (name: string) => {
    const newCat: CategoryItem = {
      id: `cat_${Date.now()}`,
      name,
      isDefault: false,
    };
    const updated = [...categories, newCat];
    handleUpdateCategories(updated);
  };

  // Save or edit Diary
  const handleSaveDiary = async (
    data: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    let savedDiary: DiaryEntry;

    if (existingId) {
      const prev = diaries.find((d) => d.id === existingId);
      savedDiary = {
        ...data,
        id: existingId,
        createdAt: prev?.createdAt || now,
        updatedAt: now,
      };
    } else {
      savedDiary = {
        ...data,
        id: `diary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };
    }

    await vaultDB.saveDiary(savedDiary);
    await refreshData();
    showToast(`已保存日记「${savedDiary.title}」`);
  };

  // Delete Diary
  const handleDeleteDiary = async (id: string) => {
    await vaultDB.deleteDiary(id);
    await refreshData();
    showToast('已删除该日记');
  };

  // Export Backup
  const handleExportBackup = async () => {
    const jsonStr = await vaultDB.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `画匣备份_ART_VAULT_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('画匣完整备份文件已成功导出');
  };

  // Import Backup
  const handleImportBackup = async (jsonStr: string) => {
    const result = await vaultDB.importBackup(jsonStr);
    await refreshData();
    showToast(`成功恢复 ${result.artworksCount} 件作品`);
    return result;
  };

  // Reset to demo defaults
  const handleResetDefaults = async () => {
    await vaultDB.resetToDefaults();
    await refreshData();
    showToast('已重置画匣数据');
  };

  // Trigger add diary for a specific artwork
  const handleAddDiaryForArtwork = (art: Artwork) => {
    setSelectedArtworkDetail(null);
    setPreselectedArtworkForDiary(art);
    setCurrentTab('diary');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        
        {/* Navigation Bar */}
        <Navbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddModal={() => {
            setEditingArtwork(null);
            setIsAddModalOpen(true);
          }}
          artworksCount={artworks.length}
        />

        {/* Main Content Router */}
        <div className="flex-1 pb-20 md:pb-0">
          {currentTab === 'home' && (
            <HomeView
              artworks={artworks}
              diaries={diaries}
              onOpenAddModal={() => {
                setEditingArtwork(null);
                setIsAddModalOpen(true);
              }}
              onSelectTab={setCurrentTab}
              onSelectArtwork={(art) => setSelectedArtworkDetail(art)}
            />
          )}

          {(currentTab === 'gallery' || currentTab === 'favorites') && (
            <GalleryView
              artworks={currentTab === 'favorites' ? artworks.filter((a) => a.isFavorite) : artworks}
              deletedArtworks={deletedArtworks}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectArtwork={(art) => setSelectedArtworkDetail(art)}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onEditArtwork={(art) => {
                setEditingArtwork(art);
                setIsAddModalOpen(true);
              }}
              onDeleteArtwork={handleSoftDeleteArtwork}
              onRestoreArtwork={handleRestoreArtwork}
              onPermanentDeleteArtwork={handlePermanentDeleteArtwork}
              onEmptyRecycleBin={handleEmptyRecycleBin}
              onOpenAddModal={() => {
                setEditingArtwork(null);
                setIsAddModalOpen(true);
              }}
              categories={categories}
              statuses={statuses}
              onUpdateCategories={handleUpdateCategories}
              onUpdateStatuses={handleUpdateStatuses}
            />
          )}

          {currentTab === 'diary' && (
            <DiaryView
              diaries={diaries}
              artworks={artworks}
              onSaveDiary={handleSaveDiary}
              onDeleteDiary={handleDeleteDiary}
              onSelectArtwork={(art) => setSelectedArtworkDetail(art)}
              preselectedArtwork={preselectedArtworkForDiary}
              onClearPreselectedArtwork={() => setPreselectedArtworkForDiary(null)}
            />
          )}

          {currentTab === 'stats' && (
            <StatsView artworks={artworks} diaries={diaries} statuses={statuses} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDefaults={handleResetDefaults}
              artworksCount={artworks.length}
              diariesCount={diaries.length}
            />
          )}
        </div>

        {/* Mobile Fixed Bottom Dock Navigation */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenAddModal={() => {
            setEditingArtwork(null);
            setIsAddModalOpen(true);
          }}
          artworksCount={artworks.length}
          diariesCount={diaries.length}
        />

        {/* Add / Edit Artwork Modal */}
        <ArtworkModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingArtwork(null);
          }}
          onSave={handleSaveArtwork}
          editArtwork={editingArtwork}
          categories={categories}
          statuses={statuses}
          onAddCategory={handleAddCategory}
        />

        {/* Lightbox / Artwork Detail Viewer */}
        <ArtworkDetailModal
          artwork={selectedArtworkDetail}
          allArtworks={artworks}
          diaries={diaries}
          onClose={() => setSelectedArtworkDetail(null)}
          onSelectArtwork={(art) => setSelectedArtworkDetail(art)}
          onToggleFavorite={handleToggleFavorite}
          onTogglePin={handleTogglePin}
          onEdit={(art) => {
            setSelectedArtworkDetail(null);
            setEditingArtwork(art);
            setIsAddModalOpen(true);
          }}
          onDelete={handleSoftDeleteArtwork}
          onAddDiaryForArtwork={handleAddDiaryForArtwork}
        />

        {/* Toast Notification Pill */}
        {toastMessage && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium shadow-xl border border-white/10 dark:border-black/10 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </ThemeProvider>
  );
}
