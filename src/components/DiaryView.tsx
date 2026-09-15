import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Clock, 
  Tag, 
  Edit3, 
  Trash2, 
  Image as ImageIcon,
  Sparkles,
  Link,
  X,
  Check,
  RotateCcw,
  CloudUpload,
  FileEdit,
  CheckCircle2,
  Smile,
  ChevronDown,
  CalendarRange,
  Hash,
  Paperclip,
  UploadCloud,
  Film,
  Play,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  ExternalLink
} from 'lucide-react';
import { DiaryEntry, Artwork, DiaryMediaItem } from '../types';
import { vaultDB } from '../services/db';

const DRAFT_STORAGE_KEY = 'art_vault_diary_draft_v2';
const CUSTOM_DIARY_TAGS_KEY = 'art_vault_custom_diary_tags';

// Built-in diary tags (specifically distinct from artwork library tags)
const BUILT_IN_DIARY_TAGS = [
  '技法心得',
  '灵感速记',
  '色彩练习',
  '构图探索',
  '笔刷测评',
  '人体结构',
  '光影推演',
  '创作杂谈',
  '阶段复盘',
];

// Built-in mood options with emoji
const BUILT_IN_MOODS = [
  { emoji: '😊', label: '愉悦开朗' },
  { emoji: '✨', label: '灵感爆发' },
  { emoji: '🎨', label: '沉浸心流' },
  { emoji: '🍵', label: '心静如水' },
  { emoji: '🔥', label: '热血沸腾' },
  { emoji: '🤯', label: '攻克突破' },
  { emoji: '☕', label: '疲惫充实' },
  { emoji: '🌧️', label: '遇到瓶颈' },
];

interface DiaryDraft {
  id: string | null; // null for new entry, string for existing diary
  title: string;
  date: string;
  mood?: string;
  content: string;
  selectedArtId: string;
  tagsInput: string;
  media?: DiaryMediaItem[];
  savedAt: number;
}

