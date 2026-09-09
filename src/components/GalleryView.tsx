import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Folder, 
  Tag, 
  Trash2, 
  Search, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  Sliders, 
  Heart, 
  Calendar, 
  Star, 
  Layers, 
  RotateCcw,
  Sparkles,
  Plus,
  Pin,
  Eye,
  Settings2,
  ChevronDown,
  Filter,
  X
} from 'lucide-react';
import { Artwork, GalleryLayoutMode, CategoryItem, StatusItem } from '../types';
import { ArtworkCard } from './ArtworkCard';
import { CategoryManagerModal } from './CategoryManagerModal';

interface GalleryViewProps {
  artworks: Artwork[];
  deletedArtworks: Artwork[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectArtwork: (artwork: Artwork) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onEditArtwork: (artwork: Artwork) => void;
  onDeleteArtwork: (id: string) => void;
  onRestoreArtwork: (id: string) => void;
  onPermanentDeleteArtwork: (id: string) => void;
  onEmptyRecycleBin: () => void;
  onOpenAddModal: () => void;
  categories: CategoryItem[];
  statuses: StatusItem[];
  onUpdateCategories: (categories: CategoryItem[]) => void;
  onUpdateStatuses: (statuses: StatusItem[]) => void;
}

type DateFilter = 'all' | 'today' | '7days' | '30days' | 'year';
type SortOrder = 'pinned_first' | 'newest' | 'oldest' | 'title' | 'largest';

export const GalleryView: React.FC<GalleryViewProps> = ({
  artworks,
  deletedArtworks,
  searchQuery,
  onSearchChange,
  onSelectArtwork,
  onToggleFavorite,
  onTogglePin,
  onEditArtwork,
  onDeleteArtwork,
  onRestoreArtwork,
  onPermanentDeleteArtwork,
  onEmptyRecycleBin,
  onOpenAddModal,
  categories,
  statuses,
  onUpdateCategories,
  onUpdateStatuses,
}) => {
  // Navigation & Category states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('pinned_first');

  // Layout states (Requirement 3 & 4)
  const [layoutMode, setLayoutMode] = useState<GalleryLayoutMode>('masonry'); // 'masonry' | 'list'
  const [masonryColumns, setMasonryColumns] = useState<1 | 2 | 3 | 4>(3);
  const [showMasonryDropdown, setShowMasonryDropdown] = useState(false);
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);
  const masonryDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (masonryDropdownRef.current && !masonryDropdownRef.current.contains(e.target as Node)) {
        setShowMasonryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category & Status manager modal
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Calculate counts for categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: artworks.length,
      favorites: artworks.filter((a) => a.isFavorite).length,
      recent_edit: artworks.length,
      trash: deletedArtworks.length,
    };

    categories.forEach((cat) => {
      counts[cat.name] = artworks.filter((a) => a.type === cat.name).length;
    });

