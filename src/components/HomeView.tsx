import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  ArrowRight, 
  Sparkles, 
  FolderArchive, 
  Star, 
  Clock, 
  Calendar,
  Palette,
  Pin,
  Edit2,
  Check,
  Camera,
  X,
  Upload,
  RotateCcw,
  Sparkle,
  Paintbrush
} from 'lucide-react';
import { Artwork, DiaryEntry, ViewTab } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AVATAR_PRESETS, DEFAULT_AVATAR } from '../utils/avatarPresets';

interface HomeViewProps {
  artworks: Artwork[];
  diaries: DiaryEntry[];
  onOpenAddModal: () => void;
  onSelectTab: (tab: ViewTab) => void;
  onSelectArtwork: (artwork: Artwork) => void;
}

const DEFAULT_GREETING_TITLE = '你好，画师';
const DEFAULT_GREETING_SUBTITLE = '今天也来画点什么吧。灵感稍纵即逝，将每一个笔触与故事装入画匣。';
const DEFAULT_ARCHIVE_TITLE = '个人作品档案馆';
const DEFAULT_ARTIST_NAME = '莫奈画师';
const DEFAULT_ARTIST_SIGNATURE = '以画笔勾勒世界，用色彩记录生活 · 画室主理人 ✨';
const DEFAULT_ARTIST_STATUS = '创作中';
const DEFAULT_ARTIST_ROLE = '画室主理人';