interface DiaryViewProps {
  diaries: DiaryEntry[];
  artworks: Artwork[];
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSaveDiary: (diary: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<void>;
  onDeleteDiary: (id: string) => Promise<void>;
  onSelectArtwork: (artwork: Artwork) => void;
  preselectedArtwork?: Artwork | null;
  onClearPreselectedArtwork?: () => void;
}

type DiaryDateFilterMode = 'all' | 'day' | 'month' | 'year' | 'range';

export const DiaryView: React.FC<DiaryViewProps> = ({
  diaries,
  artworks,
  searchQuery = '',
  onSearchChange,
  onSaveDiary,
  onDeleteDiary,
  onSelectArtwork,
  preselectedArtwork,
  onClearPreselectedArtwork,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');
  const [selectedArtId, setSelectedArtId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');

  // Process Media Attachment States (Requirement 4: 图片、视频、GIF动图)
  const [mediaList, setMediaList] = useState<DiaryMediaItem[]>([]);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [showMediaUrlInput, setShowMediaUrlInput] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen Lightbox viewer for process media
  const [lightboxMedia, setLightboxMedia] = useState<{
    list: DiaryMediaItem[];
    currentIndex: number;
    diaryTitle: string;
  } | null>(null);

  // Quick attribute filter state: 'all' | 'with_mood' | 'with_media' | 'with_art' | 'standalone'
  const [attributeFilter, setAttributeFilter] = useState<'all' | 'with_mood' | 'with_media' | 'with_art' | 'standalone'>('all');
  
  // Custom diary tags state (stored in localStorage)
  const [customDiaryTags, setCustomDiaryTags] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_DIARY_TAGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newCustomTagInput, setNewCustomTagInput] = useState('');
  const [showAddCustomTag, setShowAddCustomTag] = useState(false);

  // Artwork & Calendar Filter states
  const [filterArtworkId, setFilterArtworkId] = useState<string>('all');
  const [isCalendarFilterOpen, setIsCalendarFilterOpen] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState<DiaryDateFilterMode>('all');
  const [filterDay, setFilterDay] = useState(new Date().toISOString().slice(0, 10));
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterRangeStart, setFilterRangeStart] = useState('');
  const [filterRangeEnd, setFilterRangeEnd] = useState('');

  // Auto-save draft states
  const [storedDraft, setStoredDraft] = useState<DiaryDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isDraftRestoredNotice, setIsDraftRestoredNotice] = useState(false);
  const isInitialMount = useRef(true);
  const calendarFilterRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxMedia) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxMedia(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxMedia((prev) => {
          if (!prev || prev.currentIndex <= 0) return prev;
          return { ...prev, currentIndex: prev.currentIndex - 1 };
        });
      } else if (e.key === 'ArrowRight') {
        setLightboxMedia((prev) => {
          if (!prev || prev.currentIndex >= prev.list.length - 1) return prev;
          return { ...prev, currentIndex: prev.currentIndex + 1 };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxMedia]);

  // Requirement 3: When preselectedArtwork arrives from ArtworkDetailModal, open modal with fresh clean mood
  useEffect(() => {
    if (preselectedArtwork) {
      setEditingDiary(null);
      setTitle(`${preselectedArtwork.title} 创作随笔`);
      setDate(new Date().toISOString().split('T')[0]);
      setMood(''); // Explicitly blank! Fixes Requirement 3
      setContent('');
      setSelectedArtId(preselectedArtwork.id);
      setMediaList([]);
      setTagsInput('#技法心得 #创作随笔');
      setIsDraftRestoredNotice(false);
      setIsModalOpen(true);
    }
  }, [preselectedArtwork]);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarFilterRef.current && !calendarFilterRef.current.contains(event.target as Node)) {
        setIsCalendarFilterOpen(false);
      }
    };
    if (isCalendarFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarFilterOpen]);

  // Save custom diary tags to localStorage
  const handleSaveCustomTag = (tagText: string) => {
    const clean = tagText.trim().replace(/^#/, '');
    if (!clean) return;
    if (BUILT_IN_DIARY_TAGS.includes(clean) || customDiaryTags.includes(clean)) {
      setNewCustomTagInput('');
      setShowAddCustomTag(false);
      return;
    }
    const updated = [...customDiaryTags, clean];
    setCustomDiaryTags(updated);
    try {
      localStorage.setItem(CUSTOM_DIARY_TAGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setNewCustomTagInput('');
    setShowAddCustomTag(false);

    // Also append to current tagsInput
    toggleTagInInput(clean);
  };

  const handleDeleteCustomTag = (tagToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customDiaryTags.filter((t) => t !== tagToDelete);
    setCustomDiaryTags(updated);
    try {
      localStorage.setItem(CUSTOM_DIARY_TAGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to toggle a tag into or out of tagsInput
  const toggleTagInInput = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, '');
    const currentTags = tagsInput
      .split(/[\s,，]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    let newTags: string[];
    if (currentTags.includes(cleanTag)) {
      newTags = currentTags.filter((t) => t !== cleanTag);
    } else {
      newTags = [...currentTags, cleanTag];
    }
    setTagsInput(newTags.map((t) => `#${t}`).join(' '));
  };

  // Helper to read draft from storage (checks memory state, IndexedDB, and web storage)
  const readDraftFromStorage = (): DiaryDraft | null => {
    if (storedDraft) return storedDraft;
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.title?.trim() || parsed.content?.trim() || parsed.tagsInput?.trim() || parsed.mood?.trim() || (parsed.media && parsed.media.length > 0))) {
          return parsed;
        }
      }
    } catch {
      // Ignore web storage parse issues
    }
    return null;
  };

  // Helper to persist draft with quota protection & IndexedDB backing
  const persistDraft = (draft: DiaryDraft | null) => {
    // 1. Update in-memory state immediately so UI remains instantaneous
    setStoredDraft(draft);

    if (!draft) {
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      vaultDB.saveSetting(DRAFT_STORAGE_KEY, null).catch(() => {});
      return;
    }

    // 2. Persist complete draft (including large base64 media) safely to IndexedDB
    vaultDB.saveSetting(DRAFT_STORAGE_KEY, draft).catch((err) => {
      console.warn('Failed to save diary draft to IndexedDB:', err);
    });

    // 3. Persist lightweight, quota-safe summary to Web Storage (sessionStorage/localStorage)
    // Never allow giant base64 data URIs into 5MB localStorage to avoid QuotaExceededError
    try {
      const safeDraft: DiaryDraft = {
        ...draft,
        media: draft.media?.map((m) => ({
          ...m,
          // Only store light external URLs or metadata in localStorage; full data URI is in IndexedDB
          url: m.url && m.url.startsWith('data:') && m.url.length > 5120 ? '' : m.url,
        })),
      };
      const serialized = JSON.stringify(safeDraft);
      sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
    } catch {
      // Storage quota exceeded in localStorage/sessionStorage; silently fall back to minimal text draft
      try {
        const minimalDraft = {
          id: draft.id,
          title: draft.title,
          date: draft.date,
          mood: draft.mood,
          content: draft.content.slice(0, 5000),
          selectedArtId: draft.selectedArtId,
          tagsInput: draft.tagsInput,
          savedAt: draft.savedAt,
        };
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(minimalDraft));
      } catch {
        // Completely full Web Storage; IndexedDB is safely holding the full draft
      }
    }
  };

  // Initial load of draft on mount (checks both Web Storage and IndexedDB)
  useEffect(() => {
    // 1. Synchronous fast check for immediate UI display
    const quickDraft = readDraftFromStorage();
    if (quickDraft) {
      setStoredDraft(quickDraft);
      const d = new Date(quickDraft.savedAt);
      setLastSavedTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      );
    }

    // 2. Asynchronous check in IndexedDB (which contains the complete media)
    vaultDB.getSetting<DiaryDraft>(DRAFT_STORAGE_KEY).then((idbDraft) => {
      if (idbDraft && (idbDraft.title?.trim() || idbDraft.content?.trim() || idbDraft.tagsInput?.trim() || idbDraft.mood?.trim() || (idbDraft.media && idbDraft.media.length > 0))) {
        setStoredDraft(idbDraft);
        const d = new Date(idbDraft.savedAt);
        setLastSavedTime(
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
        );
      }
    }).catch(() => {});
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isModalOpen) return;

    if (!title.trim() && !content.trim() && !tagsInput.trim() && !mood.trim() && mediaList.length === 0) {
      persistDraft(null);
      setDraftStatus('idle');
      return;
    }

    setDraftStatus('saving');

    const debounceTimer = setTimeout(() => {
      const now = Date.now();
      const currentDraft: DiaryDraft = {
        id: editingDiary?.id || null,
        title,
        date,
        mood,
        content,
        selectedArtId,
        tagsInput,
        media: mediaList,
        savedAt: now,
      };

      persistDraft(currentDraft);
      setDraftStatus('saved');

      const d = new Date(now);
      setLastSavedTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      );
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [isModalOpen, title, date, mood, content, selectedArtId, tagsInput, mediaList, editingDiary]);

  // Synchronous beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isModalOpen && (title.trim() || content.trim() || mood.trim() || mediaList.length > 0)) {
        const currentDraft: DiaryDraft = {
          id: editingDiary?.id || null,
          title,
          date,
          mood,
          content,
          selectedArtId,
          tagsInput,
          media: mediaList,
          savedAt: Date.now(),
        };
        try {
          vaultDB.saveSetting(DRAFT_STORAGE_KEY, currentDraft);
        } catch {
          // ignore
        }
        try {
          const safeDraft: DiaryDraft = {
            ...currentDraft,
            media: currentDraft.media?.map((m) => ({
              ...m,
              url: m.url && m.url.startsWith('data:') && m.url.length > 5120 ? '' : m.url,
            })),
          };
          const serialized = JSON.stringify(safeDraft);
          sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
          localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
        } catch {
          // Quota safe fallback - ignore
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isModalOpen, title, date, mood, content, selectedArtId, tagsInput, mediaList, editingDiary]);

  // Apply draft data to form
  const applyDraftToForm = (draft: DiaryDraft) => {
    setTitle(draft.title || '');
    setDate(draft.date || new Date().toISOString().split('T')[0]);
    setMood(draft.mood || '');
    setContent(draft.content || '');
    setSelectedArtId(draft.selectedArtId || '');
    setTagsInput(draft.tagsInput || '');
    setMediaList(draft.media ? [...draft.media] : []);
    if (draft.id) {
      const matched = diaries.find((d) => d.id === draft.id);
      setEditingDiary(matched || null);
    } else {
      setEditingDiary(null);
    }
    setIsDraftRestoredNotice(true);
    setTimeout(() => setIsDraftRestoredNotice(false), 4000);
    setIsModalOpen(true);
  };

  // Clear draft
  const handleClearDraft = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    persistDraft(null);
    setDraftStatus('idle');
    setLastSavedTime(null);
    setIsDraftRestoredNotice(false);
  };

  // Media file upload handler (Requirement 4: 支持多图、视频、GIF动图)
  const handleMediaFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);

    const newItems: DiaryMediaItem[] = [];
    let processed = 0;
    const fileArray = Array.from(files);
    const total = fileArray.length;

    const checkDone = () => {
      processed++;
      if (processed === total) {
        setMediaList((prev) => [...prev, ...newItems]);
        setIsUploadingMedia(false);
      }
    };

    fileArray.forEach((file) => {
      let type: 'image' | 'gif' | 'video' = 'image';
      if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
        type = 'gif';
      } else if (file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(file.name)) {
        type = 'video';
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const rawUrl = reader.result;
          // Optimize static images above 800KB to reduce memory footprint while preserving clarity
          if (type === 'image' && file.size > 800 * 1024) {
            const img = new Image();
            img.onload = () => {
              const maxDim = 1920;
              let { width, height } = img;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                newItems.push({
                  id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  url: canvas.toDataURL('image/jpeg', 0.88),
                  type,
                  name: file.name,
                });
              } else {
                newItems.push({
                  id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  url: rawUrl,
                  type,
                  name: file.name,
                });
              }
              checkDone();
            };
            img.onerror = () => {
              newItems.push({
                id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                url: rawUrl,
                type,
                name: file.name,
              });
              checkDone();
            };
            img.src = rawUrl;
          } else {
            newItems.push({
              id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              url: rawUrl,
              type,
              name: file.name,
            });
            checkDone();
          }
        } else {
          checkDone();
        }
      };
      reader.onerror = () => {
        checkDone();
      };
      reader.readAsDataURL(file);
    });
  };

  // Media URL input handler
  const handleAddMediaFromUrl = () => {
    const url = mediaUrlInput.trim();
    if (!url) return;

    let type: 'image' | 'gif' | 'video' = 'image';
    if (/\.gif($|\?)/i.test(url)) {
      type = 'gif';
    } else if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(url)) {
      type = 'video';
    }

    setMediaList((prev) => [
      ...prev,
      {
        id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        type,
        name: url.split('/').pop()?.split('?')[0] || '网络媒体',
      },
    ]);
    setMediaUrlInput('');
    setShowMediaUrlInput(false);
  };

  const handleRemoveMedia = (mediaId: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
  };

  // Open modal for creation or edit (Fixes Requirement 3: Never inherit mood from previous diary)
  const handleOpenAdd = (associatedArt?: Artwork | null) => {
    // If opening for an associated artwork: ALWAYS start with fresh clean mood and fields
    if (associatedArt) {
      setEditingDiary(null);
      setTitle(`${associatedArt.title} 创作随笔`);
      setDate(new Date().toISOString().split('T')[0]);
      setMood(''); // Explicitly empty! Fixes Requirement 3
      setContent('');
      setSelectedArtId(associatedArt.id);
      setMediaList([]);
      setTagsInput('#技法心得 #创作随笔');
      setIsDraftRestoredNotice(false);
      setIsModalOpen(true);
      return;
    }

    const activeDraft = readDraftFromStorage();
    if (activeDraft && !activeDraft.id && (activeDraft.title.trim() || activeDraft.content.trim() || (activeDraft.media && activeDraft.media.length > 0))) {
      applyDraftToForm(activeDraft);
      return;
    }

    setEditingDiary(null);
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setMood(''); // Explicitly empty! Ensures no mood is pre-selected
    setContent('');
    setSelectedArtId('');
    setMediaList([]);
    setTagsInput('#灵感速记');
    setIsDraftRestoredNotice(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (diary: DiaryEntry) => {
    const activeDraft = readDraftFromStorage();
    if (activeDraft && activeDraft.id === diary.id && (activeDraft.content !== diary.content || activeDraft.title !== diary.title)) {
      applyDraftToForm(activeDraft);
      return;
    }

    setEditingDiary(diary);
    setTitle(diary.title);
    setDate(diary.date);
    setMood(diary.mood || '');
    setContent(diary.content);
    setSelectedArtId(diary.artworkId || '');
    setMediaList(diary.media ? [...diary.media] : []);
    setTagsInput((diary.tags || []).map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' '));
    setIsDraftRestoredNotice(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const matchedArt = artworks.find((a) => a.id === selectedArtId);

    const parsedTags = tagsInput
      .split(/[\s,，]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    await onSaveDiary(
      {
        title: title.trim(),
        date,
        mood: mood.trim() || undefined,
        content: content.trim(),
        artworkId: matchedArt?.id,
        artworkTitle: matchedArt?.title,
        artworkThumbnail: matchedArt?.imageUrl,
        tags: parsedTags,
        media: mediaList.length > 0 ? mediaList : undefined,
      },
      editingDiary?.id
    );

    // Clear saved draft on successful submit
    persistDraft(null);
    setDraftStatus('idle');
    setLastSavedTime(null);
    setEditingDiary(null);
    setTitle('');
    setContent('');
    setMood('');
    setSelectedArtId('');
    setMediaList([]);
    setTagsInput('');
    setIsDraftRestoredNotice(false);
    setIsModalOpen(false);
    onClearPreselectedArtwork?.();
  };

  // Available Years from all diaries for calendar filter
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    const currentYr = new Date().getFullYear().toString();
    yearSet.add(currentYr);
    diaries.forEach((d) => {
      if (d.date && d.date.length >= 4) {
        yearSet.add(d.date.slice(0, 4));
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [diaries]);

  // Available dates with diaries (for day mode jump)
  const availableDiaryDates = useMemo(() => {
    const dateMap = new Map<string, number>();
    diaries.forEach((d) => {
      if (d.date) {
        dateMap.set(d.date, (dateMap.get(d.date) || 0) + 1);
      }
    });
    return Array.from(dateMap.entries())
      .map(([dStr, count]) => ({ date: dStr, count }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [diaries]);

  // Filter diaries based on Artwork, Search Query, Quick Attribute, and Calendar Filter
  const filteredDiaries = useMemo(() => {
    return diaries.filter((d) => {
      // Search Query filter (supports keywords, titles, tags, content, mood, and calendar dates)
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const qClean = q.replace(/^#/, '');
        const matchedTitle = (d.title || '').toLowerCase().includes(q);
        const matchedContent = (d.content || '').toLowerCase().includes(q);
        const dateRaw = d.date || '';
        const matchedDate = dateRaw.toLowerCase().includes(q) 
          || dateRaw.replace(/-/g, '.').includes(q)
          || dateRaw.replace(/-/g, '/').includes(q)
          || (q.includes('年') && dateRaw.startsWith(q.split('年')[0]))
          || (q.includes('月') && dateRaw.includes(q.replace('月', '').padStart(2, '0')));
        const matchedMood = (d.mood || '').toLowerCase().includes(q);
        const matchedTags = (d.tags || []).some((t) => t.toLowerCase().includes(qClean));
        const matchedArtwork = artworks.some((a) => a.id === d.artworkId && a.title.toLowerCase().includes(q));

        if (!matchedTitle && !matchedContent && !matchedDate && !matchedMood && !matchedTags && !matchedArtwork) {
          return false;
        }
      }

      // Artwork filter
      if (filterArtworkId !== 'all' && d.artworkId !== filterArtworkId) {
        return false;
      }
      // Quick Attribute filter
      if (attributeFilter === 'with_mood' && (!d.mood || !d.mood.trim())) {
        return false;
      }
      if (attributeFilter === 'with_media' && (!d.media || d.media.length === 0)) {
        return false;
      }
      if (attributeFilter === 'with_art' && !d.artworkId) {
        return false;
      }
      if (attributeFilter === 'standalone' && d.artworkId) {
        return false;
      }

      // Calendar filter
      if (dateFilterMode === 'day') {
        return d.date === filterDay;
      }
      if (dateFilterMode === 'month') {
        return (d.date || '').startsWith(filterMonth);
      }
      if (dateFilterMode === 'year') {
        return (d.date || '').startsWith(filterYear);
      }
      if (dateFilterMode === 'range') {
        if (filterRangeStart && d.date < filterRangeStart) return false;
        if (filterRangeEnd && d.date > filterRangeEnd) return false;
        return true;
      }
      return true;
    });
  }, [diaries, artworks, searchQuery, filterArtworkId, attributeFilter, dateFilterMode, filterDay, filterMonth, filterYear, filterRangeStart, filterRangeEnd]);

  // Group filtered diaries by Year and Month (e.g., "2026年9月")
  const groupedDiaries = useMemo(() => {
    return filteredDiaries.reduce((acc, entry) => {
      const d = new Date(entry.date);
      const yearMonth = isNaN(d.getTime()) 
        ? '未知月份' 
        : `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
      if (!acc[yearMonth]) {
        acc[yearMonth] = [];
      }
      acc[yearMonth].push(entry);
      return acc;
    }, {} as Record<string, DiaryEntry[]>);
  }, [filteredDiaries]);

  // Active tags parsed from tagsInput for highlighting tag chips
  const activeTagsInForm = useMemo(() => {
    return tagsInput
      .split(/[\s,，]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
  }, [tagsInput]);

  // Human-readable active date filter label (Requirement 1: 默认显示“日历筛选”)
  const activeCalendarFilterLabel = useMemo(() => {
    if (dateFilterMode === 'all') return '日历筛选';
    if (dateFilterMode === 'day') return `日期: ${filterDay}`;
    if (dateFilterMode === 'month') return `月份: ${filterMonth}`;
    if (dateFilterMode === 'year') return `年份: ${filterYear}年`;
    if (dateFilterMode === 'range') {
      return `区间: ${filterRangeStart || '不限'} ~ ${filterRangeEnd || '不限'}`;
    }
    return '日历筛选';
  }, [dateFilterMode, filterDay, filterMonth, filterYear, filterRangeStart, filterRangeEnd]);

  const handleClearCalendarFilter = () => {
    setDateFilterMode('all');
    setFilterRangeStart('');
    setFilterRangeEnd('');
    setIsCalendarFilterOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-24 sm:pb-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div>
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-2 transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
              color: 'var(--accent-gold)',
            }}
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
            <span>作品 + 日记 创作空间</span>
          </div>
          <h1 className="font-art-serif text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
            创作日记
          </h1>
          <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            记录每一次笔刷尝试、色彩突破与深夜思考。每一张画都是一段不可复制的光阴。
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            id="btn-new-diary"
            onClick={() => handleOpenAdd(preselectedArtwork)}
            className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow active:scale-95 transition-all w-full sm:w-auto text-white cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-gold)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>写创作日记</span>
            {storedDraft && (storedDraft.title.trim() || storedDraft.content.trim() || storedDraft.mood?.trim()) && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-white/25 text-white font-mono ml-1">
                有草稿
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Unsaved Draft Floating Reminder Banner */}
      {storedDraft && !isModalOpen && (storedDraft.title.trim() || storedDraft.content.trim() || storedDraft.mood?.trim()) && (
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-xs animate-in fade-in slide-in-from-top-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))',
            borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, var(--card-border))',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                color: 'var(--accent-gold)',
              }}
            >
              <FileEdit className="w-4 h-4" />
            </div>
            <div className="text-xs min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold truncate" style={{ color: 'var(--text-main)' }}>
                  检测到未提交的创作日记草稿：{storedDraft.title ? `《${storedDraft.title}》` : '未命名随笔'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                  <CheckCircle2 className="w-3 h-3" /> 已自动存至本地
                </span>
              </div>
              <p className="text-[11px] truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                {new Date(storedDraft.savedAt).toLocaleTimeString()} 暂存 · 共 {storedDraft.content.length} 字
                {storedDraft.mood && ` · 心情: ${storedDraft.mood}`} · 刷新或关闭浏览器不会丢失
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => applyDraftToForm(storedDraft)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-2xs hover:shadow active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-gold)' }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>继续编辑草稿</span>
            </button>
            <button
              onClick={handleClearDraft}
              className="px-2.5 py-1.5 rounded-xl text-xs hover:opacity-80 transition-opacity border cursor-pointer"
              style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
              title="清除已暂存的草稿"
            >
              放弃草稿
            </button>
          </div>
        </div>
      )}

      {/* Toolbar: Associated Artwork on Left, Date Filter on Far Right (两端对称对齐) */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 text-xs w-full">
        {/* Left: Associated artwork selector + Active search/filter pills */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Associated artwork selector - Compact width */}
          <div 
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 h-8.5 sm:h-9 rounded-xl border transition-all shadow-2xs shrink-0"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-gold)' }} />
            <span className="shrink-0 font-medium text-[11px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>关联作品:</span>
            <select
              value={filterArtworkId}
              onChange={(e) => setFilterArtworkId(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
              }}
              className="text-[11px] sm:text-xs font-medium focus:outline-none max-w-[76px] xs:max-w-[105px] sm:max-w-[160px] truncate cursor-pointer pr-0.5"
            >
              <option value="all">全部作品 ({diaries.length})</option>
              {artworks.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.title}
                </option>
              ))}
            </select>
          </div>

          {/* Active Search Query Pill (if searching) */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border hover:opacity-80 transition-opacity cursor-pointer shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, var(--card-bg))',
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)',
              }}
              title="清除搜索关键词"
            >
              <span>搜索: “{searchQuery}”</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Active Filter Clear Pill (if active) */}
          {dateFilterMode !== 'all' && (
            <button
              type="button"
              onClick={handleClearCalendarFilter}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono border hover:opacity-80 transition-opacity cursor-pointer shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)',
              }}
              title="清除日期筛选"
            >
              <span>{activeCalendarFilterLabel}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Count indicator + Interactive Calendar Date Filter Trigger (居右对齐) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden md:inline font-mono text-[11px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
            共 {filteredDiaries.length} 篇日记
          </span>

          <div className="relative shrink-0" ref={calendarFilterRef}>
            <button
              type="button"
              id="btn-diary-calendar-filter"
              onClick={() => setIsCalendarFilterOpen(!isCalendarFilterOpen)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 h-8.5 sm:h-9 rounded-xl border text-[11px] sm:text-xs font-medium transition-all shadow-2xs cursor-pointer hover:opacity-90 active:scale-95 whitespace-nowrap shrink-0"
              style={{
                backgroundColor: dateFilterMode !== 'all'
                  ? 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))'
                  : 'var(--card-bg)',
                borderColor: dateFilterMode !== 'all'
                  ? 'var(--accent-gold)'
                  : 'var(--card-border)',
                color: dateFilterMode !== 'all'
                  ? 'var(--accent-gold)'
                  : 'var(--text-main)',
              }}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-gold)' }} />
              <span>{activeCalendarFilterLabel}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {/* Calendar Filter Dropdown Panel - Anchored to right with full viewport containment */}
            {isCalendarFilterOpen && (
              <div 
                className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2.5rem)] sm:w-96 max-w-[360px] sm:max-w-md rounded-2xl border p-3.5 sm:p-4 shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
                }}
              >
                <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: 'var(--text-main)' }}>
                    <Calendar className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    <span>选择日期</span>
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    当前匹配 {filteredDiaries.length} 篇
                  </span>
                </div>

                {/* Filter Mode Tabs */}
                <div 
                  className="grid grid-cols-5 gap-1 p-1 rounded-xl border text-[11px]"
                  style={{
                    backgroundColor: 'var(--search-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  {[
                    { mode: 'all', label: '全部' },
                    { mode: 'day', label: '年月日' },
                    { mode: 'month', label: '按月份' },
                    { mode: 'year', label: '按年份' },
                    { mode: 'range', label: '自定义' },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setDateFilterMode(item.mode as DiaryDateFilterMode)}
                      style={
                        dateFilterMode === item.mode
                          ? {
                              backgroundColor: 'var(--card-bg)',
                              color: 'var(--accent-gold)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            }
                          : {
                              color: 'var(--text-muted)',
                            }
                      }
                      className={`py-1 text-center rounded-lg font-medium transition-all cursor-pointer ${
                        dateFilterMode === item.mode ? 'font-bold' : 'hover:opacity-80'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Tab: Day Mode */}
                {dateFilterMode === 'day' && (
                  <div className="space-y-2.5 pt-1">
                    <label className="text-xs block font-medium" style={{ color: 'var(--text-muted)' }}>
                      选择具体年月日：
                    </label>
                    <input
                      type="date"
                      value={filterDay}
                      onChange={(e) => setFilterDay(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500"
                      style={{
                        backgroundColor: 'var(--search-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-main)',
                      }}
                    />

                    {/* Quick Day Shortcuts */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setFilterDay(new Date().toISOString().slice(0, 10))}
                        className="px-2.5 py-1 rounded-lg text-[11px] border border-dashed hover:opacity-80 cursor-pointer"
                        style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)', backgroundColor: 'var(--search-bg)' }}
                      >
                        今天
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const y = new Date();
                          y.setDate(y.getDate() - 1);
                          setFilterDay(y.toISOString().slice(0, 10));
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] border border-dashed hover:opacity-80 cursor-pointer"
                        style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)', backgroundColor: 'var(--search-bg)' }}
                      >
                        昨天
                      </button>
                    </div>

                    {/* Available Dates with Diaries list */}
                    {availableDiaryDates.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'var(--card-border)' }}>
                        <span className="text-[11px] block font-medium" style={{ color: 'var(--text-muted)' }}>
                          点击直达有日记的日期：
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                          {availableDiaryDates.slice(0, 10).map((dItem) => (
                            <button
                              key={dItem.date}
                              type="button"
                              onClick={() => setFilterDay(dItem.date)}
                              style={{
                                borderColor: filterDay === dItem.date ? 'var(--accent-gold)' : 'var(--card-border)',
                                backgroundColor: filterDay === dItem.date ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : 'var(--search-bg)',
                                color: filterDay === dItem.date ? 'var(--accent-gold)' : 'var(--text-main)',
                              }}
                              className="px-2 py-0.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer"
                            >
                              {dItem.date} ({dItem.count})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Month Mode */}
                {dateFilterMode === 'month' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs block font-medium" style={{ color: 'var(--text-muted)' }}>
                        选择具体月份：
                      </label>
                      <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-gold)' }}>
                        {filterMonth}
                      </span>
                    </div>

                    {/* Year selection pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {availableYears.map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            setFilterYear(yr);
                            const m = filterMonth.slice(5, 7) || '01';
                            setFilterMonth(`${yr}-${m}`);
                          }}
                          style={{
                            borderColor: filterMonth.startsWith(yr) ? 'var(--accent-gold)' : 'var(--card-border)',
                            backgroundColor: filterMonth.startsWith(yr) ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : 'var(--search-bg)',
                            color: filterMonth.startsWith(yr) ? 'var(--accent-gold)' : 'var(--text-main)',
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono border shrink-0 transition-all cursor-pointer ${
                            filterMonth.startsWith(yr) ? 'font-bold shadow-2xs' : 'hover:opacity-80'
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
                        const currentYr = filterMonth.slice(0, 4) || filterYear;
                        const mStr = `${currentYr}-${String(mNum).padStart(2, '0')}`;
                        const isSelected = filterMonth === mStr;
                        const count = diaries.filter((d) => (d.date || '').startsWith(mStr)).length;

                        return (
                          <button
                            key={mNum}
                            type="button"
                            onClick={() => setFilterMonth(mStr)}
                            style={{
                              backgroundColor: isSelected
                                ? 'var(--accent-gold)'
                                : count > 0 ? 'color-mix(in srgb, var(--accent-gold) 10%, var(--search-bg))' : 'var(--search-bg)',
                              borderColor: isSelected
                                ? 'var(--accent-gold)'
                                : 'var(--card-border)',
                            }}
                            className={`py-1.5 px-1 rounded-xl text-xs border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              isSelected ? 'font-bold shadow-xs' : 'hover:opacity-80'
                            }`}
                          >
                            <span 
                              className="font-mono font-bold text-xs"
                              style={{ color: isSelected ? '#FFFFFF' : 'var(--accent-gold)' }}
                            >
                              {mNum}月
                            </span>
                            <span 
                              className="text-[10px] font-mono"
                              style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}
                            >
                              {count > 0 ? `${count}篇` : '-'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab: Year Mode */}
                {dateFilterMode === 'year' && (
                  <div className="space-y-3 pt-1">
                    <label className="text-xs block font-medium" style={{ color: 'var(--text-muted)' }}>
                      选择具体年份：
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableYears.map((yr) => {
                        const isSelected = filterYear === yr;
                        const count = diaries.filter((d) => (d.date || '').startsWith(yr)).length;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setFilterYear(yr)}
                            style={{
                              borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
                              backgroundColor: isSelected ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : 'var(--search-bg)',
                              color: isSelected ? 'var(--accent-gold)' : 'var(--text-main)',
                            }}
                            className={`py-2 px-2.5 rounded-xl text-xs font-mono border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                              isSelected ? 'font-bold shadow-2xs' : 'hover:opacity-80'
                            }`}
                          >
                            <span>{yr} 年</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {count} 篇日记
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab: Range Mode */}
                {dateFilterMode === 'range' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs block font-medium" style={{ color: 'var(--text-muted)' }}>
                        起始日期：
                      </label>
                      <input
                        type="date"
                        value={filterRangeStart}
                        onChange={(e) => setFilterRangeStart(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500"
                        style={{
                          backgroundColor: 'var(--search-bg)',
                          borderColor: 'var(--card-border)',
                          color: 'var(--text-main)',
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs block font-medium" style={{ color: 'var(--text-muted)' }}>
                        截止日期：
                      </label>
                      <input
                        type="date"
                        value={filterRangeEnd}
                        onChange={(e) => setFilterRangeEnd(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500"
                        style={{
                          backgroundColor: 'var(--search-bg)',
                          borderColor: 'var(--card-border)',
                          color: 'var(--text-main)',
                        }}
                      />
                    </div>

                    {/* Quick range presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: '近7天', days: 7 },
                        { label: '近30天', days: 30 },
                        { label: '近3个月', days: 90 },
                        { label: '近半年', days: 180 },
                        { label: '近1年', days: 365 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(start.getDate() - preset.days);
                            setFilterRangeEnd(end.toISOString().slice(0, 10));
                            setFilterRangeStart(start.toISOString().slice(0, 10));
                          }}
                          style={{
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--search-bg)',
                          }}
                          className="px-2 py-0.5 rounded-lg text-[11px] border border-dashed hover:opacity-80 cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <button
                    type="button"
                    onClick={handleClearCalendarFilter}
                    className="text-xs hover:opacity-80 cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    重置为全部日记
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarFilterOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-gold)' }}
                  >
                    确认应用
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diary Timeline Layout (Requirements 1, 2, 4, 5, 6) */}
      {Object.keys(groupedDiaries).length > 0 ? (
        <div className="space-y-8 sm:space-y-10">
          {(Object.entries(groupedDiaries) as [string, DiaryEntry[]][]).map(([yearMonth, entries]) => (
            <div key={yearMonth} className="space-y-4">
              
              {/* Month Heading */}
              <div 
                className="sticky top-14 sm:top-20 z-10 flex items-center gap-3 py-2 backdrop-blur-md px-1 rounded-xl"
                style={{ backgroundColor: 'color-mix(in srgb, var(--bg-page) 85%, transparent)' }}
              >
                <span 
                  className="font-art-serif text-sm sm:text-base font-bold px-3 py-1 rounded-xl border shadow-2xs"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                >
                  {yearMonth}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--card-border)' }} />
                <span className="text-[11px] sm:text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {entries.length} 篇日记
                </span>
              </div>

              {/* Entries Timeline Track - Two-column spine layout perfectly aligning node dot (Requirement 2) */}
              <div className="space-y-4 sm:space-y-6">
                {entries.map((diary, entryIdx) => {
                  const fullDate = diary.date ? diary.date.replace(/-/g, '.') : '';
                  const matchedArt = artworks.find((a) => a.id === diary.artworkId);
                  const isLast = entryIdx === entries.length - 1;

                  return (
                    <div
                      key={diary.id}
                      id={`diary-card-${diary.id}`}
                      className="flex items-stretch gap-3 sm:gap-4 md:gap-5 group"
                    >
                      {/* Left Spine Column: dot is always mathematically centered on the track */}
                      <div className="flex flex-col items-center shrink-0 w-5 sm:w-6 relative">
                        {/* Upper line segment */}
                        <div 
                          className={`w-[2px] h-4 sm:h-5 ${entryIdx === 0 ? 'invisible' : ''}`}
                          style={{ backgroundColor: 'var(--card-border)' }}
                        />

                        {/* Centered Node Dot */}
                        <div 
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 group-hover:scale-125 transition-all duration-200 shadow-xs flex items-center justify-center z-10 shrink-0"
                          style={{ 
                            backgroundColor: 'var(--accent-gold)',
                            borderColor: 'var(--bg-page)',
                            boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-gold) 20%, transparent)',
                          }}
                        >
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white" />
                        </div>

                        {/* Lower line segment */}
                        <div 
                          className={`w-[2px] flex-1 my-0.5 ${isLast ? 'opacity-30' : 'opacity-80'}`}
                          style={{ backgroundColor: 'var(--card-border)' }}
                        />
                      </div>

                      {/* Right Column: Card Content */}
                      <div className="flex-1 min-w-0 pb-3 sm:pb-4">
                        <article
                          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} 
                          className="p-3.5 sm:p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-3"
                        >
                          {/* Header: Date + Mood Badge (Requirement 4) + Associated Art + Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                                <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>
                                  {fullDate}
                                </span>

                                {/* Mood Badge - Display ONLY if mood was entered */}
                                {diary.mood && (
                                  <span 
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium border shadow-2xs"
                                    style={{
                                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, var(--card-bg))',
                                      borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                                      color: 'var(--accent-gold)',
                                    }}
                                  >
                                    <span>{diary.mood}</span>
                                  </span>
                                )}

                                {/* Associated Art Badge */}
                                {diary.artworkTitle && (
                                  <button
                                    type="button"
                                    onClick={() => matchedArt && onSelectArtwork(matchedArt)}
                                    className="inline-flex items-center gap-1 font-sans hover:underline text-xs truncate max-w-full cursor-pointer"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">关联作品: {diary.artworkTitle}</span>
                                  </button>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="font-art-serif text-base sm:text-lg font-bold break-words" style={{ color: 'var(--text-main)' }}>
                                {diary.title}
                              </h3>
                            </div>

                            {/* Actions: Edit / Delete */}
                            <div className="flex items-center gap-1 self-end sm:self-start shrink-0 opacity-90 sm:opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(diary)}
                                className="p-1.5 rounded-lg hover:opacity-80 transition-colors cursor-pointer"
                                style={{ color: 'var(--text-muted)' }}
                                title="编辑日记"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteDiary(diary.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="删除日记"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Content text */}
                          <div className="text-xs sm:text-sm leading-relaxed font-light whitespace-pre-wrap break-words" style={{ color: 'var(--text-main)' }}>
                            {diary.content}
                          </div>

                          {/* Moments-style media grid (微信朋友圈风格多媒体九宫格布局，去除冗余标题边框) */}
                          {diary.media && diary.media.length > 0 && (
                            <div className="pt-0.5">
                              {diary.media.length === 1 ? (
                                <div 
                                  onClick={() => setLightboxMedia({
                                    list: diary.media || [],
                                    currentIndex: 0,
                                    diaryTitle: diary.title,
                                  })}
                                  className="group/media relative inline-block max-w-[280px] sm:max-w-[340px] max-h-[320px] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border shadow-2xs hover:opacity-95 transition-all bg-black/5 dark:bg-black/20"
                                  style={{ borderColor: 'var(--card-border)' }}
                                >
                                  {diary.media[0].type === 'video' ? (
                                    <div className="relative flex items-center justify-center bg-neutral-900 aspect-video min-w-[220px]">
                                      <video 
                                        src={diary.media[0].url} 
                                        className="w-full h-full object-cover opacity-85 group-hover/media:opacity-95 transition-opacity"
                                        preload="metadata"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-lg group-hover/media:scale-110 transition-transform">
                                          <Play className="w-5 h-5 fill-current ml-0.5" />
                                        </div>
                                      </div>
                                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-black/60 text-white backdrop-blur-xs shadow-xs">
                                        视频
                                      </span>
                                    </div>
                                  ) : diary.media[0].type === 'gif' ? (
                                    <div className="relative">
                                      <img
                                        src={diary.media[0].url}
                                        alt={diary.media[0].name || 'GIF 动图'}
                                        className="w-full max-h-[300px] object-cover"
                                        loading="lazy"
                                      />
                                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-pink-600/90 text-white shadow-xs">
                                        GIF
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <img
                                        src={diary.media[0].url}
                                        alt={diary.media[0].name || '记录图片'}
                                        className="w-full max-h-[300px] object-cover"
                                        loading="lazy"
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div 
                                  className={`grid gap-1.5 sm:gap-2 ${
                                    diary.media.length === 2
                                      ? 'grid-cols-2 max-w-[260px] sm:max-w-[320px]'
                                      : diary.media.length === 4
                                      ? 'grid-cols-2 max-w-[260px] sm:max-w-[320px]'
                                      : 'grid-cols-3 max-w-[360px] sm:max-w-[440px]'
                                  }`}
                                >
                                  {diary.media.map((item, mIdx) => (
                                    <div
                                      key={item.id || mIdx}
                                      onClick={() => setLightboxMedia({
                                        list: diary.media || [],
                                        currentIndex: mIdx,
                                        diaryTitle: diary.title,
                                      })}
                                      className="group/media relative aspect-square rounded-lg sm:rounded-xl overflow-hidden border cursor-pointer bg-black/5 dark:bg-black/20 flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                                      style={{ borderColor: 'var(--card-border)' }}
                                    >
                                      {item.type === 'video' ? (
                                        <div className="w-full h-full relative flex items-center justify-center bg-neutral-900">
                                          <video 
                                            src={item.url} 
                                            className="w-full h-full object-cover opacity-80"
                                            preload="metadata"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 backdrop-blur-xs text-white flex items-center justify-center shadow-md">
                                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                            </div>
                                          </div>
                                          <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-black/60 text-white backdrop-blur-xs">
                                            视频
                                          </span>
                                        </div>
                                      ) : item.type === 'gif' ? (
                                        <div className="w-full h-full relative">
                                          <img
                                            src={item.url}
                                            alt={item.name || 'GIF 动图'}
                                            className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                          />
                                          <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-pink-600/90 text-white shadow-xs">
                                            GIF
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="w-full h-full relative">
                                          <img
                                            src={item.url}
                                            alt={item.name || '记录图片'}
                                            className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Associated Master Artwork Preview Thumbnail (placed BELOW 记录) */}
                          {matchedArt && (
                            <div
                              onClick={() => onSelectArtwork(matchedArt)}
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--card-bg) 80%, var(--bg-page))',
                                borderColor: 'var(--card-border)',
                              }}
                              className="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer hover:border-amber-500/50 transition-colors min-w-0"
                            >
                              <img
                                src={matchedArt.imageUrl}
                                alt={matchedArt.title}
                                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shrink-0"
                              />
                              <div className="text-xs space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-amber-500/15" style={{ color: 'var(--accent-gold)' }}>
                                    关联作品
                                  </span>
                                  <span className="font-medium truncate block" style={{ color: 'var(--text-main)' }}>
                                    {matchedArt.title}
                                  </span>
                                </div>
                                <span className="block font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                  {matchedArt.type} · {matchedArt.width} × {matchedArt.height}
                                </span>
                                <span className="font-medium text-[11px] inline-flex items-center gap-1" style={{ color: 'var(--accent-gold)' }}>
                                  点击进入大图查看 →
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Tag Pills */}
                          {diary.tags && diary.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                              {diary.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
                                    borderColor: 'var(--card-border)',
                                    color: 'var(--text-muted)',
                                  }}
                                  className="text-[11px] px-2 py-0.5 rounded-full border font-mono"
                                >
                                  #{tag.replace(/^#/, '')}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div 
          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} 
          className="py-16 sm:py-20 rounded-3xl border border-dashed text-center p-6 sm:p-8 space-y-4 shadow-2xs"
        >
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
              color: 'var(--accent-gold)',
            }}
          >
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-art-serif text-base sm:text-lg font-bold" style={{ color: 'var(--text-main)' }}>
              {dateFilterMode !== 'all' || filterArtworkId !== 'all'
                ? `在所选条件（${activeCalendarFilterLabel}）下暂无日记`
                : '还没有创作日记'}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {dateFilterMode !== 'all' || filterArtworkId !== 'all'
                ? '当前时间或关联作品范围内未搜索到相关日记。您可以清除筛选条件或撰写一篇新的日记。'
                : '记录画画时的灵感、踩坑经验与色彩笔记。日积月累，是一部属于你自己的成长史。'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {/* Clear date filter button if active (Requirement 2 & 3 consistency) */}
            {dateFilterMode !== 'all' && (
              <button
                type="button"
                onClick={handleClearCalendarFilter}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-gold)' }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>清除日期筛选 (查看全部日记)</span>
              </button>
            )}

            {filterArtworkId !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterArtworkId('all')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
              >
                <span>重置作品筛选</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: 'var(--accent-gold)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>写一篇日记</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Diary Modal (Requirements 4, 5, 6, 7) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div 
            style={{ backgroundColor: "var(--modal-bg)", borderColor: "var(--card-border)" }} 
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl p-4 sm:p-6 animate-in fade-in zoom-in-95 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 shrink-0 gap-3" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="font-art-serif text-base sm:text-lg font-bold truncate" style={{ color: 'var(--text-main)' }}>
                  {editingDiary ? '编辑创作日记' : '新建创作日记'}
                </h2>
                {/* Auto-save draft status indicator */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border"
                  style={{
                    backgroundColor: draftStatus === 'saving' 
                      ? 'color-mix(in srgb, var(--accent-gold) 12%, transparent)' 
                      : draftStatus === 'saved' 
                      ? 'color-mix(in srgb, #10b981 12%, transparent)' 
                      : 'var(--bg-page)',
                    borderColor: 'var(--card-border)',
                    color: draftStatus === 'saving' 
                      ? 'var(--accent-gold)' 
                      : draftStatus === 'saved' 
                      ? '#10b981' 
                      : 'var(--text-muted)',
                  }}
                >
                  {draftStatus === 'saving' ? (
                    <>
                      <CloudUpload className="w-3 h-3 animate-pulse" />
                      <span>正在暂存草稿...</span>
                    </>
                  ) : draftStatus === 'saved' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>已自动暂存 {lastSavedTime}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 opacity-60" />
                      <span>实时防丢暂存</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:opacity-70 transition-opacity cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="关闭窗口 (草稿已自动保存)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Restored notice banner inside modal */}
            {isDraftRestoredNotice && (
              <div 
                className="mt-2.5 px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, var(--card-border))',
                  color: 'var(--text-main)',
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate text-[11px]">已自动载入未保存的日记草稿内容</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleClearDraft();
                    setTitle('');
                    setDate(new Date().toISOString().split('T')[0]);
                    setMood('');
                    setContent('');
                    setTagsInput('');
                    setSelectedArtId('');
                  }}
                  className="text-[11px] underline hover:opacity-80 shrink-0 cursor-pointer"
                  style={{ color: 'var(--accent-gold)' }}
                >
                  清空重新开始
                </button>
              </div>
            )}

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pt-3 pr-1 flex-1">
              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                  日记标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：雨夜环境光攻克、深夜速涂随笔、色彩复盘..."
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              {/* Date & Associated artwork */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                    创作日期
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                    关联画匣作品 (可选)
                  </label>
                  <select
                    value={selectedArtId}
                    onChange={(e) => setSelectedArtId(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    <option value="">不关联具体作品 (独立创作日记)</option>
                    {artworks.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 记录心得 */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                  记录心得
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="今天完成了哪一步？尝试了什么新笔刷或光影技法？有遇到什么困扰或突破吗？"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              {/* 心情记录 Module */}
              <div className="space-y-2 p-3 rounded-2xl border" style={{ backgroundColor: 'var(--search-bg)', borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                    <Smile className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                    <span>心情记录</span>
                  </div>
                  {mood && (
                    <button
                      type="button"
                      onClick={() => setMood('')}
                      className="text-[11px] hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      清除心情
                    </button>
                  )}
                </div>

                {/* Mood Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {BUILT_IN_MOODS.map((item) => {
                    const moodLabel = `${item.emoji} ${item.label}`;
                    const isSelected = Boolean(mood && (mood === moodLabel || mood === item.label));
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setMood(isSelected ? '' : moodLabel)}
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--accent-gold)'
                            : 'var(--card-bg)',
                          borderColor: isSelected
                            ? 'var(--accent-gold)'
                            : 'var(--card-border)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs border transition-all cursor-pointer ${
                          isSelected ? 'font-semibold shadow-2xs' : 'hover:opacity-80'
                        }`}
                      >
                        {item.emoji} {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Mood Input */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="在此输入自定义心情"
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* 记录心绪 Module */}
              <div 
                className="space-y-3 p-3 sm:p-3.5 rounded-2xl border"
                style={{ backgroundColor: 'var(--search-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                    <Layers className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                    <span>记录心绪</span>
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    已添加 {mediaList.length} 项 (图片/视频/GIF)
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  支持批量导入画稿草图、分层线稿截图、绘画过程延时视频 (MP4/WebM) 以及动态过程 GIF，记录创作心绪与演变。
                </p>

                {/* Upload Buttons & Dropzone */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={mediaInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleMediaFilesSelected(e.target.files);
                      }
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingMedia}
                    onClick={() => mediaInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))',
                      borderColor: 'var(--accent-gold)',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingMedia ? '正在读取文件...' : '选择本地图片/视频/GIF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMediaUrlInput(!showMediaUrlInput)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium hover:opacity-80 transition-all cursor-pointer"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <Link className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <span>通过网络链接添加</span>
                  </button>
                </div>

                {/* Network URL input row */}
                {showMediaUrlInput && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      value={mediaUrlInput}
                      onChange={(e) => setMediaUrlInput(e.target.value)}
                      placeholder="粘贴媒体直链 (如 https://.../step1.jpg 或 demo.mp4 / anim.gif)"
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-main)',
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMediaFromUrl();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddMediaFromUrl}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-gold)' }}
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMediaUrlInput(false);
                        setMediaUrlInput('');
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs border hover:opacity-80 cursor-pointer"
                      style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
                    >
                      取消
                    </button>
                  </div>
                )}

                {/* Media Preview Grid */}
                {mediaList.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {mediaList.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="relative rounded-xl border overflow-hidden group aspect-video sm:aspect-4/3 flex items-center justify-center bg-black/5 dark:bg-black/30 shadow-2xs"
                        style={{ borderColor: 'var(--card-border)' }}
                      >
                        {m.type === 'video' ? (
                          <div className="w-full h-full relative flex items-center justify-center bg-neutral-900">
                            <video src={m.url} className="w-full h-full object-cover opacity-80" preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Play className="w-6 h-6 text-white/90 drop-shadow" />
                            </div>
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-600/90 text-white shadow-xs">
                              视频
                            </span>
                          </div>
                        ) : m.type === 'gif' ? (
                          <div className="w-full h-full relative">
                            <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-pink-600/90 text-white shadow-xs">
                              GIF 动图
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full relative">
                            <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-black/60 text-white backdrop-blur-xs shadow-xs">
                              图片
                            </span>
                          </div>
                        )}

                        {/* Title pill */}
                        <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white/90 font-mono truncate pointer-events-none">
                          {m.name || `附件 #${idx + 1}`}
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(m.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs"
                          title="移除此媒体"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Diary Tags Module (Requirement 5: Built-in + User-customized tags) */}
              <div className="space-y-2 p-3 rounded-2xl border" style={{ backgroundColor: 'var(--search-bg)', borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                    <Tag className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                    <span>日记分类标签 (独立于作品库)</span>
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    已选 {activeTagsInForm.length} 个
                  </span>
                </div>

                {/* Text input for tags */}
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="点击下方标签添加，或直接输入如 #技法心得 #色彩笔记"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />

                {/* Built-in Tags */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] block font-medium" style={{ color: 'var(--text-muted)' }}>
                    内置日记标签 (点击即可添加/取消)：
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {BUILT_IN_DIARY_TAGS.map((tName) => {
                      const isSelected = activeTagsInForm.includes(tName);
                      return (
                        <button
                          key={tName}
                          type="button"
                          onClick={() => toggleTagInInput(tName)}
                          style={{
                            backgroundColor: isSelected
                              ? 'var(--accent-gold)'
                              : 'var(--card-bg)',
                            borderColor: isSelected
                              ? 'var(--accent-gold)'
                              : 'var(--card-border)',
                            color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                          }}
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                            isSelected ? 'font-bold shadow-2xs' : 'hover:opacity-80'
                          }`}
                        >
                          #{tName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom User Tags */}
                <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] block font-medium" style={{ color: 'var(--text-muted)' }}>
                      画师自定义标签：
                    </span>
                    {!showAddCustomTag && (
                      <button
                        type="button"
                        onClick={() => setShowAddCustomTag(true)}
                        className="text-[11px] hover:opacity-80 transition-opacity font-medium cursor-pointer"
                        style={{ color: 'var(--accent-gold)' }}
                      >
                        + 新增自定义标签
                      </button>
                    )}
                  </div>

                  {/* Add custom tag field */}
                  {showAddCustomTag && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newCustomTagInput}
                        onChange={(e) => setNewCustomTagInput(e.target.value)}
                        placeholder="输入自定义标签名称"
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          borderColor: 'var(--card-border)',
                          color: 'var(--text-main)',
                        }}
                        className="flex-1 px-2.5 py-1 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCustomTag(newCustomTagInput);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCustomTag(newCustomTagInput)}
                        className="px-3 py-1 rounded-xl text-xs font-semibold text-white shadow-2xs cursor-pointer"
                        style={{ backgroundColor: 'var(--accent-gold)' }}
                      >
                        添加
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCustomTag(false);
                          setNewCustomTagInput('');
                        }}
                        className="px-2 py-1 rounded-xl text-xs hover:opacity-80 cursor-pointer border"
                        style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
                      >
                        取消
                      </button>
                    </div>
                  )}

                  {/* Render user custom tags */}
                  {customDiaryTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {customDiaryTags.map((cTag) => {
                        const isSelected = activeTagsInForm.includes(cTag);
                        return (
                          <div
                            key={cTag}
                            onClick={() => toggleTagInInput(cTag)}
                            style={{
                              backgroundColor: isSelected
                                ? 'var(--accent-gold)'
                                : 'var(--card-bg)',
                              borderColor: isSelected
                                ? 'var(--accent-gold)'
                                : 'var(--card-border)',
                              color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                            }}
                            className={`group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                              isSelected ? 'font-bold shadow-2xs' : 'hover:opacity-80'
                            }`}
                          >
                            <span>#{cTag}</span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomTag(cTag, e)}
                              className="opacity-60 hover:opacity-100 hover:text-rose-500 ml-0.5 cursor-pointer"
                              title="删除此自定义标签"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                      暂无自定义标签，点击右上角即可添加并自动保存。
                    </p>
                  )}
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t shrink-0" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span>{content.length} 字</span>
                  {(title.trim() || content.trim() || mood.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('确定要清空正在编写的内容吗？')) {
                          handleClearDraft();
                          setTitle('');
                          setDate(new Date().toISOString().split('T')[0]);
                          setMood('');
                          setContent('');
                          setTagsInput('');
                          setSelectedArtId('');
                        }
                      }}
                      className="text-[11px] hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      清空重写
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium hover:opacity-80 transition-opacity border cursor-pointer"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-medium text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-gold)' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>保存日记</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Process Media (images, videos, gifs) */}
      {lightboxMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxMedia(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-art-serif font-bold text-sm sm:text-base truncate">
                  {lightboxMedia.diaryTitle} · 过程记录
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/20">
                  {lightboxMedia.currentIndex + 1} / {lightboxMedia.list.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
                title="关闭 (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Content Stage */}
            <div className="relative w-full flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-hidden rounded-2xl bg-black/40 border border-white/10">
              {lightboxMedia.list[lightboxMedia.currentIndex]?.type === 'video' ? (
                <video
                  key={lightboxMedia.list[lightboxMedia.currentIndex].url}
                  src={lightboxMedia.list[lightboxMedia.currentIndex].url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
                />
              ) : (
                <img
                  key={lightboxMedia.list[lightboxMedia.currentIndex].url}
                  src={lightboxMedia.list[lightboxMedia.currentIndex].url}
                  alt={lightboxMedia.list[lightboxMedia.currentIndex].name || '过程媒体'}
                  className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
                />
              )}

              {/* Prev button */}
              {lightboxMedia.list.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxMedia((prev) =>
                      prev
                        ? {
                            ...prev,
                            currentIndex:
                              (prev.currentIndex - 1 + prev.list.length) % prev.list.length,
                          }
                        : null
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-lg cursor-pointer"
                  title="上一张 (←)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next button */}
              {lightboxMedia.list.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxMedia((prev) =>
                      prev
                        ? {
                            ...prev,
                            currentIndex: (prev.currentIndex + 1) % prev.list.length,
                          }
                        : null
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-lg cursor-pointer"
                  title="下一张 (→)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Media Name Caption */}
            {lightboxMedia.list[lightboxMedia.currentIndex]?.name && (
              <div className="pt-2 text-center text-xs font-mono text-white/80">
                {lightboxMedia.list[lightboxMedia.currentIndex].name}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