    return counts;
  }, [artworks, deletedArtworks, categories]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    artworks.forEach((art) => {
      art.tags.forEach((tag) => {
        const clean = tag.replace(/^#/, '');
        tagCountMap[clean] = (tagCountMap[clean] || 0) + 1;
      });
    });
    return Object.entries(tagCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [artworks]);

  // Filter & Sort artworks
  const filteredArtworks = useMemo(() => {
    let list = selectedCategory === 'trash' ? [...deletedArtworks] : [...artworks];

    // Category filter
    if (selectedCategory === 'favorites') {
      list = list.filter((a) => a.isFavorite);
    } else if (selectedCategory === 'trash') {
      // already deletedArtworks
    } else if (selectedCategory !== 'all' && selectedCategory !== 'recent_edit') {
      list = list.filter((a) => a.type === selectedCategory);
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Tag filter
    if (selectedTag) {
      list = list.filter((a) => a.tags.some((t) => t.replace(/^#/, '') === selectedTag));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const thisYearStr = String(now.getFullYear());

      if (dateFilter === 'today') {
        list = list.filter((a) => a.date === todayStr);
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        list = list.filter((a) => new Date(a.date) >= sevenDaysAgo);
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        list = list.filter((a) => new Date(a.date) >= thirtyDaysAgo);
      } else if (dateFilter === 'year') {
        list = list.filter((a) => a.date.startsWith(thisYearStr));
      }
    }

    // Sorting: ALWAYS float pinned works to top unless trash
    list.sort((a, b) => {
      if (selectedCategory !== 'trash') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }

      if (sortOrder === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortOrder === 'title') {
        return a.title.localeCompare(b.title, 'zh-CN');
      } else if (sortOrder === 'largest') {
        return b.width * b.height - a.width * a.height;
      }
      // default newest
      return new Date(b.date || b.updatedAt).getTime() - new Date(a.date || a.updatedAt).getTime();
    });

    return list;
  }, [artworks, deletedArtworks, selectedCategory, statusFilter, searchQuery, selectedTag, dateFilter, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        categories={categories}
        statuses={statuses}
        onUpdateCategories={onUpdateCategories}
        onUpdateStatuses={onUpdateStatuses}
      />

      {/* Mobile Horizontal Category Bar (Visible on mobile screens) */}
      <div className="md:hidden w-full pb-2 mb-4 space-y-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-art-serif flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span>分类速选</span>
          </span>
          <div className="flex items-center gap-1.5">
            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono">
                #{selectedTag}
                <button onClick={() => setSelectedTag('')} className="p-0.5 hover:text-rose-500">✕</button>
              </span>
            )}
            <button
              type="button"
              id="mobile-filter-drawer-btn"
              onClick={() => setIsMobileFilterDrawerOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 active:scale-95"
            >
              <Filter className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>筛选/标签</span>
            </button>
          </div>
        </div>

        {/* Scrollable category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0.5 touch-pan-x">
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedTag(''); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === 'all' && !selectedTag
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs font-bold'
                : 'bg-white dark:bg-[#181B22] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
            }`}
          >
            全部 ({categoryCounts.all})
          </button>

          <button
            onClick={() => { setSelectedCategory('favorites'); setSelectedTag(''); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === 'favorites'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'bg-white dark:bg-[#181B22] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>收藏 ({categoryCounts.favorites})</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.name); setSelectedTag(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat.name
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs font-bold'
                  : 'bg-white dark:bg-[#181B22] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
              }`}
            >
              <span>{cat.name}</span>
              <span className="ml-1 opacity-70 font-mono text-[10px]">({categoryCounts[cat.name] || 0})</span>
            </button>
          ))}

          <button
            onClick={() => { setSelectedCategory('trash'); setSelectedTag(''); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === 'trash'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-white dark:bg-[#181B22] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <Trash2 className="w-3 h-3 text-rose-500" />
            <span>回收站 ({categoryCounts.trash})</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar Category Navigation (Desktop / Tablet only) */}
        <aside 
          id="gallery-sidebar"
          className="hidden md:block w-60 shrink-0 sticky top-24 space-y-6"
        >
          {/* Main Categories Section */}
          <div className="bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] rounded-2xl p-3 shadow-xs">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                作品分类
              </span>
              <button
                type="button"
                onClick={() => setIsManagerOpen(true)}
                title="管理自定义分类与状态 (可拖拽排序/删除)"
                className="text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-0.5 mt-1">
              <button
                id="cat-btn-all"
                onClick={() => { setSelectedCategory('all'); setSelectedTag(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === 'all' && !selectedTag
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span>全部作品</span>
                <span className="text-xs font-mono opacity-80">{categoryCounts.all}</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id}`}
                  onClick={() => { setSelectedCategory(cat.name); setSelectedTag(''); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-xs font-mono opacity-80">{categoryCounts[cat.name] || 0}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="my-2.5 border-t border-neutral-100 dark:border-neutral-800" />

            {/* Special Lists */}
            <div className="space-y-0.5">
              <button
                id="cat-btn-favorites"
                onClick={() => { setSelectedCategory('favorites'); setSelectedTag(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === 'favorites'
                    ? 'bg-amber-500 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>收藏作品</span>
                </span>
                <span className="text-xs font-mono opacity-80">{categoryCounts.favorites}</span>
              </button>

              <button
                id="cat-btn-trash"
                onClick={() => { setSelectedCategory('trash'); setSelectedTag(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === 'trash'
                    ? 'bg-rose-500 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>画师回收站</span>
                </span>
                <span className="text-xs font-mono opacity-80">{categoryCounts.trash}</span>
              </button>
            </div>
          </div>

          {/* Tag Cloud */}
          {allTags.length > 0 && (
            <div className="bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
                热门标签
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(([tag, count]) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isSelected ? '' : tag)}
                      className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${
                        isSelected
                          ? 'bg-amber-600 text-white font-semibold'
                          : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      #{tag} <span className="opacity-60 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Right Main Gallery Wall */}
        <main className="flex-1 w-full min-w-0 space-y-6">
          
          {/* Top Filter & Toolbar with Updated Title and 3 Layout Options */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs flex flex-wrap items-center justify-between gap-4">
            
            {/* Left Status, Date & Sort Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-neutral-400">日期:</span>
                <select
                  id="filter-date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="all">全部日期</option>
                  <option value="today">今天</option>
                  <option value="7days">最近 7 天</option>
                  <option value="30days">最近 30 天</option>
                  <option value="year">今年</option>
                </select>
              </div>

              {/* Status Filter (Dynamic custom statuses) */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-neutral-400">状态:</span>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="all">全部状态</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-neutral-400">排序:</span>
                <select
                  id="filter-sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="pinned_first">置顶优先 / 最新</option>
                  <option value="oldest">最早创作</option>
                  <option value="title">名称排序 (A-Z)</option>
                  <option value="largest">最高分辨率</option>
                </select>
              </div>
            </div>

            {/* Right: Results Count & Layout Switcher (瀑布流 / 列表 / 自定义) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                {filteredArtworks.length} 件作品
              </span>

              {/* Layout Switcher (Clean Icon-Only & Toggle Dropdown on Masonry Click) */}
              <div 
                className="relative flex items-center bg-neutral-100 dark:bg-neutral-800/90 p-1 rounded-xl"
                ref={masonryDropdownRef}
              >
                {/* 1. 瀑布流 Icon Button */}
                <button
                  id="btn-layout-masonry"
                  onClick={() => {
                    setLayoutMode('masonry');
                    setShowMasonryDropdown((prev) => !prev);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    layoutMode === 'masonry'
                      ? 'bg-white dark:bg-neutral-700 shadow-xs text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="瀑布流排版 (点击展开列数选择)"
                  aria-label="瀑布流排版"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                {/* 2. 列表 Icon Button */}
                <button
                  id="btn-layout-list"
                  onClick={() => {
                    setLayoutMode('list');
                    setShowMasonryDropdown(false);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    layoutMode === 'list'
                      ? 'bg-white dark:bg-neutral-700 shadow-xs text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="列表排版"
                  aria-label="列表排版"
                >
                  <List className="w-4 h-4" />
                </button>

                {/* Dropdown Options below the 瀑布流 icon */}
                {showMasonryDropdown && (
                  <div 
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                    }}
                    className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 py-2 px-1.5 rounded-xl border shadow-xl z-40 min-w-[130px] animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div 
                      style={{ color: 'var(--text-muted)' }}
                      className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider border-b border-black/5 dark:border-white/5 mb-1"
                    >
                      瀑布流列数
                    </div>
                    <div className="space-y-0.5">
                      {([1, 2, 3, 4] as const).map((cols) => (
                        <button
                          key={cols}
                          onClick={() => {
                            setMasonryColumns(cols);
                            setLayoutMode('masonry');
                            setShowMasonryDropdown(false); // Hide upon selection!
                          }}
                          style={{
                            color: masonryColumns === cols && layoutMode === 'masonry' ? 'var(--accent-gold)' : 'var(--text-main)',
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            masonryColumns === cols && layoutMode === 'masonry'
                              ? 'bg-amber-500/10 font-bold'
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold">{cols}</span> 列{cols === 1 ? ' (单张大图)' : cols === 2 ? ' (双栏精选)' : cols === 3 ? ' (标准三栏)' : ' (紧凑多栏)'}
                          </span>
                          {masonryColumns === cols && layoutMode === 'masonry' && (
                            <span className="text-amber-600 dark:text-amber-400 text-xs">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Special Recycle Bin Banner */}
          {selectedCategory === 'trash' && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-4">
              <div className="text-xs text-rose-600 dark:text-rose-400 space-y-0.5">
                <p className="font-semibold">回收站中的作品</p>
                <p>作品已被移入回收站，您可以点击「恢复」重新放回作品库，或彻底清空。</p>
              </div>
              {deletedArtworks.length > 0 && (
                <button
                  onClick={onEmptyRecycleBin}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-medium transition-colors shrink-0"
                >
                  清空回收站 ({deletedArtworks.length})
                </button>
              )}
            </div>
          )}

          {/* Active Filter Tags Bar */}
          {(searchQuery || selectedTag || dateFilter !== 'all' || statusFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-neutral-400">当前筛选：</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  关键词: “{searchQuery}”
                  <button onClick={() => onSearchChange('')}>✕</button>
                </span>
              )}
              {selectedTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                  #{selectedTag}
                  <button onClick={() => setSelectedTag('')}>✕</button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  日期筛选
                  <button onClick={() => setDateFilter('all')}>✕</button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  状态: {statusFilter}
                  <button onClick={() => setStatusFilter('all')}>✕</button>
                </span>
              )}
            </div>
          )}

          {/* Gallery Content Area: Conditional Rendering based on Layout */}
          {filteredArtworks.length > 0 ? (
            <div>
              {/* 1. MASONRY LAYOUT */}
              {layoutMode === 'masonry' && (
                <div className={masonryColumns === 2 ? 'masonry-grid-2' : masonryColumns === 4 ? 'masonry-grid-4' : 'masonry-grid-3'}>
                  {filteredArtworks.map((art) => (
                    <ArtworkCard
                      key={art.id}
                      artwork={art}
                      customStatuses={statuses}
                      onClick={() => onSelectArtwork(art)}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(art.id);
                      }}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        onTogglePin(art.id);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 2. LIST LAYOUT */}
              {layoutMode === 'list' && (
                <div className="space-y-3">
                  {filteredArtworks.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArtwork(art)}
                      className={`group relative flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#181B22] border transition-all cursor-pointer hover:shadow-md ${
                        art.isPinned
                          ? 'border-amber-400 dark:border-amber-500/70 ring-1 ring-amber-400/20'
                          : 'border-[#E8E4DC] dark:border-[#262B38]'
                      }`}
                    >
                      {/* Left Thumbnail */}
                      <div className="relative w-full sm:w-44 h-36 shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-[#12141A]">
                        {art.mediaType === 'video' || art.fileType === 'video' ? (
                          <video
                            src={art.imageUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : (
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            style={{
                              transform: art.previewScale ? `scale(${art.previewScale / 100})` : undefined,
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        {art.isPinned && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white shadow-xs">
                            <Pin className="w-2.5 h-2.5 fill-current" /> 置顶
                          </span>
                        )}
                        {art.fileType === 'video' && (
                          <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white uppercase shadow-xs">
                            VIDEO
                          </span>
                        )}
                        {art.fileType === 'gif' && (
                          <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-600 text-white uppercase shadow-xs">
                            GIF
                          </span>
                        )}
                        {art.fileType === 'psd' && (
                          <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase shadow-xs">
                            PSD
                          </span>
                        )}
                        {art.fileType === 'ai' && (
                          <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-600 text-white uppercase shadow-xs">
                            AI
                          </span>
                        )}
                      </div>

                      {/* Right Meta Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-art-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                《{art.title}》
                              </h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono">
                                {art.type}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                                {art.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => onTogglePin(art.id)}
                                className={`p-2 rounded-xl border transition-colors ${
                                  art.isPinned ? 'bg-amber-500 text-white border-amber-500' : 'text-neutral-400 hover:text-amber-500 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                                title={art.isPinned ? '取消置顶' : '置顶本作品'}
                              >
                                <Pin className={`w-4 h-4 ${art.isPinned ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleFavorite(art.id)}
                                className={`p-2 rounded-xl border transition-colors ${
                                  art.isFavorite ? 'bg-rose-500 text-white border-rose-500' : 'text-neutral-400 hover:text-rose-500 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                                title={art.isFavorite ? '已收藏' : '加入收藏'}
                              >
                                <Heart className={`w-4 h-4 ${art.isFavorite ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {art.description && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed font-light">
                              {art.description}
                            </p>
                          )}

                          {art.tags && art.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {art.tags.map((t, idx) => (
                                <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                                  #{t.replace(/^#/, '')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* List Row Footer */}
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {art.date}
                          </span>
                          <span>
                            {art.width} × {art.height} · {(art.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Folder className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-art-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {selectedCategory === 'trash' ? '回收站中没有任何作品' : '未找到符合条件的作品'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  {selectedCategory === 'trash'
                    ? '平时删除的作品会暂存在这里，方便画师随时恢复。'
                    : '您可以清除筛选条件，或直接添加新的绘画或源文件。'}
                </p>
              </div>

              {selectedCategory !== 'trash' && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  {(searchQuery || selectedTag || dateFilter !== 'all' || statusFilter !== 'all' || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setStatusFilter('all');
                        setSelectedTag('');
                        setDateFilter('all');
                        onSearchChange('');
                      }}
                      className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-200 transition-colors"
                    >
                      重置所有筛选
                    </button>
                  )}
                  <button
                    onClick={onOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold shadow-xs hover:scale-102 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加作品</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Mobile Filter & Tags Drawer Bottom Sheet */}
      {isMobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            style={{
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderColor: 'var(--card-border, #E8E4DC)',
            }}
            className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-500" />
                <h3 className="font-art-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
                  筛选与标签
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Manage Categories and Statuses Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileFilterDrawerOpen(false);
                setIsManagerOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              <Settings2 className="w-4 h-4 text-amber-500" />
              <span>管理作品分类与状态 (可拖拽排序/添加)</span>
            </button>

            {/* Tag Cloud in Mobile Drawer */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">热门标签</span>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag('')}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      清除当前标签
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto py-1">
                  {allTags.map(([tag, count]) => {
                    const isSelected = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(isSelected ? '' : tag);
                          setIsMobileFilterDrawerOpen(false);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full font-mono transition-colors active:scale-95 ${
                          isSelected
                            ? 'bg-amber-600 text-white font-semibold'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        #{tag} <span className="opacity-60 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setStatusFilter('all');
                  setSelectedTag('');
                  setDateFilter('all');
                  onSearchChange('');
                  setIsMobileFilterDrawerOpen(false);
                }}
                className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
              >
                重置所有筛选
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