export const HomeView: React.FC<HomeViewProps> = ({
  artworks,
  diaries,
  onOpenAddModal,
  onSelectTab,
  onSelectArtwork,
}) => {
  const { customColors, setCustomColors, displayMode } = useTheme();

  // Custom editable greetings
  const [greetingTitle, setGreetingTitle] = useState<string>(() => {
    return localStorage.getItem('art_vault_greeting_title') || DEFAULT_GREETING_TITLE;
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(greetingTitle);

  const [archiveTitle, setArchiveTitle] = useState<string>(() => {
    return localStorage.getItem('art_vault_archive_title') || DEFAULT_ARCHIVE_TITLE;
  });
  const [isEditingArchiveTitle, setIsEditingArchiveTitle] = useState(false);
  const [tempArchiveTitle, setTempArchiveTitle] = useState(archiveTitle);

  const [greetingSubtitle, setGreetingSubtitle] = useState<string>(() => {
    return localStorage.getItem('art_vault_greeting_subtitle') || DEFAULT_GREETING_SUBTITLE;
  });
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [tempSubtitle, setTempSubtitle] = useState(greetingSubtitle);

  // Avatar & Personalized Signature (Requirement 3 & 4)
  const [artistName, setArtistName] = useState<string>(() => {
    return localStorage.getItem('art_vault_artist_name') || DEFAULT_ARTIST_NAME;
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(artistName);

  const [artistSignature, setArtistSignature] = useState<string>(() => {
    return localStorage.getItem('art_vault_artist_signature') || DEFAULT_ARTIST_SIGNATURE;
  });
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const [tempSignature, setTempSignature] = useState(artistSignature);

  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('art_vault_artist_avatar') || DEFAULT_AVATAR;
  });
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Artist Status State
  const [artistStatus, setArtistStatus] = useState<string>(() => {
    return localStorage.getItem('art_vault_artist_status') || DEFAULT_ARTIST_STATUS;
  });
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState(artistStatus);

  // Editable Role (Requirement 6)
  const [artistRole, setArtistRole] = useState<string>(() => {
    return localStorage.getItem('art_vault_artist_role') || DEFAULT_ARTIST_ROLE;
  });
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [tempRole, setTempRole] = useState(artistRole);

  const handleSaveRole = () => {
    const val = tempRole.trim() || DEFAULT_ARTIST_ROLE;
    setArtistRole(val);
    localStorage.setItem('art_vault_artist_role', val);
    setIsEditingRole(false);
  };

  const handleSaveStatus = () => {
    const val = tempStatus.trim() || '创作中';
    setArtistStatus(val);
    localStorage.setItem('art_vault_artist_status', val);
    setIsEditingStatus(false);
  };

  const handleSaveTitle = () => {
    const val = tempTitle.trim() || DEFAULT_GREETING_TITLE;
    setGreetingTitle(val);
    localStorage.setItem('art_vault_greeting_title', val);
    setIsEditingTitle(false);
  };

  const handleSaveArchiveTitle = () => {
    const val = tempArchiveTitle.trim() || DEFAULT_ARCHIVE_TITLE;
    setArchiveTitle(val);
    localStorage.setItem('art_vault_archive_title', val);
    setIsEditingArchiveTitle(false);
  };

  const handleSaveSubtitle = () => {
    const val = tempSubtitle.trim() || DEFAULT_GREETING_SUBTITLE;
    setGreetingSubtitle(val);
    localStorage.setItem('art_vault_greeting_subtitle', val);
    setIsEditingSubtitle(false);
  };

  const handleSaveName = () => {
    const val = tempName.trim() || DEFAULT_ARTIST_NAME;
    setArtistName(val);
    localStorage.setItem('art_vault_artist_name', val);
    setIsEditingName(false);
  };

  const handleSaveSignature = () => {
    const val = tempSignature.trim() || DEFAULT_ARTIST_SIGNATURE;
    setArtistSignature(val);
    localStorage.setItem('art_vault_artist_signature', val);
    setIsEditingSignature(false);
  };

  const handleSelectAvatar = (url: string) => {
    setAvatarUrl(url);
    localStorage.setItem('art_vault_artist_avatar', url);
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        handleSelectAvatar(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Stats calculation
  const totalArtworks = artworks.length;
  
  // Current month's works
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearMonthPrefix = `${currentYear}-${currentMonth}`;
  const thisMonthArtworks = artworks.filter((a) => a.date.startsWith(currentYearMonthPrefix)).length;

  // Favorites
  const favoriteArtworks = artworks.filter((a) => a.isFavorite);

  // Recent artworks (top 6 sorted by pinned first, then date descending)
  const recentArtworks = [...artworks]
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date || b.updatedAt).getTime() - new Date(a.date || a.updatedAt).getTime();
    })
    .slice(0, 6);

  // Recent diary creation logs (top 4)
  const recentDiaries = [...diaries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-14 animate-in fade-in duration-300">
      
      {/* 3 & 4. Artist Profile Card (Avatar + Nickname + Signature) - Only shown in Default Mode */}
      {displayMode === 'default' && (
        <section 
          id="home-artist-profile-card"
          className="relative rounded-3xl p-6 sm:p-7 border shadow-xs transition-all animate-in fade-in duration-300 overflow-hidden"
          style={{
            backgroundColor: 'var(--content-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          {/* Subtle background art glow */}
          <div 
            className="absolute top-0 right-0 w-80 h-full opacity-10 pointer-events-none blur-2xl"
            style={{ backgroundColor: 'var(--accent-gold)' }}
          />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Left: Avatar with golden ring & centered status */}
            <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
              <div className="flex flex-col items-center justify-center shrink-0 min-w-[72px] sm:min-w-[80px]">
                <div className="relative group flex justify-center items-center">
                  <div 
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 shadow-sm overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-gold) 0%, color-mix(in srgb, var(--accent-gold) 40%, transparent) 100%)',
                    }}
                    title="点击更换画师头像"
                  >
                    <img
                      src={avatarUrl}
                      alt={artistName}
                      className="w-full h-full rounded-full object-cover bg-white dark:bg-neutral-800"
                    />
                    {/* Camera overlay hover */}
                    <div className="absolute inset-1 rounded-full bg-black/45 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4" />
                      <span className="text-[9px] mt-0.5 font-medium">换头像</span>
                    </div>
                  </div>
                </div>

                {/* Creative status indicator: Frameless, directly editable upon click, strictly centered under avatar */}
                <div className="w-full flex items-center justify-center text-center mt-1.5 min-h-[22px]">
                  {isEditingStatus ? (
                    <div className="flex items-center justify-center w-full">
                      <input
                        type="text"
                        value={tempStatus}
                        onChange={(e) => setTempStatus(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveStatus();
                          if (e.key === 'Escape') setIsEditingStatus(false);
                        }}
                        onBlur={handleSaveStatus}
                        autoFocus
                        maxLength={20}
                        className="text-center font-semibold text-xs bg-transparent border-b focus:outline-none px-1 py-0.5 max-w-[140px] sm:max-w-[180px]"
                        style={{
                          borderColor: 'var(--accent-gold)',
                          color: 'var(--accent-gold)',
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        setTempStatus(artistStatus);
                        setIsEditingStatus(true);
                      }}
                      className="group/status inline-flex items-center justify-center text-center cursor-pointer transition-opacity hover:opacity-85 select-none max-w-[140px] sm:max-w-[180px]"
                      title="点击直接修改创作状态"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 mr-1" />
                      <span 
                        className="text-xs font-semibold tracking-tight truncate text-center"
                        style={{ color: 'var(--accent-gold)' }}
                      >
                        {artistStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle: Nickname & Signature */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Editable Nickname */}
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') setIsEditingName(false);
                        }}
                        autoFocus
                        className="font-art-serif text-lg sm:text-xl font-bold rounded-lg px-2 py-0.5 border-2 focus:outline-none w-36 sm:w-48 bg-white dark:bg-[#181B22]"
                        style={{ borderColor: 'var(--accent-gold)', color: 'var(--text-main)' }}
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1.5 rounded-lg text-white transition-colors"
                        style={{ backgroundColor: 'var(--accent-gold)' }}
                        title="保存昵称"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        setTempName(artistName);
                        setIsEditingName(true);
                      }}
                      className="group/name inline-flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
                      title="点击修改画师昵称"
                    >
                      <h2 
                        className="font-art-serif text-xl sm:text-2xl font-bold tracking-tight"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {artistName}
                      </h2>
                      <Edit2 className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                    </div>
                  )}

                  {/* Studio Lead Badge - Editable (Requirement 5 & 6) */}
                  {isEditingRole ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={tempRole}
                        onChange={(e) => setTempRole(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRole();
                          if (e.key === 'Escape') setIsEditingRole(false);
                        }}
                        autoFocus
                        maxLength={16}
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5 border-2 focus:outline-none w-24"
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          borderColor: 'var(--accent-gold)',
                          color: 'var(--accent-gold)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveRole}
                        className="p-1 rounded-full text-white shadow-2xs hover:scale-105 transition-transform"
                        style={{ backgroundColor: 'var(--accent-gold)' }}
                        title="保存头衔"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempRole(artistRole);
                        setIsEditingRole(true);
                      }}
                      className="group/role inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                        color: 'var(--accent-gold)',
                      }}
                      title="点击修改头衔"
                    >
                      <Paintbrush className="w-3 h-3" />
                      <span>{artistRole}</span>
                    </button>
                  )}
                </div>

                {/* Editable Personal Signature */}
                {isEditingSignature ? (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <input
                      type="text"
                      value={tempSignature}
                      onChange={(e) => setTempSignature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveSignature();
                        if (e.key === 'Escape') setIsEditingSignature(false);
                      }}
                      autoFocus
                      className="text-xs sm:text-sm rounded-lg px-2.5 py-1 border-2 focus:outline-none w-full max-w-md bg-white dark:bg-[#181B22]"
                      style={{ borderColor: 'var(--accent-gold)', color: 'var(--text-main)' }}
                    />
                    <button
                      onClick={handleSaveSignature}
                      className="p-1.5 rounded-lg text-white transition-colors shrink-0"
                      style={{ backgroundColor: 'var(--accent-gold)' }}
                      title="保存签名"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p 
                    onClick={() => {
                      setTempSignature(artistSignature);
                      setIsEditingSignature(true);
                    }}
                    className="group/sig text-xs sm:text-sm font-light leading-relaxed cursor-pointer hover:opacity-85 inline-flex items-center gap-2 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                    title="点击修改个性签名"
                  >
                    <span>{artistSignature}</span>
                    <Edit2 className="w-3 h-3 text-neutral-400 opacity-0 group-hover/sig:opacity-100 transition-opacity shrink-0" />
                  </p>
                )}
              </div>
            </div>

            {/* Right: Quick Studio Tags & Add Button */}
            <div className="flex items-center gap-3 self-end sm:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                <span className="px-2.5 py-1 rounded-xl border" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-page)' }}>
                  已存档 <strong style={{ color: 'var(--text-main)' }}>{totalArtworks}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl border" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-page)' }}>
                  心仪 <strong style={{ color: 'var(--text-main)' }}>{favoriteArtworks.length}</strong>
                </span>
              </div>

              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0"
                style={{
                  backgroundColor: 'var(--accent-gold)',
                  color: '#FFFFFF',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>收纳新画</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Greeting Section */}
      <section id="home-hero-greeting" className="relative pt-2 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3 flex-1 max-w-2xl">
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors group/archive cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                color: 'var(--accent-gold)',
              }}
              onClick={() => {
                setTempArchiveTitle(archiveTitle);
                setIsEditingArchiveTitle(true);
              }}
              title="点击修改名称"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isEditingArchiveTitle ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={tempArchiveTitle}
                    onChange={(e) => setTempArchiveTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveArchiveTitle();
                      if (e.key === 'Escape') setIsEditingArchiveTitle(false);
                    }}
                    autoFocus
                    className="font-medium bg-transparent border-b outline-none w-32"
                    style={{ borderColor: 'var(--accent-gold)' }}
                  />
                  <Check 
                    className="w-3.5 h-3.5 cursor-pointer hover:scale-110" 
                    onClick={handleSaveArchiveTitle}
                  />
                </div>
              ) : (
                <span className="flex items-center gap-1">
                  {archiveTitle}
                  <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/archive:opacity-100 transition-opacity" />
                </span>
              )}
            </div>

            {/* Editable Greeting Title (follows standard text color) */}
            <div className="relative group">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    autoFocus
                    className="font-art-serif text-2xl sm:text-4xl font-bold tracking-tight border-2 rounded-xl px-3 py-1 focus:outline-none w-full shadow-sm"
                    style={{
                      backgroundColor: 'var(--content-bg)',
                      borderColor: 'var(--accent-gold)',
                      color: 'var(--text-main)',
                    }}
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-2.5 rounded-xl text-white active:scale-95 transition-all shrink-0"
                    style={{ backgroundColor: 'var(--accent-gold)' }}
                    title="保存"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <h1 
                    onClick={() => {
                      setTempTitle(greetingTitle);
                      setIsEditingTitle(true);
                    }}
                    title="点击即可直接修改问候语内容"
                    className="font-art-serif text-3xl sm:text-5xl font-bold tracking-tight leading-tight cursor-pointer hover:opacity-85 inline-flex items-center gap-3 transition-all"
                    style={{ color: 'var(--text-main)' }}
                  >
                    <span>{greetingTitle}</span>
                    <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-neutral-400" />
                  </h1>
                </div>
              )}
            </div>

            {/* Editable Subtitle / Motto (follows standard text color) */}
            <div className="relative group pt-1">
              {isEditingSubtitle ? (
                <div className="flex items-start gap-2 mt-1">
                  <textarea
                    rows={2}
                    value={tempSubtitle}
                    onChange={(e) => setTempSubtitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveSubtitle();
                      }
                      if (e.key === 'Escape') setIsEditingSubtitle(false);
                    }}
                    autoFocus
                    className="text-sm sm:text-base border-2 rounded-xl p-2.5 focus:outline-none w-full shadow-sm resize-none"
                    style={{
                      backgroundColor: 'var(--content-bg)',
                      borderColor: 'var(--accent-gold)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <button
                    onClick={handleSaveSubtitle}
                    className="p-2 rounded-xl text-white active:scale-95 transition-all shrink-0 mt-1"
                    style={{ backgroundColor: 'var(--accent-gold)' }}
                    title="保存"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p 
                    onClick={() => {
                      setTempSubtitle(greetingSubtitle);
                      setIsEditingSubtitle(true);
                    }}
                    title="点击即可直接修改寄语内容"
                    className="text-base sm:text-lg font-light max-w-xl cursor-pointer hover:opacity-85 inline-flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span>{greetingSubtitle}</span>
                    <Edit2 className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            id="btn-home-add-work"
            onClick={onOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold shadow-md hover:shadow-xl hover:scale-102 active:scale-98 transition-all shrink-0 group"
            style={{
              backgroundColor: 'var(--accent-gold)',
              color: '#FFFFFF',
            }}
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>添加作品</span>
          </button>
        </div>
      </section>

      {/* 1. 3 Core Stats Cards ("我的创作概览") - Styled with dynamic module colors */}
      <section id="home-stats-overview">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            我的创作概览
          </h2>
          <button
            onClick={() => onSelectTab('stats')}
            className="text-xs font-medium hover:underline flex items-center gap-1 transition-colors"
            style={{ color: 'var(--accent-gold)' }}
          >
            详细统计数据 <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Works Module */}
          <div 
            onClick={() => onSelectTab('gallery')}
            className="p-6 rounded-3xl border shadow-xs hover:shadow-md transition-all cursor-pointer group"
            style={{
              backgroundColor: 'var(--content-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3" style={{ color: 'var(--text-muted)' }}>
              <span className="text-xs font-medium">全部作品</span>
              <FolderArchive className="w-4 h-4 transition-colors" style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-art-serif text-4xl sm:text-5xl font-bold" style={{ color: 'var(--text-main)' }}>
                {totalArtworks}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>件原画/工程</span>
            </div>
          </div>

          {/* This Month's Works Module */}
          <div 
            onClick={() => onSelectTab('gallery')}
            className="p-6 rounded-3xl border shadow-xs hover:shadow-md transition-all cursor-pointer group"
            style={{
              backgroundColor: 'var(--content-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3" style={{ color: 'var(--text-muted)' }}>
              <span className="text-xs font-medium">本月创作</span>
              <Calendar className="w-4 h-4 transition-colors" style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-art-serif text-4xl sm:text-5xl font-bold" style={{ color: 'var(--text-main)' }}>
                {thisMonthArtworks}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>本月产出</span>
            </div>
          </div>

          {/* Favorite Works Module */}
          <div 
            onClick={() => onSelectTab('favorites')}
            className="p-6 rounded-3xl border shadow-xs hover:shadow-md transition-all cursor-pointer group"
            style={{
              backgroundColor: 'var(--content-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3" style={{ color: 'var(--text-muted)' }}>
              <span className="text-xs font-medium">收藏作品</span>
              <Star className="w-4 h-4 transition-colors" style={{ color: 'var(--accent-gold)', fill: 'var(--accent-gold)' }} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-art-serif text-4xl sm:text-5xl font-bold" style={{ color: 'var(--text-main)' }}>
                {favoriteArtworks.length}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>心仪之作</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Works Section - Styled with dynamic module colors */}
      <section id="home-recent-artworks">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-art-serif text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
              最近作品
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              近期的创作灵感与完成稿
            </p>
          </div>
          <button
            onClick={() => onSelectTab('gallery')}
            className="text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            进入完整作品库 ({totalArtworks}) <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentArtworks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {recentArtworks.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArtwork(art)}
                className="group relative flex flex-col rounded-2xl overflow-hidden border shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    style={{
                      transform: art.previewScale ? `scale(${art.previewScale / 100})` : undefined,
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Pinned & File Format Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {art.isPinned && (
                      <span 
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md text-white shadow-xs"
                        style={{ backgroundColor: 'var(--accent-gold)' }}
                      >
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        置顶
                      </span>
                    )}
                    {art.fileType === 'psd' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase shadow-xs">
                        PSD
                      </span>
                    )}
                    {art.fileType === 'ai' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-600 text-white uppercase shadow-xs">
                        AI
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                    <span className="text-[10px] text-white font-mono">
                      {art.width} × {art.height}
                    </span>
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 
                    className="font-art-serif text-xs font-bold truncate transition-colors"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {art.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{art.date.slice(5)}</span>
                    <span className="truncate max-w-[60px]">{art.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="p-10 rounded-3xl border-2 border-dashed text-center space-y-3"
            style={{
              backgroundColor: 'var(--content-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div 
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center transition-colors"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                color: 'var(--accent-gold)',
              }}
            >
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-medium" style={{ color: 'var(--text-main)' }}>画匣空空如也，静候佳作</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                立即上传您的插画、PSD工程、原画或草稿，开启艺术档案之旅！
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:scale-102 transition-all"
              style={{
                backgroundColor: 'var(--accent-gold)',
                color: '#FFFFFF',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加第一张作品</span>
            </button>
          </div>
        )}
      </section>

      {/* Recent Creation Logs ("最近创作笔记") - Styled with dynamic module colors */}
      <section id="home-recent-creation-diaries">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-art-serif text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
              最近创作笔记
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              记录色彩探索、光影感悟与创作心路
            </p>
          </div>
          <button
            onClick={() => onSelectTab('diary')}
            className="text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            查看全部日记 ({diaries.length}) <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentDiaries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentDiaries.map((entry) => {
              const formattedDate = entry.date ? entry.date.slice(5).replace('-', '.') : '';
              return (
                <div
                  key={entry.id}
                  onClick={() => onSelectTab('diary')}
                  className="p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
                      <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--accent-gold)' }}>
                        <Clock className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                      {entry.artworkTitle && (
                        <span>关联《{entry.artworkTitle}》</span>
                      )}
                    </div>
                    <h3 
                      className="font-art-serif text-base font-bold transition-colors"
                      style={{ color: 'var(--text-main)' }}
                    >
                      {entry.title}
                    </h3>
                    <p 
                      className="text-xs line-clamp-2 mt-2 leading-relaxed font-light"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {entry.content}
                    </p>
                  </div>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-3 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                      {entry.tags.map((t, i) => (
                        <span 
                          key={i} 
                          className="text-[10px] px-1.5 py-0.5 rounded border font-mono"
                          style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div 
            className="p-8 rounded-2xl border text-center text-xs"
            style={{
              backgroundColor: 'var(--content-bg)',
              borderColor: 'var(--card-border)',
              color: 'var(--text-muted)',
            }}
          >
            暂无创作日志，点击导航栏「创作日志」随时写下笔触思考。
          </div>
        )}
      </section>

      {/* Quote / Artist Space Bottom Banner - Styled with dynamic module colors */}
      <div 
        className="p-6 rounded-3xl border text-center space-y-1"
        style={{
          backgroundColor: 'var(--content-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <p className="font-art-serif text-sm italic" style={{ color: 'var(--text-main)' }}>
          “画布是思想的镜子，而画匣则是时间酿造的陈香。”
        </p>
        <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          画匣 · ART VAULT · 随心创作，安心存档
        </p>
      </div>

      {/* Avatar Selection & Upload Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95"
            style={{
              backgroundColor: 'var(--modal-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-2">
                <Sparkle className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                <h3 className="font-art-serif text-base font-bold" style={{ color: 'var(--text-main)' }}>
                  设置头像
                </h3>
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Avatar preview */}
            <div className="flex items-center gap-4 p-3 rounded-2xl border" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-page)' }}>
              <img
                src={avatarUrl}
                alt="当前头像"
                className="w-14 h-14 rounded-full border-2 border-amber-500 object-cover shadow-sm bg-white"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>当前生效头像</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  选择下方精选艺术家头像，或从本地上传专属图片。
                </p>
              </div>
            </div>

            {/* Preset Avatars Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                精选艺术风格头像
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {AVATAR_PRESETS.map((p) => {
                  const isCur = avatarUrl === p.svg;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectAvatar(p.svg)}
                      className="p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center group"
                      style={{
                        borderColor: isCur ? 'var(--accent-gold)' : 'var(--card-border)',
                        backgroundColor: isCur ? 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))' : 'var(--card-bg)',
                        boxShadow: isCur ? '0 0 0 1px var(--accent-gold)' : undefined,
                      }}
                    >
                      <img src={p.svg} alt={p.name} className="w-10 h-10 rounded-full group-hover:scale-105 transition-transform" />
                      <span className="text-[11px] font-medium truncate w-full" style={{ color: 'var(--text-main)' }}>
                        {p.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {p.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom upload & reset */}
            <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => avatarFileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:border-amber-500"
                style={{
                  backgroundColor: 'var(--content-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>上传本地图片</span>
              </button>

              <button
                onClick={() => handleSelectAvatar(DEFAULT_AVATAR)}
                className="py-2.5 px-3 rounded-xl border text-xs text-neutral-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                style={{ borderColor: 'var(--card-border)' }}
                title="重置为默认头像"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置</span>
              </button>
            </div>

            <div className="pt-1">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all"
                style={{ backgroundColor: 'var(--accent-gold)' }}
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
