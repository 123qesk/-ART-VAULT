import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Palette, 
  Sparkles,
  LayoutGrid,
  Star,
  BookOpen,
  BarChart3,
  Settings,
  Home,
  Check,
  ChevronDown,
  Calendar,
  Tag,
  ArrowRight,
  ExternalLink,
  Layers,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ViewTab, ThemeMode, Artwork, DiaryEntry } from '../types';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: () => void;
  artworksCount: number;
  artworks?: Artwork[];
  diaries?: DiaryEntry[];
  onSelectArtwork?: (art: Artwork) => void;
}

const THEME_OPTIONS: { id: ThemeMode; name: string; tag: string; dotColor: string }[] = [
  { id: 'ivory', name: '象牙白', tag: '古雅纸感', dotColor: '#B4783E' },
  { id: 'pure_white', name: '纯白色', tag: '极简画廊', dotColor: '#9CA3AF' },
  { id: 'dark', name: '深邃夜', tag: '沉浸画室', dotColor: '#F59E0B' },
  { id: 'pink', name: '少女粉', tag: '柔美温和', dotColor: '#EC4899' },
  { id: 'pixel', name: '像素风', tag: '赛博复古', dotColor: '#10B981' },
  { id: 'custom', name: '自定义', tag: '个性配色', dotColor: '#8B5CF6' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  artworksCount,
  artworks = [],
  diaries = [],
  onSelectArtwork,
}) => {
  const { theme, setTheme, savedPresets, applyPreset, activePresetId } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchFilterCategory, setSearchFilterCategory] = useState<'all' | 'artworks' | 'diaries'>('all');

  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const headerPresets = (savedPresets || []).filter((p) => p && p.showInHeader);
  const activePreset = activePresetId ? savedPresets?.find((p) => p.id === activePresetId) : null;
  const currentThemeLabel = activePreset
    ? activePreset.name
    : THEME_OPTIONS.find((t) => t.id === theme)?.name || '主题外观';

  // Real-time Dual-Module Search Matching (Artworks & Diaries including Calendar Date content)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { matchedArtworks: [], matchedDiaries: [], totalCount: 0 };
    }
    const qClean = q.replace(/^#/, '');

    // 1. Match Artworks
    const matchedArtworks = artworks.filter((art) => {
      const matchTitle = (art.title || '').toLowerCase().includes(q);
      const matchDesc = (art.description || '').toLowerCase().includes(q);
      const matchTags = (art.tags || []).some((t) => t.toLowerCase().includes(qClean));
      const matchCat = (art.type || '').toLowerCase().includes(q);
      const matchStatus = (art.status || '').toLowerCase().includes(q);
      const matchDate = (art.date || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTags || matchCat || matchStatus || matchDate;
    });

    // 2. Match Diaries (Titles, Content, Calendar Dates, Mood, Tags, Associated Artwork)
    const matchedDiaries = diaries.filter((d) => {
      const matchTitle = (d.title || '').toLowerCase().includes(q);
      const matchContent = (d.content || '').toLowerCase().includes(q);
      const dateRaw = d.date || '';
      const matchDate = dateRaw.toLowerCase().includes(q)
        || dateRaw.replace(/-/g, '.').includes(q)
        || dateRaw.replace(/-/g, '/').includes(q)
        || (q.includes('年') && dateRaw.startsWith(q.split('年')[0]))
        || (q.includes('月') && dateRaw.includes(q.replace('月', '').padStart(2, '0')));
      const matchMood = (d.mood || '').toLowerCase().includes(q);
      const matchTags = (d.tags || []).some((t) => t.toLowerCase().includes(qClean));
      const matchArtwork = artworks.some((a) => a.id === d.artworkId && a.title.toLowerCase().includes(q));
      return matchTitle || matchContent || matchDate || matchMood || matchTags || matchArtwork;
    });

    return {
      matchedArtworks,
      matchedDiaries,
      totalCount: matchedArtworks.length + matchedDiaries.length,
    };
  }, [searchQuery, artworks, diaries]);

  const showSearchDropdown = isSearchFocused && searchQuery.trim().length > 0;

  useEffect(() => {
    if (showMobileSearch && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setShowThemeMenu(false);
      }
      const inDesktopSearch = searchContainerRef.current && searchContainerRef.current.contains(target);
      const inMobileSearch = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(target);
      if (!inDesktopSearch && !inMobileSearch) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: '首页', icon: <Home className="w-4 h-4" /> },
    { id: 'gallery', label: '作品库', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'favorites', label: '收藏', icon: <Star className="w-4 h-4" /> },
    { id: 'diary', label: '创作日记', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'stats', label: '创作统计', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: '设置', icon: <Settings className="w-4 h-4" /> },
  ];

  // Helper to render Artwork item in search results
  const renderArtworkResultItem = (art: Artwork) => (
    <div
      key={art.id}
      onClick={() => {
        setIsSearchFocused(false);
        if (onSelectArtwork) {
          onSelectArtwork(art);
        } else {
          onSelectTab('gallery');
        }
      }}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
    >
      <div 
        className="w-11 h-11 rounded-lg bg-cover bg-center shrink-0 border overflow-hidden relative shadow-2xs"
        style={{ 
          backgroundImage: `url(${art.imageUrl})`,
          borderColor: 'var(--card-border)' 
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span 
            className="text-xs font-semibold truncate group-hover:underline"
            style={{ color: 'var(--text-main)' }}
          >
            {art.title}
          </span>
          {art.type && (
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                color: 'var(--accent-gold)',
              }}
            >
              {art.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span>{art.date || '未记录日期'}</span>
          {art.tags && art.tags.length > 0 && (
            <span className="truncate max-w-[140px]">
              {art.tags.map(t => `#${t}`).join(' ')}
            </span>
          )}
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--accent-gold)' }} />
    </div>
  );

  // Helper to render Diary item in search results
  const renderDiaryResultItem = (d: DiaryEntry) => {
    const linkedArt = artworks.find((a) => a.id === d.artworkId);
    return (
      <div
        key={d.id}
        onClick={() => {
          setIsSearchFocused(false);
          onSelectTab('diary');
        }}
        className="flex items-start gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
      >
        <div 
          className="w-11 h-11 rounded-lg shrink-0 border flex flex-col items-center justify-center text-center p-1"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
            borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, var(--card-border))',
          }}
        >
          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
          <span className="text-[9px] font-mono font-bold leading-tight mt-0.5" style={{ color: 'var(--accent-gold)' }}>
            {(d.date || '').slice(5) || '日记'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span 
              className="text-xs font-semibold truncate group-hover:underline"
              style={{ color: 'var(--text-main)' }}
            >
              {d.title}
            </span>
            {d.mood && (
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
                  color: 'var(--accent-gold)',
                }}
              >
                {d.mood}
              </span>
            )}
          </div>
          <p 
            className="text-[11px] line-clamp-1 mt-0.5 font-light"
            style={{ color: 'var(--text-muted)' }}
          >
            {d.content || '无详细记录内容'}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="font-mono">{d.date}</span>
            {linkedArt && (
              <span className="truncate max-w-[120px]">
                🎨 {linkedArt.title}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2" style={{ color: 'var(--accent-gold)' }} />
      </div>
    );
  };

  // Search Results Dropdown Panel (Dual-module: 作品库 & 日记)
  const renderSearchResultsPanel = () => {
    const { matchedArtworks, matchedDiaries, totalCount } = searchResults;

    return (
      <div 
        id="search-results-dropdown-panel"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, var(--card-border))',
          boxShadow: '0 20px 30px -10px color-mix(in srgb, var(--accent-gold) 15%, rgba(0, 0, 0, 0.4))',
        }}
        className="absolute left-0 right-0 top-full mt-2 rounded-2xl border shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[75vh] flex flex-col overflow-hidden"
      >
        {/* Module Switch Filter Header */}
        <div 
          className="flex items-center justify-between pb-2 mb-2 border-b"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => setSearchFilterCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer select-none ${
                searchFilterCategory === 'all'
                  ? 'font-bold shadow-2xs'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: searchFilterCategory === 'all'
                  ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)'
                  : 'transparent',
                borderColor: searchFilterCategory === 'all'
                  ? 'color-mix(in srgb, var(--accent-gold) 40%, transparent)'
                  : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: searchFilterCategory === 'all' ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
            >
              全部结果 ({totalCount})
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => setSearchFilterCategory('artworks')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer select-none ${
                searchFilterCategory === 'artworks'
                  ? 'font-bold shadow-2xs'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: searchFilterCategory === 'artworks'
                  ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)'
                  : 'transparent',
                borderColor: searchFilterCategory === 'artworks'
                  ? 'color-mix(in srgb, var(--accent-gold) 40%, transparent)'
                  : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: searchFilterCategory === 'artworks' ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
            >
              作品库 ({matchedArtworks.length})
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => setSearchFilterCategory('diaries')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer select-none ${
                searchFilterCategory === 'diaries'
                  ? 'font-bold shadow-2xs'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: searchFilterCategory === 'diaries'
                  ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)'
                  : 'transparent',
                borderColor: searchFilterCategory === 'diaries'
                  ? 'color-mix(in srgb, var(--accent-gold) 40%, transparent)'
                  : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: searchFilterCategory === 'diaries' ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
            >
              日记 ({matchedDiaries.length})
            </button>
          </div>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={() => onSearchChange('')}
            className="text-[11px] hover:opacity-80 transition-opacity cursor-pointer font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            清空
          </button>
        </div>

        {/* Scrollable Results Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {totalCount === 0 ? (
            <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--accent-gold)' }} />
              <p className="text-xs">未找到与 “{searchQuery}” 相关的作品或日记</p>
              <p className="text-[11px] mt-1 opacity-70">支持搜索作品名、标签、日期 (如 2026-09)、心情或心得正文</p>
            </div>
          ) : (
            <>
              {/* Module 1: Artworks */}
              {(searchFilterCategory === 'all' || searchFilterCategory === 'artworks') && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <span 
                      className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ color: 'var(--accent-gold)' }}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      作品库 ({matchedArtworks.length})
                    </span>
                    {matchedArtworks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          onSelectTab('gallery');
                        }}
                        className="text-[10px] hover:underline flex items-center gap-0.5 cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        在作品库中查看全部
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  {matchedArtworks.length > 0 ? (
                    <div className="space-y-1">
                      {matchedArtworks.slice(0, searchFilterCategory === 'artworks' ? 12 : 4).map(renderArtworkResultItem)}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs rounded-xl border border-dashed" style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>
                      无匹配作品
                    </div>
                  )}
                </div>
              )}

              {/* Module 2: Diaries */}
              {(searchFilterCategory === 'all' || searchFilterCategory === 'diaries') && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <span 
                      className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ color: 'var(--accent-gold)' }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      日记 ({matchedDiaries.length})
                    </span>
                    {matchedDiaries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          onSelectTab('diary');
                        }}
                        className="text-[10px] hover:underline flex items-center gap-0.5 cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        在日记中查看全部
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  {matchedDiaries.length > 0 ? (
                    <div className="space-y-1">
                      {matchedDiaries.slice(0, searchFilterCategory === 'diaries' ? 12 : 4).map(renderDiaryResultItem)}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs rounded-xl border border-dashed" style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>
                      无匹配日记记录
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Quick View Action */}
        <div 
          className="pt-2 mt-2 border-t flex items-center justify-between text-xs"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            按 Enter 或点击项快速直达
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSearchFocused(false);
                onSelectTab('gallery');
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
              style={{
                backgroundColor: currentTab === 'gallery' ? 'var(--accent-gold)' : 'transparent',
                color: currentTab === 'gallery' ? '#FFFFFF' : 'var(--text-main)',
                border: '1px solid var(--card-border)',
              }}
            >
              作品库
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSearchFocused(false);
                onSelectTab('diary');
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
              style={{
                backgroundColor: currentTab === 'diary' ? 'var(--accent-gold)' : 'transparent',
                color: currentTab === 'diary' ? '#FFFFFF' : 'var(--text-main)',
                border: '1px solid var(--card-border)',
              }}
            >
              日记
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <header 
      id="main-navbar"
      style={{
        backgroundColor: 'var(--navbar-bg, var(--bg-page))',
        borderColor: 'var(--navbar-border, var(--card-border))',
      }}
      className="sticky top-0 z-40 w-full border-b transition-colors duration-300 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          
          {/* Brand Logo & Name */}
          <div 
            id="brand-logo-container"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div 
              style={{
                borderColor: 'var(--card-border)',
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
                color: 'var(--accent-gold)',
              }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
            >
              <Palette className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div className="flex flex-col">
              <span 
                style={{ color: 'var(--text-main)' }}
                className="font-art-serif text-lg font-bold tracking-wider flex items-center gap-1.5"
              >
                画匣 
                <span 
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-muted)',
                  }}
                  className="text-xs font-sans uppercase font-medium px-1.5 py-0.5 rounded border tracking-widest"
                >
                  ART VAULT
                </span>
              </span>
              <span 
                style={{ color: 'var(--text-muted)' }}
                className="text-[11px] font-light hidden sm:inline"
              >
                属于画师自己的数字作品档案馆
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav 
            id="primary-nav-tabs-desktop"
            className="hidden lg:flex items-center gap-1 shrink-0"
          >
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  style={{
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                    backgroundColor: isActive 
                      ? 'color-mix(in srgb, var(--accent-gold) 12%, transparent)' 
                      : 'transparent',
                    borderColor: isActive 
                      ? 'color-mix(in srgb, var(--accent-gold) 35%, transparent)' 
                      : 'transparent',
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap cursor-pointer select-none active:scale-95 ${
                    isActive ? 'shadow-2xs font-semibold' : 'hover:opacity-80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'gallery' && artworksCount > 0 && (
                    <span 
                      style={{
                        backgroundColor: isActive 
                          ? 'var(--accent-gold)' 
                          : 'color-mix(in srgb, var(--text-muted) 20%, transparent)',
                        color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                      }}
                      className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono"
                    >
                      {artworksCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Center Search Bar with Dual-Module Results (Desktop / Tablet) */}
          <div className="hidden sm:block flex-1 max-w-md mx-2 sm:mx-4" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search 
                className="w-4 h-4 absolute left-3 pointer-events-none transition-colors" 
                style={{ color: searchQuery || isSearchFocused ? 'var(--accent-gold)' : 'var(--text-muted)' }}
              />
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (currentTab !== 'gallery' && currentTab !== 'diary' && currentTab !== 'favorites') {
                      onSelectTab('gallery');
                    }
                    setIsSearchFocused(false);
                  } else if (e.key === 'Escape') {
                    setIsSearchFocused(false);
                  }
                }}
                placeholder="搜索作品、日记、日期"
                style={{
                  backgroundColor: 'var(--search-bg)',
                  borderColor: (searchQuery || isSearchFocused) ? 'var(--accent-gold)' : 'var(--card-border)',
                  color: 'var(--text-main)',
                  boxShadow: isSearchFocused ? '0 0 0 2px color-mix(in srgb, var(--accent-gold) 25%, transparent)' : undefined,
                }}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-full border placeholder-neutral-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    onSearchChange('');
                    setIsSearchFocused(false);
                  }}
                  style={{ color: 'var(--text-muted)' }}
                  className="absolute right-2.5 text-xs p-1 hover:opacity-80 transition-opacity cursor-pointer"
                  title="清除搜索内容"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Desktop Dual-Module Search Results Dropdown */}
            {showSearchDropdown && renderSearchResultsPanel()}
          </div>

          {/* Right Actions: Add Work, Theme, Search Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              id="mobile-search-toggle-btn"
              onClick={() => {
                setShowMobileSearch(!showMobileSearch);
                setIsSearchFocused(!showMobileSearch);
              }}
              style={{
                backgroundColor: (showMobileSearch || searchQuery)
                  ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)'
                  : 'transparent',
                borderColor: (showMobileSearch || searchQuery)
                  ? 'color-mix(in srgb, var(--accent-gold) 35%, transparent)'
                  : 'transparent',
                color: (showMobileSearch || searchQuery)
                  ? 'var(--accent-gold)'
                  : 'var(--text-muted)',
              }}
              className="sm:hidden p-2 rounded-full border transition-all active:scale-95"
              title="搜索作品与日记"
              aria-label="搜索作品与日记"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick Add Artwork Button (Desktop) */}
            <button
              id="btn-add-artwork-top"
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent-gold)' }}
            >
              <Plus className="w-4 h-4" />
              <span>添加作品</span>
            </button>

            {/* Theme Appearance Selector Dropdown */}
            <div className="relative" ref={themeMenuRef}>
              <button
                id="navbar-theme-menu-btn"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title="选择界面主题外观"
                aria-label="切换界面主题外观"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full border shadow-2xs hover:opacity-90 transition-all active:scale-95 text-xs font-medium cursor-pointer"
              >
                <Palette className="w-4 h-4 transition-colors" style={{ color: 'var(--accent-gold)' }} />
                <span className="hidden sm:inline">
                  {currentThemeLabel}
                </span>
                <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`} />
              </button>

              {showThemeMenu && (
                <div 
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto"
                >
                  <div 
                    style={{
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-muted)',
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider border-b"
                  >
                    画室主题外观
                  </div>
                  <div className="py-1 space-y-0.5">
                    {THEME_OPTIONS.map((opt) => {
                      const isSelected = !activePreset && (theme === opt.id || (opt.id === 'ivory' && theme === 'light'));
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setTheme(opt.id);
                            setShowThemeMenu(false);
                            if (opt.id === 'custom' && currentTab !== 'settings') {
                              onSelectTab('settings');
                            }
                          }}
                          style={{
                            color: isSelected ? 'var(--accent-gold)' : 'var(--text-main)',
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/10 font-semibold'
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: opt.dotColor }}
                            />
                            <span>{opt.name}</span>
                            <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-normal">({opt.tag})</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />}
                        </button>
                      );
                    })}

                    {/* Custom Saved Theme Presets Header & Items */}
                    {headerPresets.length > 0 && (
                      <>
                        <div 
                          style={{
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-muted)',
                          }}
                          className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider border-t mt-1.5"
                        >
                          自定义主题预设
                        </div>

                        {headerPresets.map((preset) => {
                          if (!preset || !preset.id) return null;
                          const isSelected = activePresetId === preset.id;
                          const dotBg = preset.colors?.accentColor || 'var(--accent-gold)';
                          return (
                            <button
                              key={preset.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                applyPreset(preset);
                                setShowThemeMenu(false);
                              }}
                              style={{
                                color: isSelected ? 'var(--accent-gold)' : 'var(--text-main)',
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/10 font-semibold'
                                  : 'hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                                  style={{ backgroundColor: dotBg }}
                                />
                                <span className="truncate max-w-[100px]">{preset.name || '自定义预设'}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-gold)' }} />}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Quick Add Button */}
            <button
              id="mobile-add-btn"
              onClick={onOpenAddModal}
              className="sm:hidden p-2 rounded-full active:scale-95 text-white shadow-xs cursor-pointer"
              style={{ backgroundColor: 'var(--accent-gold)' }}
              title="添加作品"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Search Input Bar (Visible when toggled on mobile) */}
        {showMobileSearch && (
          <div ref={mobileSearchContainerRef} className="sm:hidden pb-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-150 relative">
            <div className="relative flex items-center">
              <Search 
                className="w-4 h-4 absolute left-3 pointer-events-none transition-colors" 
                style={{ color: searchQuery || isSearchFocused ? 'var(--accent-gold)' : 'var(--text-muted)' }}
              />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (currentTab !== 'gallery' && currentTab !== 'diary' && currentTab !== 'favorites') {
                      onSelectTab('gallery');
                    }
                    setIsSearchFocused(false);
                  }
                }}
                placeholder="搜索作品、日记、日期"
                style={{
                  backgroundColor: 'var(--search-bg)',
                  borderColor: (searchQuery || isSearchFocused) ? 'var(--accent-gold)' : 'var(--card-border)',
                  color: 'var(--text-main)',
                  boxShadow: isSearchFocused ? '0 0 0 2px color-mix(in srgb, var(--accent-gold) 25%, transparent)' : undefined,
                }}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-full border placeholder-neutral-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    onSearchChange('');
                    setIsSearchFocused(false);
                  }}
                  style={{ color: 'var(--text-muted)' }}
                  className="absolute right-3 text-xs p-1 hover:opacity-80 transition-opacity cursor-pointer"
                  title="清除搜索内容"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Dual-Module Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="mt-1">
                {renderSearchResultsPanel()}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
