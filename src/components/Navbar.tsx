import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ViewTab, ThemeMode } from '../types';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: () => void;
  artworksCount: number;
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
}) => {
  const { theme, setTheme, savedPresets, applyPreset, activePresetId } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const headerPresets = (savedPresets || []).filter((p) => p && p.showInHeader);
  const activePreset = activePresetId ? savedPresets?.find((p) => p.id === activePresetId) : null;
  const currentThemeLabel = activePreset
    ? activePreset.name
    : THEME_OPTIONS.find((t) => t.id === theme)?.name || '主题外观';

  useEffect(() => {
    if (showMobileSearch && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: '首页', icon: <Home className="w-4 h-4" /> },
    { id: 'gallery', label: '作品库', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'favorites', label: '收藏', icon: <Star className="w-4 h-4" /> },
    { id: 'diary', label: '创作日志', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'stats', label: '创作统计', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: '设置', icon: <Settings className="w-4 h-4" /> },
  ];

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

          {/* Center Search Bar (Desktop / Tablet) */}
          <div className="hidden sm:block flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative flex items-center">
              <Search 
                className="w-4 h-4 absolute left-3 pointer-events-none transition-colors" 
                style={{ color: searchQuery ? 'var(--accent-gold)' : 'var(--text-muted)' }}
              />
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (currentTab !== 'gallery' && currentTab !== 'favorites') {
                    onSelectTab('gallery');
                  }
                }}
                placeholder="搜索作品名称、标签 (#人物、#夜景)..."
                style={{
                  backgroundColor: 'var(--search-bg)',
                  borderColor: searchQuery ? 'var(--accent-gold)' : 'var(--card-border)',
                  color: 'var(--text-main)',
                  boxShadow: searchQuery ? '0 0 0 2px color-mix(in srgb, var(--accent-gold) 25%, transparent)' : undefined,
                }}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-full border placeholder-neutral-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  style={{ color: 'var(--text-muted)' }}
                  className="absolute right-2.5 text-xs p-1 hover:opacity-80 transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Actions: Add Work, Theme, Search Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              id="mobile-search-toggle-btn"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
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
              title="搜索作品"
              aria-label="搜索作品"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick Add Artwork Button (Desktop) */}
            <button
              id="btn-add-artwork-top"
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-white"
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
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full border shadow-2xs hover:opacity-90 transition-all active:scale-95 text-xs font-medium"
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
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
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
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
              className="sm:hidden p-2 rounded-full active:scale-95 text-white shadow-xs"
              style={{ backgroundColor: 'var(--accent-gold)' }}
              title="添加作品"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Search Input Bar (Visible when toggled on mobile) */}
        {showMobileSearch && (
          <div className="sm:hidden pb-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="relative flex items-center">
              <Search 
                className="w-4 h-4 absolute left-3 pointer-events-none transition-colors" 
                style={{ color: searchQuery ? 'var(--accent-gold)' : 'var(--text-muted)' }}
              />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (currentTab !== 'gallery' && currentTab !== 'favorites') {
                    onSelectTab('gallery');
                  }
                }}
                placeholder="搜索作品名称、标签 (#人物、#夜景)..."
                style={{
                  backgroundColor: 'var(--search-bg)',
                  borderColor: searchQuery ? 'var(--accent-gold)' : 'var(--card-border)',
                  color: 'var(--text-main)',
                  boxShadow: searchQuery ? '0 0 0 2px color-mix(in srgb, var(--accent-gold) 25%, transparent)' : undefined,
                }}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-full border placeholder-neutral-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  style={{ color: 'var(--text-muted)' }}
                  className="absolute right-3 text-xs p-1 hover:opacity-80 transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar (Desktop / Tablet view: hidden on mobile since MobileBottomNav is used) */}
        <nav 
          id="navbar-tabs-container"
          style={{
            borderColor: 'var(--navbar-border, var(--card-border))',
          }}
          className="hidden md:flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-2 border-t"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-main)',
                      }
                    : {
                        color: 'var(--text-muted)',
                      }
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? 'shadow-xs font-semibold'
                    : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'gallery' && (
                  <span 
                    style={{
                      backgroundColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                    className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-mono"
                  >
                    {artworksCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
