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
  X,
  Check,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  FolderInput
} from 'lucide-react';
import { Artwork, GalleryLayoutMode, CategoryItem, StatusItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ArtworkCard } from './ArtworkCard';
import { CategoryManagerModal } from './CategoryManagerModal';

const GALLERY_LAYOUT_KEY = 'art_vault_gallery_layout_mode_v1';
const GALLERY_COLUMNS_KEY = 'art_vault_gallery_masonry_columns_v1';

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
  onBatchSoftDelete?: (ids: string[]) => void;
  onBatchRestore?: (ids: string[]) => void;
  onBatchPermanentDelete?: (ids: string[]) => void;
  onBatchUpdateCategory?: (ids: string[], targetCategory: string) => Promise<void>;
  onBatchUpdateTags?: (ids: string[], action: 'add' | 'remove' | 'set', tags: string[]) => Promise<void>;
  onEmptyRecycleBin: () => void;
  onOpenAddModal: () => void;
  categories: CategoryItem[];
  statuses: StatusItem[];
  onAddCategory?: (name: string) => void;
  onUpdateCategories: (categories: CategoryItem[]) => void;
  onUpdateStatuses: (statuses: StatusItem[]) => void;
}

type DateFilter = 'all' | 'today' | '7days' | '30days' | 'year' | 'custom';
type SortOrder = 'pinned_first' | 'newest' | 'oldest' | 'title' | 'largest';

const GalleryListRowComponent: React.FC<{
  art: Artwork;
  onSelect: (art: Artwork) => void;
  onTogglePin?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isTrashMode?: boolean;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}> = ({ 
  art, 
  onSelect, 
  onTogglePin, 
  onToggleFavorite,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  isTrashMode,
  onRestore,
  onPermanentDelete
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { autoPlayMedia } = useTheme();

  return (
    <div
      onClick={() => {
        if (isSelectionMode && onToggleSelect) {
          onToggleSelect();
        } else {
          onSelect(art);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isSelected
          ? 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))'
          : 'var(--card-bg)',
        borderColor: (isSelected || isHovered || art.isPinned) ? 'var(--accent-gold)' : 'var(--card-border)',
        boxShadow: isSelected
          ? '0 0 0 2px var(--accent-gold), 0 8px 24px -4px color-mix(in srgb, var(--accent-gold) 25%, transparent)'
          : isHovered
          ? '0 10px 26px -4px color-mix(in srgb, var(--accent-gold) 22%, transparent), 0 0 0 1.5px var(--accent-gold)'
          : art.isPinned
          ? '0 0 0 1.5px var(--accent-gold)'
          : undefined,
      }}
      className="group relative flex flex-row items-center gap-3 sm:gap-4 p-2.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer"
    >
      {/* Checkbox for Multi-select */}
      {isSelectionMode && (
        <div className="shrink-0 flex items-center justify-center pl-1">
          <div
            style={{
              backgroundColor: isSelected ? 'var(--accent-gold)' : 'var(--bg-page)',
              borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
              color: isSelected ? '#FFFFFF' : 'transparent',
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shadow-sm"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
      )}

      {/* Left Thumbnail */}
      <div className="relative w-20 h-20 sm:w-40 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-[#12141A]">
        {art.mediaType === 'video' || art.fileType === 'video' ? (
          <video
            key={`list-vid-${autoPlayMedia}`}
            src={art.imageUrl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            muted
            loop={autoPlayMedia}
            playsInline
            autoPlay={autoPlayMedia}
            preload="metadata"
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
        {art.isPinned && !isTrashMode && (
          <span 
            style={{ backgroundColor: 'var(--accent-gold)' }}
            className="absolute top-1 left-1 sm:top-2 sm:left-2 inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded text-white shadow-xs"
          >
            <Pin className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current" /> <span className="hidden xs:inline">置顶</span>
          </span>
        )}
        {isTrashMode && (
          <span className="absolute top-1 left-1 sm:top-2 sm:left-2 inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs">
            已删除
          </span>
        )}
        {art.fileType === 'video' && (
          <span className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded bg-purple-600 text-white uppercase shadow-xs">
            VIDEO
          </span>
        )}
        {art.fileType === 'gif' && (
          <span className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded bg-pink-600 text-white uppercase shadow-xs">
            GIF
          </span>
        )}
        {art.fileType === 'psd' && (
          <span className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase shadow-xs">
            PSD
          </span>
        )}
        {art.fileType === 'ai' && (
          <span className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded bg-orange-600 text-white shadow-xs">
            AI
          </span>
        )}
      </div>

      {/* Right Meta Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5 w-full">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <h3 
                style={{ color: isHovered ? 'var(--accent-gold)' : undefined }}
                className="font-art-serif text-sm sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 transition-colors truncate"
              >
                {art.title}
              </h3>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono">
                {art.type}
              </span>
              <span 
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                  color: 'var(--accent-gold)',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                }}
                className="hidden xs:inline-block text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium border"
              >
                {art.status}
              </span>
            </div>

            {!isSelectionMode && (
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {isTrashMode ? (
                  <>
                    {onRestore && (
                      <button
                        type="button"
                        onClick={() => onRestore(art.id)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                        title="恢复作品"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>恢复</span>
                      </button>
                    )}
                    {onPermanentDelete && (
                      <button
                        type="button"
                        onClick={() => onPermanentDelete(art.id)}
                        className="p-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-medium transition-colors"
                        title="彻底删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {onTogglePin && (
                      <button
                        type="button"
                        onClick={() => onTogglePin(art.id)}
                        style={{
                          backgroundColor: art.isPinned ? 'var(--accent-gold)' : undefined,
                          borderColor: art.isPinned ? 'var(--accent-gold)' : isHovered ? 'var(--accent-gold)' : undefined,
                          color: art.isPinned ? '#FFFFFF' : isHovered ? 'var(--accent-gold)' : undefined,
                        }}
                        className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
                          art.isPinned ? 'shadow-xs' : 'text-neutral-400 hover:text-white border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title={art.isPinned ? '取消置顶' : '置顶本作品'}
                      >
                        <Pin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${art.isPinned ? 'fill-current' : ''}`} />
                      </button>
                    )}
                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(art.id)}
                        className={`p-1.5 sm:p-2 rounded-xl border transition-colors ${
                          art.isFavorite ? 'bg-rose-500 text-white border-rose-500 shadow-xs' : 'text-neutral-400 hover:text-rose-500 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title={art.isFavorite ? '已收藏' : '加入收藏'}
                      >
                        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${art.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {art.description ? (
            <p 
              title={art.description}
              className="text-xs text-neutral-500 dark:text-neutral-400 font-light mt-1.5 overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                textOverflow: 'ellipsis',
                lineHeight: '1.25rem',
                maxHeight: '2.5rem',
              }}
            >
              {art.description}
            </p>
          ) : (
            <p className="text-xs text-neutral-400/40 dark:text-neutral-500/40 font-light mt-1.5 italic select-none">
              暂无创作故事 / 技法笔记 / 备注
            </p>
          )}

          {art.tags && art.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {art.tags.map((t, idx) => (
                <span 
                  key={idx} 
                  style={{
                    borderColor: isHovered ? 'color-mix(in srgb, var(--accent-gold) 35%, transparent)' : undefined,
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono border border-transparent"
                >
                  #{t.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* List Row Footer */}
        <div 
          style={{ borderColor: 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-border, #2a2e39))' }}
          className="flex items-center justify-between pt-3 mt-2 border-t text-[11px] text-neutral-400 font-mono"
        >
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" style={{ color: isHovered ? 'var(--accent-gold)' : undefined }} />
            {art.date}
          </span>
          <span>
            {art.width} × {art.height} · {(art.sizeBytes / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
      </div>
    </div>
  );
};

const GalleryListRow = React.memo(GalleryListRowComponent);

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
  onBatchSoftDelete,
  onBatchRestore,
  onBatchPermanentDelete,
  onBatchUpdateCategory,
  onBatchUpdateTags,
  onEmptyRecycleBin,
  onOpenAddModal,
  categories,
  statuses,
  onAddCategory,
  onUpdateCategories,
  onUpdateStatuses,
}) => {
  // Navigation & Category states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('pinned_first');

  // Timeline Date & Month Picker states (Requirement 3)
  const [isTimelineDatePickerOpen, setIsTimelineDatePickerOpen] = useState(false);
  const [timelineDateMode, setTimelineDateMode] = useState<'all' | 'month' | 'year' | 'range'>('all');
  const [timelineFilterYear, setTimelineFilterYear] = useState<string>(() => String(new Date().getFullYear()));
  const [timelineFilterMonth, setTimelineFilterMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [timelineRangeStart, setTimelineRangeStart] = useState<string>('');
  const [timelineRangeEnd, setTimelineRangeEnd] = useState<string>('');

  // Timeline sub-layout (Requirement 3: 瀑布流/网格 vs 列表)
  const [timelineSubLayout, setTimelineSubLayoutState] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('art_vault_timeline_sub_layout_v1');
      if (saved === 'list' || saved === 'grid') return saved;
    }
    return 'grid';
  });

  const setTimelineSubLayout = (mode: 'grid' | 'list') => {
    setTimelineSubLayoutState(mode);
    try {
      localStorage.setItem('art_vault_timeline_sub_layout_v1', mode);
    } catch (e) {
      console.error(e);
    }
  };

  // Multi-select states
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<string[]>([]);

  // Layout states (Requirement 3 & 4)
  const [layoutMode, setLayoutModeState] = useState<GalleryLayoutMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(GALLERY_LAYOUT_KEY);
        if (saved === 'list' || saved === 'masonry' || saved === 'timeline') {
          return saved;
        }
      } catch (e) {
        // fallback
      }
    }
    return 'masonry';
  });

  const setLayoutMode = (mode: GalleryLayoutMode) => {
    setLayoutModeState(mode);
    try {
      localStorage.setItem(GALLERY_LAYOUT_KEY, mode);
    } catch (e) {
      console.error(e);
    }
  };

  const [masonryColumns, setMasonryColumnsState] = useState<1 | 2 | 3 | 4>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(GALLERY_COLUMNS_KEY);
        if (saved) {
          const num = Number(saved);
          if (num >= 1 && num <= 4) return num as 1 | 2 | 3 | 4;
        }
      } catch (e) {
        // fallback
      }
    }
    return 3;
  });

  const setMasonryColumns = (cols: 1 | 2 | 3 | 4) => {
    setMasonryColumnsState(cols);
    try {
      localStorage.setItem(GALLERY_COLUMNS_KEY, String(cols));
    } catch (e) {
      console.error(e);
    }
  };
  const [showMasonryDropdown, setShowMasonryDropdown] = useState(false);
  const masonryDropdownRef = useRef<HTMLDivElement | null>(null);

  // Clear selection on category change
  useEffect(() => {
    setSelectedArtworkIds([]);
    setIsMultiSelectMode(false);
  }, [selectedCategory]);

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

  // Fast single-pass category counts calculation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: artworks.length,
      favorites: 0,
      recent_edit: artworks.length,
      trash: deletedArtworks.length,
    };

    categories.forEach((cat) => {
      counts[cat.name] = 0;
    });

    for (let i = 0; i < artworks.length; i++) {
      const a = artworks[i];
      if (a.isFavorite) counts.favorites++;
      if (counts[a.type] !== undefined) {
        counts[a.type]++;
      }
    }

    return counts;
  }, [artworks, deletedArtworks, categories]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    const source = selectedCategory === 'trash' ? deletedArtworks : artworks;
    source.forEach((art) => {
      art.tags?.forEach((tag) => {
        const clean = tag.replace(/^#/, '').trim();
        if (clean) {
          tagCountMap[clean] = (tagCountMap[clean] || 0) + 1;
        }
      });
    });
    return Object.entries(tagCountMap).sort((a, b) => b[1] - a[1]);
  }, [artworks, deletedArtworks, selectedCategory]);

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
      const todayStr = now.toISOString().slice(0, 10);
      const thisYearStr = String(now.getFullYear());
      const sevenDaysAgoStr = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      const thirtyDaysAgoStr = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

      if (dateFilter === 'today') {
        list = list.filter((a) => a.date === todayStr);
      } else if (dateFilter === '7days') {
        list = list.filter((a) => a.date >= sevenDaysAgoStr);
      } else if (dateFilter === '30days') {
        list = list.filter((a) => a.date >= thirtyDaysAgoStr);
      } else if (dateFilter === 'year') {
        list = list.filter((a) => a.date.startsWith(thisYearStr));
      } else if (dateFilter === 'custom' && customDate) {
        list = list.filter((a) => a.date === customDate);
      }
    }

    // Timeline layout specific date range / month filter (Requirement 3)
    if (layoutMode === 'timeline' && timelineDateMode !== 'all') {
      if (timelineDateMode === 'year' && timelineFilterYear) {
        list = list.filter((a) => (a.date || a.createdAt || '').startsWith(timelineFilterYear));
      } else if (timelineDateMode === 'month' && timelineFilterMonth) {
        list = list.filter((a) => (a.date || a.createdAt || '').startsWith(timelineFilterMonth));
      } else if (timelineDateMode === 'range') {
        if (timelineRangeStart) {
          list = list.filter((a) => (a.date || a.createdAt || '').slice(0, 10) >= timelineRangeStart);
        }
        if (timelineRangeEnd) {
          list = list.filter((a) => (a.date || a.createdAt || '').slice(0, 10) <= timelineRangeEnd);
        }
      }
    }

    // Sorting: ALWAYS float pinned works to top unless trash
    list.sort((a, b) => {
      if (selectedCategory !== 'trash') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }

      if (sortOrder === 'oldest') {
        return (a.date || '').localeCompare(b.date || '');
      } else if (sortOrder === 'title') {
        return a.title.localeCompare(b.title, 'zh-CN');
      } else if (sortOrder === 'largest') {
        return b.width * b.height - a.width * a.height;
      }
      // default newest
      return (b.date || b.updatedAt || '').localeCompare(a.date || a.updatedAt || '');
    });

    return list;
  }, [
    artworks, 
    deletedArtworks, 
    selectedCategory, 
    statusFilter, 
    searchQuery, 
    selectedTag, 
    dateFilter, 
    customDate, 
    sortOrder,
    layoutMode,
    timelineDateMode,
    timelineFilterYear,
    timelineFilterMonth,
    timelineRangeStart,
    timelineRangeEnd
  ]);

  // Available Years for Timeline Filter
  const availableTimelineYears = useMemo(() => {
    const yearSet = new Set<string>();
    yearSet.add(String(new Date().getFullYear()));
    artworks.forEach((a) => {
      const d = a.date || a.createdAt;
      if (d && d.length >= 4) {
        const y = d.slice(0, 4);
        if (!isNaN(Number(y))) yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [artworks]);

  // Batch Category Change State (Requirement 1 & 4)
  const [isBatchCategoryModalOpen, setIsBatchCategoryModalOpen] = useState(false);
  const [targetCategoryForBatch, setTargetCategoryForBatch] = useState<string>('');
  const [isAddingCategoryInBatch, setIsAddingCategoryInBatch] = useState(false);
  const [newCategoryNameInBatch, setNewCategoryNameInBatch] = useState('');
  const [isSubmittingBatchCategory, setIsSubmittingBatchCategory] = useState(false);

  // Batch Tag Editing State
  const [isBatchTagModalOpen, setIsBatchTagModalOpen] = useState(false);
  const [batchTagAction, setBatchTagAction] = useState<'add' | 'remove' | 'set'>('add');
  const [batchTagsInput, setBatchTagsInput] = useState('');
  const [selectedTagsForBatch, setSelectedTagsForBatch] = useState<string[]>([]);
  const [isSubmittingBatchTags, setIsSubmittingBatchTags] = useState(false);

  // Built-in default tags constant
  const DEFAULT_BUILTIN_TAGS = useMemo(() => ['原创', '人物', '夜景', '场景', '厚涂', '二次元', '光影练习', '写生', '赛博朋克', '自然'], []);

  // All unique tags in the artwork library for quick selection
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    artworks.forEach((art) => {
      if (art.tags) {
        art.tags.forEach((t) => {
          const clean = t.replace(/^#/, '').trim();
          if (clean) tagSet.add(clean);
        });
      }
    });
    return Array.from(tagSet).filter(Boolean);
  }, [artworks]);

  // Combined built-in and user custom shortcut tags for batch editing
  const allAvailableQuickTags = useMemo(() => {
    try {
      const saved = localStorage.getItem('art_vault_all_available_tags');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return Array.from(new Set([...DEFAULT_BUILTIN_TAGS, ...parsed, ...existingTags])).filter(Boolean);
      }
      const oldCustom = localStorage.getItem('art_vault_custom_user_tags');
      const customList: string[] = oldCustom ? JSON.parse(oldCustom) : [];
      return Array.from(new Set([...DEFAULT_BUILTIN_TAGS, ...customList, ...existingTags])).filter(Boolean);
    } catch {
      return Array.from(new Set([...DEFAULT_BUILTIN_TAGS, ...existingTags])).filter(Boolean);
    }
  }, [existingTags, DEFAULT_BUILTIN_TAGS]);

  const customQuickTagsOnly = useMemo(() => {
    return allAvailableQuickTags.filter((t) => !DEFAULT_BUILTIN_TAGS.includes(t));
  }, [allAvailableQuickTags, DEFAULT_BUILTIN_TAGS]);

  // Common tags among selected artworks
  const selectedArtworksCommonTags = useMemo(() => {
    if (selectedArtworkIds.length === 0) return [];
    const selectedArts = artworks.filter((a) => selectedArtworkIds.includes(a.id));
    const tagCounts = new Map<string, number>();
    selectedArts.forEach((a) => {
      if (a.tags) {
        const uniqueTags = Array.from(new Set(a.tags.map((t) => t.replace(/^#/, '').trim()))).filter(Boolean);
        uniqueTags.forEach((t: string) => {
          tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
        });
      }
    });
    return Array.from(tagCounts.entries()).map(([tag, count]) => ({
      tag,
      count,
      isAll: count === selectedArts.length,
    }));
  }, [selectedArtworkIds, artworks]);

  // Category distribution of selected artworks
  const selectedArtworksCategoryCounts = useMemo(() => {
    if (selectedArtworkIds.length === 0) return [];
    const selectedArts = artworks.filter((a) => selectedArtworkIds.includes(a.id));
    const catMap = new Map<string, number>();
    selectedArts.forEach((a) => {
      const c = a.type || '未分类';
      catMap.set(c, (catMap.get(c) || 0) + 1);
    });
    return Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
  }, [selectedArtworkIds, artworks]);

  // Timeline Grouping Logic by Year & Month (Fast slice-based parser)
  const timelineGroups = useMemo(() => {
    if (layoutMode !== 'timeline') return [];

    const map = new Map<string, Artwork[]>();

    filteredArtworks.forEach((art) => {
      let key = '未知日期';
      if (art.date && art.date.length >= 7) {
        const y = art.date.slice(0, 4);
        const m = art.date.slice(5, 7);
        if (!isNaN(Number(y)) && !isNaN(Number(m))) {
          key = `${y}年${m}月`;
        }
      } else if (art.createdAt && art.createdAt.length >= 7) {
        const y = art.createdAt.slice(0, 4);
        const m = art.createdAt.slice(5, 7);
        if (!isNaN(Number(y)) && !isNaN(Number(m))) {
          key = `${y}年${m}月`;
        }
      }

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(art);
    });

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === '未知日期') return 1;
      if (b === '未知日期') return -1;
      return b.localeCompare(a);
    });

    return sortedKeys.map((key) => ({
      title: key,
      items: map.get(key)!,
    }));
  }, [filteredArtworks, layoutMode]);

  const handleApplyBatchCategory = async () => {
    if (selectedArtworkIds.length === 0 || !targetCategoryForBatch) {
      alert('请选择目标分类');
      return;
    }

    try {
      setIsSubmittingBatchCategory(true);
      if (onBatchUpdateCategory) {
        await onBatchUpdateCategory(selectedArtworkIds, targetCategoryForBatch);
      }
      setIsBatchCategoryModalOpen(false);
      setIsMultiSelectMode(false);
      setSelectedArtworkIds([]);
    } catch (err) {
      console.error(err);
      alert('批量更改分类失败，请重试');
    } finally {
      setIsSubmittingBatchCategory(false);
    }
  };

  const handleCreateNewCategoryInBatch = () => {
    const trimmed = newCategoryNameInBatch.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name === trimmed)) {
      setTargetCategoryForBatch(trimmed);
      setIsAddingCategoryInBatch(false);
      setNewCategoryNameInBatch('');
      return;
    }
    const newCat: CategoryItem = {
      id: `cat_${Date.now()}`,
      name: trimmed,
      isDefault: false,
    };
    const updated = [...categories, newCat];
    onUpdateCategories(updated);
    setTargetCategoryForBatch(trimmed);
    setIsAddingCategoryInBatch(false);
    setNewCategoryNameInBatch('');
  };

  const handleApplyBatchTags = async () => {
    if (selectedArtworkIds.length === 0) return;

    const inputTagsList = batchTagsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const combinedTags = Array.from(new Set([...inputTagsList, ...selectedTagsForBatch]));

    if (combinedTags.length === 0 && batchTagAction !== 'set') {
      alert('请选择或输入要处理的标签');
      return;
    }

    try {
      setIsSubmittingBatchTags(true);
      if (onBatchUpdateTags) {
        await onBatchUpdateTags(selectedArtworkIds, batchTagAction, combinedTags);
      }
      setIsBatchTagModalOpen(false);
      setBatchTagsInput('');
      setSelectedTagsForBatch([]);
      setIsMultiSelectMode(false);
      setSelectedArtworkIds([]);
    } catch (err) {
      console.error(err);
      alert('批量修改标签失败，请稍后重试');
    } finally {
      setIsSubmittingBatchTags(false);
    }
  };

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

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar Category Navigation (Desktop / Tablet only) */}
        <aside 
          id="gallery-sidebar"
          className="hidden md:block w-60 shrink-0 sticky top-24 space-y-6"
        >
          {/* Main Categories Section */}
          <div 
            style={{ backgroundColor: 'var(--content-bg)', borderColor: 'var(--card-border)' }}
            className="border rounded-2xl p-3 shadow-xs"
          >
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                作品分类
              </span>
              <button
                type="button"
                onClick={() => setIsManagerOpen(true)}
                title="管理自定义分类与状态 (可拖拽排序/删除)"
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
              </button>
            </div>
            
            <div className="space-y-0.5 mt-1">
              <button
                id="cat-btn-all"
                onClick={() => { setSelectedCategory('all'); setSelectedTag(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === 'all' && !selectedTag
                    ? 'font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'all' && !selectedTag ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : undefined,
                  color: selectedCategory === 'all' && !selectedTag ? 'var(--accent-gold)' : undefined,
                }}
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
                      ? 'font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat.name ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : undefined,
                    color: selectedCategory === cat.name ? 'var(--accent-gold)' : undefined,
                  }}
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
                style={{
                  backgroundColor: selectedCategory === 'favorites' ? 'var(--accent-gold)' : undefined,
                  color: selectedCategory === 'favorites' ? '#FFFFFF' : undefined,
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === 'favorites'
                    ? 'font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${selectedCategory === 'favorites' ? 'fill-white text-white' : ''}`} style={selectedCategory !== 'favorites' ? { color: 'var(--accent-gold)', fill: 'var(--accent-gold)' } : undefined} />
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
                  <span>回收站</span>
                </span>
                <span className="text-xs font-mono opacity-80">{categoryCounts.trash}</span>
              </button>
            </div>
          </div>

          {/* Tag Cloud */}
          {allTags.length > 0 && (
            <div 
              style={{ backgroundColor: 'var(--content-bg)', borderColor: 'var(--card-border)' }}
              className="border rounded-2xl p-4 shadow-xs"
            >
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
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-gold)' : undefined,
                        color: isSelected ? '#FFFFFF' : undefined,
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${
                        isSelected
                          ? 'font-semibold shadow-xs'
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
        <main className="flex-1 w-full min-w-0 space-y-5">
          
          {/* Horizontal Category Quick-Select Bar (分类速选 - 电脑端与移动端通用) */}
          <div 
            id="gallery-category-quickbar"
            style={{ 
              backgroundColor: 'var(--content-bg)', 
              borderColor: 'var(--card-border)' 
            }}
            className="p-3 sm:p-3.5 rounded-2xl border shadow-xs space-y-2.5 transition-all"
          >
            {/* Header: Title, Active Tag Pill & Category/Status Manager Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                  <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--accent-gold)' }} />
                  <span>分类速选</span>
                </span>
                {selectedTag && (
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    #{selectedTag}
                    <button onClick={() => setSelectedTag('')} className="p-0.5 hover:text-rose-500 cursor-pointer">✕</button>
                  </span>
                )}
              </div>

              {/* Management button: 只留下“管理作品分类与状态” */}
              <button
                type="button"
                id="gallery-category-manager-btn"
                onClick={() => setIsManagerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 border cursor-pointer hover:border-amber-500/50"
                style={{
                  backgroundColor: 'var(--search-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
                title="管理自定义分类与状态"
              >
                <Settings2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                <span>管理作品分类与状态</span>
              </button>
            </div>

            {/* Scrollable category pills (回收站已按要求移出) */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 touch-pan-x">
              <button
                type="button"
                onClick={() => { setSelectedCategory('all'); setSelectedTag(''); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all' && !selectedTag
                    ? 'shadow-xs font-bold'
                    : 'border hover:border-amber-400'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'all' && !selectedTag ? 'var(--accent-gold)' : 'var(--card-bg)',
                  borderColor: selectedCategory === 'all' && !selectedTag ? 'var(--accent-gold)' : 'var(--card-border)',
                  color: selectedCategory === 'all' && !selectedTag ? '#FFFFFF' : 'var(--text-main)',
                }}
              >
                全部 ({categoryCounts.all})
              </button>

              <button
                type="button"
                onClick={() => { setSelectedCategory('favorites'); setSelectedTag(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'favorites'
                    ? 'shadow-xs font-bold'
                    : 'border hover:border-amber-400'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'favorites' ? 'var(--accent-gold)' : 'var(--card-bg)',
                  borderColor: selectedCategory === 'favorites' ? 'var(--accent-gold)' : 'var(--card-border)',
                  color: selectedCategory === 'favorites' ? '#FFFFFF' : 'var(--text-main)',
                }}
              >
                <Star className={`w-3.5 h-3.5 ${selectedCategory === 'favorites' ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                <span>收藏 ({categoryCounts.favorites})</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setSelectedCategory(cat.name); setSelectedTag(''); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.name
                      ? 'shadow-xs font-bold'
                      : 'border hover:border-amber-400'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat.name ? 'var(--accent-gold)' : 'var(--card-bg)',
                    borderColor: selectedCategory === cat.name ? 'var(--accent-gold)' : 'var(--card-border)',
                    color: selectedCategory === cat.name ? '#FFFFFF' : 'var(--text-main)',
                  }}
                >
                  <span>{cat.name}</span>
                  <span className={`ml-1 font-mono text-[10px] ${selectedCategory === cat.name ? 'opacity-85' : 'opacity-60'}`}>
                    ({categoryCounts[cat.name] || 0})
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Top Filter & Toolbar with Updated Title and 3 Layout Options */}
          <div 
            style={{ backgroundColor: 'var(--content-bg)', borderColor: 'var(--card-border)' }}
            className="p-4 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4"
          >
            
            {/* Left Status, Date & Sort Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-neutral-400">日期:</span>
                <select
                  id="filter-date"
                  value={dateFilter}
                  onChange={(e) => {
                    const val = e.target.value as DateFilter;
                    setDateFilter(val);
                    if (val === 'custom' && !customDate) {
                      setCustomDate(new Date().toISOString().split('T')[0]);
                    }
                  }}
                  style={{ backgroundColor: "var(--search-bg)" }} 
                  className="px-2.5 py-1.5 rounded-lg text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-medium"
                >
                  <option value="all">全部日期</option>
                  <option value="today">今天</option>
                  <option value="7days">最近 7 天</option>
                  <option value="30days">最近 30 天</option>
                  <option value="year">今年</option>
                  <option value="custom">指定日期</option>
                </select>

                {/* Custom Date Input Picker */}
                {dateFilter === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilter('custom');
                    }}
                    style={{ backgroundColor: "var(--search-bg)", color: "var(--text-main)" }}
                    className="px-2 py-1 rounded-lg border border-amber-500 focus:outline-none text-xs font-mono font-bold shadow-2xs"
                  />
                )}
              </div>

              {/* Status Filter (Dynamic custom statuses) */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-neutral-400">状态:</span>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ backgroundColor: "var(--search-bg)" }} className="px-2.5 py-1.5 rounded-lg text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
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
                  style={{ backgroundColor: "var(--search-bg)" }} className="px-2.5 py-1.5 rounded-lg text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="pinned_first">置顶优先 / 最新</option>
                  <option value="oldest">最早创作</option>
                  <option value="title">名称排序 (A-Z)</option>
                  <option value="largest">最高分辨率</option>
                </select>
              </div>
            </div>

            {/* Right: Results Count & Layout Switcher & Multi-select */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                {filteredArtworks.length} 件作品
              </span>

              {/* Multi-select Toggle Button */}
              <button
                id="btn-toggle-multiselect"
                onClick={() => {
                  setIsMultiSelectMode((prev) => !prev);
                  setSelectedArtworkIds([]);
                }}
                style={{
                  backgroundColor: isMultiSelectMode ? 'var(--accent-gold)' : 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: isMultiSelectMode ? '#FFFFFF' : 'var(--text-main)',
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-xs cursor-pointer active:scale-95"
                title="多选批量处理"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isMultiSelectMode ? '取消多选' : '多选'}</span>
              </button>

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
                  style={
                    layoutMode === 'masonry'
                      ? {
                          backgroundColor: 'var(--card-bg)',
                          color: 'var(--accent-gold)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }
                      : undefined
                  }
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    layoutMode === 'masonry'
                      ? 'font-bold'
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
                  style={
                    layoutMode === 'list'
                      ? {
                          backgroundColor: 'var(--card-bg)',
                          color: 'var(--accent-gold)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }
                      : undefined
                  }
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    layoutMode === 'list'
                      ? 'font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="列表排版"
                  aria-label="列表排版"
                >
                  <List className="w-4 h-4" />
                </button>

                {/* 3. 时间轴 Icon Button */}
                <button
                  id="btn-layout-timeline"
                  onClick={() => {
                    setLayoutMode('timeline');
                    setShowMasonryDropdown(false);
                  }}
                  style={
                    layoutMode === 'timeline'
                      ? {
                          backgroundColor: 'var(--card-bg)',
                          color: 'var(--accent-gold)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }
                      : undefined
                  }
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    layoutMode === 'timeline'
                      ? 'font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="按年月时间轴纵向排列"
                  aria-label="时间轴排版"
                >
                  <Calendar className="w-4 h-4" />
                </button>

                {/* Dropdown Options below the 瀑布流 icon */}
                {showMasonryDropdown && (
                  <div 
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                    }}
                    className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 py-2 px-1.5 rounded-xl border shadow-xl z-40 min-w-[110px] animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div 
                      style={{ color: 'var(--text-muted)' }}
                      className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider border-b border-black/5 dark:border-white/5 mb-1"
                    >
                      列数切换
                    </div>
                    <div className="space-y-0.5">
                      {([1, 2, 3, 4] as const).map((cols) => {
                        const isSelected = masonryColumns === cols && layoutMode === 'masonry';
                        return (
                          <button
                            key={cols}
                            onClick={() => {
                              setMasonryColumns(cols);
                              setLayoutMode('masonry');
                              setShowMasonryDropdown(false);
                            }}
                            style={{
                              backgroundColor: isSelected ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : undefined,
                              color: isSelected ? 'var(--accent-gold)' : 'var(--text-main)',
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              cols === 4 ? 'hidden sm:flex' : 'flex'
                            } ${
                              isSelected
                                ? 'font-bold'
                                : 'hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            <span className="font-mono font-semibold">{cols}列</span>
                            {isSelected && (
                              <span className="text-xs ml-2 font-bold" style={{ color: 'var(--accent-gold)' }}>✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile-Only Trash Quick Entrance: 在作品布局的右侧, PC端去掉 (md:hidden) */}
              <button
                id="btn-mobile-toolbar-trash"
                type="button"
                onClick={() => {
                  setSelectedCategory(selectedCategory === 'trash' ? 'all' : 'trash');
                  setSelectedTag('');
                }}
                style={{
                  backgroundColor: selectedCategory === 'trash'
                    ? '#e11d48'
                    : (categoryCounts.trash > 0 ? 'color-mix(in srgb, #f43f5e 10%, var(--card-bg))' : 'var(--card-bg)'),
                  borderColor: selectedCategory === 'trash'
                    ? '#e11d48'
                    : (categoryCounts.trash > 0 ? 'color-mix(in srgb, #f43f5e 35%, var(--card-border))' : 'var(--card-border)'),
                  color: selectedCategory === 'trash'
                    ? '#FFFFFF'
                    : (categoryCounts.trash > 0 ? '#e11d48' : 'var(--text-main)'),
                }}
                className={`md:hidden px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs active:scale-95 ${
                  selectedCategory === 'trash'
                    ? 'shadow-rose-500/25 font-bold'
                    : 'hover:border-rose-400 dark:hover:border-rose-700'
                }`}
                title={selectedCategory === 'trash' ? '退出回收站并返回全部' : `回收站 (${categoryCounts.trash} 件作品)`}
              >
                <Trash2 
                  className="w-3.5 h-3.5 shrink-0" 
                  style={{ color: selectedCategory === 'trash' ? '#FFFFFF' : '#f43f5e' }} 
                />
                <span className="whitespace-nowrap">
                  {selectedCategory === 'trash' ? '已在回收站' : '回收站'}
                </span>
                <span 
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategory === 'trash' 
                      ? 'bg-white/25 text-white' 
                      : (categoryCounts.trash > 0 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'opacity-60')
                  }`}
                >
                  {categoryCounts.trash}
                </span>
              </button>
            </div>
          </div>

          {/* Sticky Multi-Select Toolbar Floating Overlay */}
          {isMultiSelectMode && (
            <div 
              style={{
                backgroundColor: 'var(--modal-bg)',
                borderColor: 'var(--accent-gold)',
              }}
              className="sticky top-2 z-30 p-3 sm:p-4 rounded-2xl border-2 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedArtworkIds.length === filteredArtworks.length && filteredArtworks.length > 0) {
                      setSelectedArtworkIds([]);
                    } else {
                      setSelectedArtworkIds(filteredArtworks.map((a) => a.id));
                    }
                  }}
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, var(--card-bg))',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors"
                >
                  {selectedArtworkIds.length === filteredArtworks.length && filteredArtworks.length > 0 ? (
                    <>
                      <CheckSquare className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                      <span style={{ color: 'var(--text-main)' }}>取消全选</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-main)' }}>全选 ({filteredArtworks.length})</span>
                    </>
                  )}
                </button>

                <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                  已选择 <span className="font-mono text-sm" style={{ color: 'var(--accent-gold)' }}>{selectedArtworkIds.length}</span> 项
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedCategory === 'trash' ? (
                  <>
                    <button
                      disabled={selectedArtworkIds.length === 0}
                      onClick={() => {
                        if (selectedArtworkIds.length === 0) return;
                        onBatchRestore?.(selectedArtworkIds);
                        setSelectedArtworkIds([]);
                        setIsMultiSelectMode(false);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-sm transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>批量恢复 ({selectedArtworkIds.length})</span>
                    </button>
                    <button
                      disabled={selectedArtworkIds.length === 0}
                      onClick={() => {
                        if (selectedArtworkIds.length === 0) return;
                        if (confirm(`确定彻底删除选中的 ${selectedArtworkIds.length} 件作品吗？`)) {
                          onBatchPermanentDelete?.(selectedArtworkIds);
                          setSelectedArtworkIds([]);
                          setIsMultiSelectMode(false);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white shadow-sm transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>彻底删除 ({selectedArtworkIds.length})</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* 1. 批量更改分类 (排在批量编辑标签前面) */}
                    <button
                      disabled={selectedArtworkIds.length === 0}
                      onClick={() => {
                        if (selectedArtworkIds.length === 0) return;
                        const firstSelected = artworks.find((a) => selectedArtworkIds.includes(a.id));
                        setTargetCategoryForBatch(firstSelected?.type || categories[0]?.name || '插画');
                        setIsBatchCategoryModalOpen(true);
                      }}
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))',
                        borderColor: 'var(--accent-gold)',
                        color: 'var(--accent-gold)',
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border disabled:opacity-40 shadow-xs transition-all hover:opacity-90 cursor-pointer"
                      title="批量将选中作品移动至新分类"
                    >
                      <FolderInput className="w-4 h-4" />
                      <span>批量更改分类 ({selectedArtworkIds.length})</span>
                    </button>

                    {/* 2. 批量编辑标签 */}
                    <button
                      disabled={selectedArtworkIds.length === 0}
                      onClick={() => setIsBatchTagModalOpen(true)}
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))',
                        borderColor: 'var(--accent-gold)',
                        color: 'var(--accent-gold)',
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border disabled:opacity-40 shadow-xs transition-all hover:opacity-90 cursor-pointer"
                      title="批量添加或移除选中作品的标签"
                    >
                      <Tag className="w-4 h-4" />
                      <span>批量编辑标签 ({selectedArtworkIds.length})</span>
                    </button>

                    {/* 3. 批量删除 */}
                    <button
                      disabled={selectedArtworkIds.length === 0}
                      onClick={() => {
                        if (selectedArtworkIds.length === 0) return;
                        onBatchSoftDelete?.(selectedArtworkIds);
                        setSelectedArtworkIds([]);
                        setIsMultiSelectMode(false);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white shadow-sm transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>批量删除 ({selectedArtworkIds.length})</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setIsMultiSelectMode(false);
                    setSelectedArtworkIds([]);
                  }}
                  style={{ color: 'var(--text-muted)' }}
                  className="px-3 py-1.5 rounded-xl text-xs hover:opacity-80 transition-opacity"
                >
                  退出
                </button>
              </div>
            </div>
          )}

          {/* Special Recycle Bin Banner */}
          {selectedCategory === 'trash' && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-rose-600 dark:text-rose-400 space-y-0.5">
                <p className="font-semibold">回收站中的作品</p>
                <p>作品已被移入回收站，您可以单独或点击「多选」勾选多个作品进行「批量恢复」，或彻底清空。</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setIsMultiSelectMode((prev) => !prev);
                    setSelectedArtworkIds([]);
                  }}
                  style={{
                    backgroundColor: isMultiSelectMode ? 'var(--accent-gold)' : 'color-mix(in srgb, #e11d48 12%, transparent)',
                    color: isMultiSelectMode ? '#FFFFFF' : '#e11d48',
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{isMultiSelectMode ? '取消多选' : '多选'}</span>
                </button>
                {deletedArtworks.length > 0 && (
                  <button
                    onClick={onEmptyRecycleBin}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-medium transition-colors"
                  >
                    清空回收站 ({deletedArtworks.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Filter Tags Bar */}
          {(searchQuery || selectedTag || dateFilter !== 'all' || statusFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span style={{ color: 'var(--text-muted)' }}>当前筛选：</span>
              {searchQuery && (
                <span 
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))',
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 40%, transparent)',
                    color: 'var(--accent-gold)',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium shadow-2xs"
                >
                  <span>关键词: “{searchQuery}”</span>
                  <button 
                    onClick={() => onSearchChange('')}
                    className="hover:opacity-75 font-bold ml-0.5"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedTag && (
                <span 
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))',
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 40%, transparent)',
                    color: 'var(--accent-gold)',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono font-medium shadow-2xs"
                >
                  <span>#{selectedTag}</span>
                  <button 
                    onClick={() => setSelectedTag('')}
                    className="hover:opacity-75 font-bold ml-0.5"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    ✕
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span 
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xs"
                >
                  <span>日期筛选</span>
                  <button 
                    onClick={() => setDateFilter('all')}
                    className="hover:opacity-75 ml-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span 
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xs"
                >
                  <span>状态: {statusFilter}</span>
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className="hover:opacity-75 ml-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Gallery Content Area: Conditional Rendering based on Layout */}
          {filteredArtworks.length > 0 ? (
            <div>
              {/* 1. MASONRY / UNIFORM MODULE GRID LAYOUT */}
              {layoutMode === 'masonry' && (
                <div className={
                  masonryColumns === 1
                    ? 'grid grid-cols-1 gap-3 sm:gap-6 items-stretch'
                    : masonryColumns === 2
                    ? 'grid grid-cols-2 gap-3 sm:gap-6 items-stretch'
                    : masonryColumns === 3
                    ? 'grid grid-cols-3 gap-2 sm:gap-6 items-stretch'
                    : 'grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-5 items-stretch'
                }>
                  {filteredArtworks.map((art) => (
                    <ArtworkCard
                      key={art.id}
                      artwork={art}
                      customStatuses={statuses}
                      onClick={() => {
                        if (isMultiSelectMode) {
                          setSelectedArtworkIds((prev) =>
                            prev.includes(art.id) ? prev.filter((id) => id !== art.id) : [...prev, art.id]
                          );
                        } else {
                          onSelectArtwork(art);
                        }
                      }}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(art.id);
                      }}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        onTogglePin(art.id);
                      }}
                      isSelectionMode={isMultiSelectMode}
                      isSelected={selectedArtworkIds.includes(art.id)}
                      onToggleSelect={() => {
                        setSelectedArtworkIds((prev) =>
                          prev.includes(art.id) ? prev.filter((id) => id !== art.id) : [...prev, art.id]
                        );
                      }}
                      isTrashMode={selectedCategory === 'trash'}
                      onRestore={() => onRestoreArtwork(art.id)}
                      onPermanentDelete={() => onPermanentDeleteArtwork(art.id)}
                    />
                  ))}
                </div>
              )}

              {/* 2. LIST LAYOUT WITH THEME AWARE HOVER & PIN */}
              {layoutMode === 'list' && (
                <div className="space-y-3">
                  {filteredArtworks.map((art) => (
                    <GalleryListRow
                      key={art.id}
                      art={art}
                      onSelect={onSelectArtwork}
                      onTogglePin={onTogglePin}
                      onToggleFavorite={onToggleFavorite}
                      isSelectionMode={isMultiSelectMode}
                      isSelected={selectedArtworkIds.includes(art.id)}
                      onToggleSelect={() => {
                        setSelectedArtworkIds((prev) =>
                          prev.includes(art.id) ? prev.filter((id) => id !== art.id) : [...prev, art.id]
                        );
                      }}
                      isTrashMode={selectedCategory === 'trash'}
                      onRestore={(id) => onRestoreArtwork(id)}
                      onPermanentDelete={(id) => onPermanentDeleteArtwork(id)}
                    />
                  ))}
                </div>
              )}

              {/* 3. TIMELINE LAYOUT (按年份与月份纵向排列，支持瀑布流与列表两种呈现形式) */}
              {layoutMode === 'timeline' && (
                <div className="space-y-6">
                  {/* Timeline Sub-Layout Toggle Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="relative flex flex-wrap items-center gap-2">
                      {/* Interactive Calendar Trigger for Custom Date / Month range (Requirement 3) */}
                      <button
                        type="button"
                        onClick={() => setIsTimelineDatePickerOpen(!isTimelineDatePickerOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs hover:opacity-90 active:scale-95"
                        style={{
                          backgroundColor: timelineDateMode !== 'all' 
                            ? 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))' 
                            : 'var(--search-bg)',
                          borderColor: timelineDateMode !== 'all' 
                            ? 'var(--accent-gold)' 
                            : 'var(--card-border)',
                          color: timelineDateMode !== 'all' 
                            ? 'var(--accent-gold)' 
                            : 'var(--text-main)',
                        }}
                        title="点击选择自定义时间/月份区间"
                      >
                        <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-gold)' }} />
                        <span>创作脉络时间轴</span>
                        {timelineDateMode !== 'all' && (
                          <span 
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                              borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                              color: 'var(--accent-gold)',
                            }}
                          >
                            {timelineDateMode === 'year' && `${timelineFilterYear}年`}
                            {timelineDateMode === 'month' && `${timelineFilterMonth}`}
                            {timelineDateMode === 'range' && `${timelineRangeStart || '开始'} ~ ${timelineRangeEnd || '结束'}`}
                          </span>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTimelineDatePickerOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))', color: 'var(--accent-gold)' }}>
                        {filteredArtworks.length} 件作品
                      </span>

                      {timelineDateMode !== 'all' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTimelineDateMode('all');
                            setTimelineRangeStart('');
                            setTimelineRangeEnd('');
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg border flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer"
                          style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
                          title="清除时间筛选"
                        >
                          <X className="w-3 h-3" />
                          <span>重置全部</span>
                        </button>
                      )}

                      {/* Timeline Date Picker Dropdown Popover */}
                      {isTimelineDatePickerOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsTimelineDatePickerOpen(false)} 
                          />
                          <div 
                            className="absolute left-0 top-full mt-2 z-50 w-76 sm:w-92 p-4 rounded-2xl border shadow-xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--card-border)',
                            }}
                          >
                            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
                              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                                <Calendar className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                <span>时间轴范围与月份选择</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsTimelineDatePickerOpen(false)}
                                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Mode Selector Tabs */}
                            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-xs">
                              {[
                                { mode: 'all', label: '全部' },
                                { mode: 'month', label: '按月份' },
                                { mode: 'year', label: '按年份' },
                                { mode: 'range', label: '自定义' },
                              ].map((item) => (
                                <button
                                  key={item.mode}
                                  type="button"
                                  onClick={() => setTimelineDateMode(item.mode as any)}
                                  style={
                                    timelineDateMode === item.mode
                                      ? {
                                          backgroundColor: 'var(--card-bg)',
                                          color: 'var(--accent-gold)',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        }
                                      : undefined
                                  }
                                  className={`py-1.5 px-1 text-center rounded-lg font-medium transition-all cursor-pointer ${
                                    timelineDateMode === item.mode
                                      ? 'font-bold'
                                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>

                            {/* Mode-specific Controls */}
                            {timelineDateMode === 'month' && (
                              <div className="space-y-2.5 pt-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-medium">
                                    选择年份与月份：
                                  </label>
                                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-gold)' }}>
                                    {timelineFilterMonth}
                                  </span>
                                </div>

                                {/* Year selector pills for month view */}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                  {availableTimelineYears.map((yr) => (
                                    <button
                                      key={yr}
                                      type="button"
                                      onClick={() => {
                                        setTimelineFilterYear(yr);
                                        const m = timelineFilterMonth.slice(5, 7) || '01';
                                        setTimelineFilterMonth(`${yr}-${m}`);
                                      }}
                                      style={{
                                        borderColor: timelineFilterMonth.startsWith(yr) ? 'var(--accent-gold)' : undefined,
                                        backgroundColor: timelineFilterMonth.startsWith(yr) ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : undefined,
                                        color: timelineFilterMonth.startsWith(yr) ? 'var(--accent-gold)' : undefined,
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-mono border shrink-0 transition-all cursor-pointer ${
                                        timelineFilterMonth.startsWith(yr)
                                          ? 'font-bold shadow-2xs'
                                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                                      }`}
                                    >
                                      {yr}年
                                    </button>
                                  ))}
                                </div>

                                {/* 12 Months Grid */}
                                <div className="grid grid-cols-4 gap-1.5">
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const mNum = i + 1;
                                    const currentYr = timelineFilterMonth.slice(0, 4) || timelineFilterYear;
                                    const monthStr = `${currentYr}-${String(mNum).padStart(2, '0')}`;
                                    const isSelected = timelineFilterMonth === monthStr;
                                    const count = artworks.filter((a) => (a.date || a.createdAt || '').startsWith(monthStr)).length;

                                    return (
                                      <button
                                        key={mNum}
                                        type="button"
                                        onClick={() => setTimelineFilterMonth(monthStr)}
                                        style={{
                                          backgroundColor: isSelected 
                                            ? 'var(--accent-gold)' 
                                            : (count > 0 ? 'color-mix(in srgb, var(--accent-gold) 8%, transparent)' : undefined),
                                          borderColor: isSelected 
                                            ? 'var(--accent-gold)' 
                                            : 'var(--card-border)',
                                        }}
                                        className={`py-1.5 px-1 rounded-xl text-xs border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                          isSelected ? 'font-bold shadow-xs' : 'hover:border-amber-400'
                                        }`}
                                      >
                                        <span 
                                          className="font-mono font-bold text-xs"
                                          style={{
                                            color: isSelected ? '#FFFFFF' : 'var(--accent-gold)',
                                          }}
                                        >
                                          {mNum}月
                                        </span>
                                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                                          {count > 0 ? `${count}件` : '-'}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Manual month input */}
                                <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
                                  <input
                                    type="month"
                                    value={timelineFilterMonth}
                                    onChange={(e) => setTimelineFilterMonth(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    style={{
                                      backgroundColor: 'var(--search-bg)',
                                      borderColor: 'var(--card-border)',
                                      color: 'var(--text-main)',
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {timelineDateMode === 'year' && (
                              <div className="space-y-3 pt-1">
                                <div className="space-y-1.5">
                                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-medium">
                                    选择要展示的年份：
                                  </label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {availableTimelineYears.map((yr) => {
                                      const isSelected = timelineFilterYear === yr;
                                      return (
                                        <button
                                          key={yr}
                                          type="button"
                                          onClick={() => setTimelineFilterYear(yr)}
                                          style={{
                                            borderColor: isSelected ? 'var(--accent-gold)' : undefined,
                                            backgroundColor: isSelected ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : undefined,
                                            color: isSelected ? 'var(--accent-gold)' : undefined,
                                          }}
                                          className={`py-2 px-3 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                                            isSelected
                                              ? 'font-bold shadow-2xs'
                                              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 text-neutral-700 dark:text-neutral-300'
                                          }`}
                                        >
                                          {yr} 年
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Display Months overview with theme-colored month numbers */}
                                <div className="space-y-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-medium">
                                      {timelineFilterYear} 年各月份作品概览：
                                    </label>
                                    <span className="text-[10px]" style={{ color: 'var(--accent-gold)' }}>
                                      点击可切换单月
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {Array.from({ length: 12 }, (_, i) => {
                                      const monthNum = i + 1;
                                      const monthStr = `${timelineFilterYear}-${String(monthNum).padStart(2, '0')}`;
                                      const count = artworks.filter((a) => (a.date || a.createdAt || '').startsWith(monthStr)).length;
                                      const isCurrentMonthFilter = timelineDateMode === 'month' && timelineFilterMonth === monthStr;

                                      return (
                                        <button
                                          key={monthNum}
                                          type="button"
                                          onClick={() => {
                                            setTimelineFilterMonth(monthStr);
                                            setTimelineDateMode('month');
                                          }}
                                          style={{
                                            backgroundColor: isCurrentMonthFilter 
                                              ? 'color-mix(in srgb, var(--accent-gold) 20%, transparent)' 
                                              : 'color-mix(in srgb, var(--accent-gold) 6%, transparent)',
                                            borderColor: isCurrentMonthFilter 
                                              ? 'var(--accent-gold)' 
                                              : 'color-mix(in srgb, var(--accent-gold) 20%, transparent)',
                                          }}
                                          className="py-1.5 px-1 rounded-xl text-xs border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer hover:scale-102"
                                          title={`${timelineFilterYear}年${monthNum}月 (${count}件作品)`}
                                        >
                                          <span 
                                            className="font-mono font-bold text-xs" 
                                            style={{ color: 'var(--accent-gold)' }}
                                          >
                                            {monthNum}月
                                          </span>
                                          <span className="text-[10px] font-mono text-neutral-400">
                                            {count > 0 ? `${count}件` : '-'}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {timelineDateMode === 'range' && (
                              <div className="space-y-3 pt-1">
                                <div className="space-y-1.5">
                                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-medium">
                                    起始日期：
                                  </label>
                                  <input
                                    type="date"
                                    value={timelineRangeStart}
                                    onChange={(e) => setTimelineRangeStart(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    style={{
                                      backgroundColor: 'var(--search-bg)',
                                      borderColor: 'var(--card-border)',
                                      color: 'var(--text-main)',
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-medium">
                                    截止日期：
                                  </label>
                                  <input
                                    type="date"
                                    value={timelineRangeEnd}
                                    onChange={(e) => setTimelineRangeEnd(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    style={{
                                      backgroundColor: 'var(--search-bg)',
                                      borderColor: 'var(--card-border)',
                                      color: 'var(--text-main)',
                                    }}
                                  />
                                </div>
                                {/* Quick Presets */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {[
                                    { label: '近3个月', months: 3 },
                                    { label: '近半年', months: 6 },
                                    { label: '近1年', months: 12 },
                                  ].map((preset) => (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() => {
                                        const end = new Date();
                                        const start = new Date();
                                        start.setMonth(start.getMonth() - preset.months);
                                        setTimelineRangeEnd(end.toISOString().slice(0, 10));
                                        setTimelineRangeStart(start.toISOString().slice(0, 10));
                                      }}
                                      className="px-2 py-1 rounded-lg text-[11px] border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Footer actions */}
                            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setTimelineDateMode('all');
                                  setTimelineRangeStart('');
                                  setTimelineRangeEnd('');
                                  setIsTimelineDatePickerOpen(false);
                                }}
                                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                              >
                                重置显示全部
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsTimelineDatePickerOpen(false)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                                style={{ backgroundColor: 'var(--accent-gold)' }}
                              >
                                确认应用
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div 
                      className="flex items-center gap-1 p-1 rounded-xl border shadow-2xs" 
                      style={{ 
                        backgroundColor: 'var(--search-bg)', 
                        borderColor: 'var(--card-border)' 
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setTimelineSubLayout('grid')}
                        style={{
                          backgroundColor: timelineSubLayout === 'grid' ? 'var(--card-bg)' : 'transparent',
                          color: timelineSubLayout === 'grid' ? 'var(--accent-gold)' : 'var(--text-muted)',
                          boxShadow: timelineSubLayout === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                        }}
                        className="p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer hover:opacity-100 active:scale-95"
                        title="瀑布流排版"
                        aria-label="瀑布流排版"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineSubLayout('list')}
                        style={{
                          backgroundColor: timelineSubLayout === 'list' ? 'var(--card-bg)' : 'transparent',
                          color: timelineSubLayout === 'list' ? 'var(--accent-gold)' : 'var(--text-muted)',
                          boxShadow: timelineSubLayout === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                        }}
                        className="p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer hover:opacity-100 active:scale-95"
                        title="列表排版"
                        aria-label="列表排版"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative pt-0 pb-4">
                    {timelineGroups.map((group, groupIdx) => {
                      const isFirst = groupIdx === 0;
                      const isLast = groupIdx === timelineGroups.length - 1;

                      return (
                        <div key={group.title} className={`relative pl-8 sm:pl-11 space-y-4 ${isLast ? 'pb-2' : 'pb-8'}`}>
                          {/* Guide Line Segment Above Circle (Connects seamlessly from previous group, stopping flush at outer circle top rim at 5px) */}
                          {!isFirst && (
                            <div 
                              className="absolute left-4 sm:left-5 top-0 h-[5px] w-[2px] -translate-x-1/2 pointer-events-none"
                              style={{
                                backgroundColor: 'var(--accent-gold)',
                              }}
                            />
                          )}

                          {/* Guide Line Segment Below Circle (Single continuous 2px bar starting flush from outer circle bottom rim at 23px, zero neck / zero step) */}
                          <div 
                            className="absolute left-4 sm:left-5 top-[23px] w-[2px] -translate-x-1/2 pointer-events-none"
                            style={{
                              bottom: isLast ? '1rem' : '0px',
                              background: isLast
                                ? 'linear-gradient(to bottom, var(--accent-gold), transparent)'
                                : 'var(--accent-gold)',
                            }}
                          />

                          {/* Month Header Circle Node: Pure Hollow Ring with Concentric Center Dot */}
                          <div 
                            className="absolute left-4 sm:left-5 -translate-x-1/2 top-0 h-7 w-7 z-10 pointer-events-none flex items-center justify-center"
                          >
                            <svg 
                              viewBox="0 0 18 18" 
                              className="w-[18px] h-[18px] shrink-0 select-none"
                              aria-hidden="true"
                            >
                              {/* Hollow Outer Circle Ring (Outer diameter exactly 18px, fits viewBox perfectly: outer perimeter [0, 18], inner perimeter [2, 16]) */}
                              <circle 
                                cx="9" 
                                cy="9" 
                                r="8" 
                                fill="none" 
                                stroke="var(--accent-gold)" 
                                strokeWidth="2" 
                              />

                              {/* Concentric Solid Center Dot: Completely hollow around it, dynamic theme color */}
                              <circle 
                                cx="9" 
                                cy="9" 
                                r="2.8" 
                                fill="var(--accent-gold)" 
                              />
                            </svg>
                          </div>

                          {/* Month Header Date Display (Clean, spacious, unblocked) */}
                          <div className="flex items-center gap-2 h-7 min-h-[28px]">
                            <h3 
                              className="font-art-serif text-base sm:text-lg font-bold tracking-wide flex items-center gap-1.5"
                              style={{ color: 'var(--text-main)' }}
                            >
                              {group.title.includes('年') ? (
                                <>
                                  <span>{group.title.split('年')[0]}年</span>
                                  <span style={{ color: 'var(--accent-gold)' }}>{group.title.split('年')[1]}</span>
                                </>
                              ) : (
                                <span>{group.title}</span>
                              )}
                            </h3>
                            <span 
                              className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-medium border"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
                                borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                                color: 'var(--accent-gold)',
                              }}
                            >
                              {group.items.length} 件作品
                            </span>
                          </div>

                        {/* Timeline Items Mode: Waterfall Grid or List */}
                        {timelineSubLayout === 'grid' ? (
                          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-5 items-stretch pl-1 sm:pl-2">
                            {group.items.map((art) => (
                              <ArtworkCard
                                key={art.id}
                                artwork={art}
                                customStatuses={statuses}
                                onClick={() => {
                                  if (isMultiSelectMode) {
                                    setSelectedArtworkIds((prev) =>
                                      prev.includes(art.id) ? prev.filter((id) => id !== art.id) : [...prev, art.id]
                                    );
                                  } else {
                                    onSelectArtwork(art);
                                  }
                                }}
                                onToggleFavorite={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(art.id);
                                }}
                                onTogglePin={(e) => {
                                  e.stopPropagation();
                                  onTogglePin(art.id);
                                }}
                                isSelectionMode={isMultiSelectMode}
                                isSelected={selectedArtworkIds.includes(art.id)}
                                onToggleSelect={() => {
                                  setSelectedArtworkIds((prev) =>
                                    prev.includes(art.id) ? prev.filter((id) => id !== art.id) : [...prev, art.id]
                                  );
                                }}
                                isTrashMode={selectedCategory === 'trash'}
                                onRestore={() => onRestoreArtwork(art.id)}
                                onPermanentDelete={() => onPermanentDeleteArtwork(art.id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3 pl-1 sm:pl-2">
                            {group.items.map((art) => (
                              <GalleryListRow
                                key={art.id}
                                art={art}
                                onSelect={onSelectArtwork}
                                onTogglePin={onTogglePin}
                                onToggleFavorite={onToggleFavorite}
                                isSelectionMode={isMultiSelectMode}
                                isSelected={selectedArtworkIds.includes(art.id)}
                                onToggleSelect={() => {
                                  setSelectedArtworkIds((prev) =>
                                    prev.includes(art.id) ? prev.filter((id) => id !== art.id) : [...prev, art.id]
                                  );
                                }}
                                isTrashMode={selectedCategory === 'trash'}
                                onRestore={(id) => onRestoreArtwork(id)}
                                onPermanentDelete={(id) => onPermanentDeleteArtwork(id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div 
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              className="p-12 rounded-3xl border text-center space-y-4 shadow-xs"
            >
              <div 
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                  color: 'var(--accent-gold)',
                }}
              >
                <Folder className="w-7 h-7" style={{ color: 'var(--accent-gold)' }} />
              </div>
              <div className="space-y-1">
                <h3 className="font-art-serif text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  {selectedCategory === 'trash' ? '回收站中没有任何作品' : '未找到符合条件的作品'}
                </h3>
                <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
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
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-main)',
                      }}
                      className="px-4 py-2 rounded-xl border text-xs font-medium hover:opacity-80 transition-colors"
                    >
                      重置所有筛选
                    </button>
                  )}
                  <button
                    onClick={onOpenAddModal}
                    style={{
                      backgroundColor: 'var(--accent-gold)',
                      color: '#FFFFFF',
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs hover:opacity-90 transition-all"
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

      {/* Batch Tag Edit Modal */}
      {isBatchTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            style={{
              backgroundColor: 'var(--modal-bg)',
              borderColor: 'var(--card-border)',
              color: 'var(--text-main)',
            }}
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div 
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' }}
                >
                  <Tag className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                </div>
                <div>
                  <h2 className="font-art-serif text-lg font-bold">批量编辑作品标签</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    已选中 <span className="font-mono font-bold" style={{ color: 'var(--accent-gold)' }}>{selectedArtworkIds.length}</span> 件作品
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchTagModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-500/10 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Action Mode Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>操作类型</label>
                <div 
                  className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTagAction('add');
                      setSelectedTagsForBatch([]);
                    }}
                    className="py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: batchTagAction === 'add' ? 'var(--accent-gold)' : 'transparent',
                      color: batchTagAction === 'add' ? '#FFFFFF' : 'var(--text-main)',
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>追加标签</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTagAction('remove');
                      setSelectedTagsForBatch([]);
                    }}
                    className="py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: batchTagAction === 'remove' ? 'var(--accent-gold)' : 'transparent',
                      color: batchTagAction === 'remove' ? '#FFFFFF' : 'var(--text-main)',
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>移除标签</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTagAction('set');
                      setSelectedTagsForBatch([]);
                    }}
                    className="py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: batchTagAction === 'set' ? 'var(--accent-gold)' : 'transparent',
                      color: batchTagAction === 'set' ? '#FFFFFF' : 'var(--text-main)',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置覆盖</span>
                  </button>
                </div>
              </div>

              {/* Mode Description */}
              <div 
                className="p-3 rounded-xl border text-xs leading-relaxed"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 25%, transparent)',
                  color: 'var(--text-main)',
                }}
              >
                {batchTagAction === 'add' && '💡 将选中的标签批量追加至所选作品中，保留原有的其他标签。'}
                {batchTagAction === 'remove' && '💡 从所选作品中批量剔除指定的标签，其余标签不受影响。'}
                {batchTagAction === 'set' && '💡 将所选作品的标签统一重置为以下指定的标签。'}
              </div>

              {/* Input New Tags */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center justify-between" style={{ color: 'var(--text-main)' }}>
                    <span>手动输入标签 (支持逗号/空格分隔)</span>
                  </label>
                  <input
                    type="text"
                    value={batchTagsInput}
                    onChange={(e) => setBatchTagsInput(e.target.value)}
                    placeholder="如: 水彩, 赛博朋克, 角色设计"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--search-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>

                {/* Built-in and Custom Shortcut Tags Options (Requirement 2) */}
                <div 
                  className="p-3 rounded-2xl border space-y-3"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                      快捷标签选项 (点击快速添加/填入)
                    </span>
                    <span className="text-[11px] font-mono opacity-60">共 {allAvailableQuickTags.length} 个</span>
                  </div>

                  {/* 1. Built-in Preset Tags */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--accent-gold)' }}>
                      <span>✨ 内置常用标签</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_BUILTIN_TAGS.map((tag) => {
                        const isSelected = selectedTagsForBatch.includes(tag) || batchTagsInput.split(/[,，\s]+/).map(t => t.replace(/^#/, '').trim()).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedTagsForBatch((prev) =>
                                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer"
                            style={{
                              backgroundColor: isSelected
                                ? 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))'
                                : 'var(--search-bg)',
                              borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
                              color: isSelected ? 'var(--accent-gold)' : 'var(--text-main)',
                            }}
                          >
                            <span>#{tag}</span>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Custom Shortcut Tags */}
                  {customQuickTagsOnly.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                      <div className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--text-main)' }}>
                        <Tag className="w-3 h-3" style={{ color: 'var(--accent-gold)' }} />
                        <span>🏷️ 画师自定义与常用标签</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-0.5">
                        {customQuickTagsOnly.map((tag) => {
                          const isSelected = selectedTagsForBatch.includes(tag) || batchTagsInput.split(/[,，\s]+/).map(t => t.replace(/^#/, '').trim()).includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setSelectedTagsForBatch((prev) =>
                                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer"
                              style={{
                                backgroundColor: isSelected
                                  ? 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))'
                                  : 'var(--search-bg)',
                                borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
                                color: isSelected ? 'var(--accent-gold)' : 'var(--text-main)',
                              }}
                            >
                              <span>#{tag}</span>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tag Pickers for Remove Mode */}
              {batchTagAction === 'remove' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                    点击选择要移除的已有标签 ({selectedArtworksCommonTags.length} 个):
                  </label>
                  {selectedArtworksCommonTags.length === 0 ? (
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      选中的作品当前没有包含任何标签。
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                      {selectedArtworksCommonTags.map(({ tag, count }) => {
                        const isSelected = selectedTagsForBatch.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedTagsForBatch((prev) =>
                                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer"
                            style={{
                              backgroundColor: isSelected
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'var(--card-bg)',
                              borderColor: isSelected ? '#EF4444' : 'var(--card-border)',
                              color: isSelected ? '#EF4444' : 'var(--text-main)',
                            }}
                          >
                            <span>#{tag}</span>
                            <span className="text-[10px] opacity-70 font-mono">({count})</span>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div 
              className="p-4 border-t flex items-center justify-end gap-2.5"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <button
                type="button"
                onClick={() => setIsBatchTagModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                取消
              </button>
              <button
                type="button"
                disabled={isSubmittingBatchTags}
                onClick={handleApplyBatchTags}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-gold)' }}
              >
                {isSubmittingBatchTags ? '处理中...' : '确认应用至选中的作品'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Change Category Modal (Requirement 1 & 4) */}
      {isBatchCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            style={{ 
              backgroundColor: 'var(--content-bg)', 
              borderColor: 'var(--card-border)',
              color: 'var(--text-main)'
            }}
          >
            {/* Modal Header */}
            <div 
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' }}
                >
                  <FolderInput className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                </div>
                <div>
                  <h2 className="font-art-serif text-lg font-bold">批量更改分类</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    已选中 <span className="font-mono font-bold" style={{ color: 'var(--accent-gold)' }}>{selectedArtworkIds.length}</span> 件作品
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchCategoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-500/10 transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Selected Artworks Category Breakdown */}
              <div 
                className="p-3 rounded-2xl border text-xs space-y-1.5"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 25%, transparent)',
                  color: 'var(--text-main)',
                }}
              >
                <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--accent-gold)' }}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>所选作品当前分类分布</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedArtworksCategoryCounts.map((item) => (
                    <span 
                      key={item.name}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/5 dark:bg-white/10"
                    >
                      {item.name}: <strong className="font-mono">{item.count}</strong> 件
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Category Selection Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold flex items-center justify-between" style={{ color: 'var(--text-main)' }}>
                  <span>选择目标目标分类</span>
                  <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                    作品将统一移动至此分类
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {categories.map((cat) => {
                    const isSelected = targetCategoryForBatch === cat.name;
                    const countInCat = artworks.filter((a) => a.type === cat.name).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setTargetCategoryForBatch(cat.name)}
                        className="p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer"
                        style={{
                          backgroundColor: isSelected
                            ? 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))'
                            : 'var(--card-bg)',
                          borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
                          color: isSelected ? 'var(--accent-gold)' : 'var(--text-main)',
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className="w-4 h-4 shrink-0" style={{ color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)' }} />
                          <span className="text-xs font-bold truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono opacity-60">({countInCat})</span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" style={{ color: 'var(--accent-gold)' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add New Category On the Fly */}
              {isAddingCategoryInBatch ? (
                <div className="p-3 rounded-2xl border space-y-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <label className="text-[11px] font-bold" style={{ color: 'var(--text-main)' }}>新建并直接设为目标分类</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryNameInBatch}
                      onChange={(e) => setNewCategoryNameInBatch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateNewCategoryInBatch();
                        }
                      }}
                      placeholder="输入新分类名称..."
                      className="flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--search-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-main)',
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewCategoryInBatch}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-gold)' }}
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategoryInBatch(false);
                        setNewCategoryNameInBatch('');
                      }}
                      className="px-2 py-1.5 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCategoryInBatch(true)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:opacity-80 cursor-pointer"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--accent-gold)',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新建自定义分类</span>
                </button>
              )}
            </div>

            {/* Modal Footer */}
            <div 
              className="p-4 border-t flex items-center justify-end gap-2.5"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <button
                type="button"
                onClick={() => setIsBatchCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                取消
              </button>
              <button
                type="button"
                disabled={isSubmittingBatchCategory || !targetCategoryForBatch}
                onClick={handleApplyBatchCategory}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-gold)' }}
              >
                {isSubmittingBatchCategory ? '移动中...' : `移动至「${targetCategoryForBatch || '所选分类'}」`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
