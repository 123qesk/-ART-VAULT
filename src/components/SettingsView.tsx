import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Settings, 
  Info,
  Sliders,
  LayoutTemplate,
  Sparkles,
  User,
  Eye,
  EyeOff,
  Feather,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Layers,
  SlidersHorizontal,
  Maximize2,
  BookmarkPlus,
  Edit3,
  Play,
  VideoOff,
  Film,
  Box,
  SunMedium,
  Minimize2,
  ShieldCheck,
  FileJson,
  FolderArchive,
  AlertTriangle,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { ThemeMode, CustomThemeColors, DisplayMode, WallpaperConfig } from '../types';
import { useTheme, BUILTIN_THEMES_DEFAULT } from '../context/ThemeContext';
import { ThemeSlider } from './ThemeSlider';

interface SettingsViewProps {
  onExportBackup: () => void;
  onImportBackup: (jsonContent: string) => Promise<{ artworksCount: number; diariesCount: number; presetsCount?: number }>;
  onResetDefaults: () => Promise<void>;
  artworksCount: number;
  diariesCount: number;
}

interface PresetThemeOption {
  id: ThemeMode;
  name: string;
  desc: string;
  tag: string;
  bgPreview: string;
  cardPreview: string;
  accentPreview: string;
}

const PRESET_THEMES: PresetThemeOption[] = [
  {
    id: 'ivory',
    name: '雅致象牙',
    desc: '温暖米白纸质底色与黄铜古典金，温润如羊皮纸画册。',
    tag: '经典复古',
    bgPreview: '#F7F3EB',
    cardPreview: '#FFFDF9',
    accentPreview: '#B4783E',
  },
  {
    id: 'pure_white',
    name: '纯粹艺术白',
    desc: '极简画廊雪白画布，还原作品纯粹色彩与黑白对比。',
    tag: '当代极简',
    bgPreview: '#FFFFFF',
    cardPreview: '#FAFAFA',
    accentPreview: '#374151',
  },
  {
    id: 'dark',
    name: '深邃夜室',
    desc: '沉浸式暗黑数码画室，防疲劳高对比度荧幕展示。',
    tag: '夜间沉浸',
    bgPreview: '#0C0E14',
    cardPreview: '#141822',
    accentPreview: '#F59E0B',
  },
  {
    id: 'pink',
    name: '樱漫工坊',
    desc: '柔和少女粉与暖玫红调，适合日系轻柔、可爱插画。',
    tag: '治愈柔粉',
    bgPreview: '#FFF5F7',
    cardPreview: '#FFFFFF',
    accentPreview: '#EC4899',
  },
  {
    id: 'pixel',
    name: '极客像素绿',
    desc: '暗夜赛博微光，青苔绿与终端色调，适合游戏原画与像素风。',
    tag: '赛博光影',
    bgPreview: '#0C1512',
    cardPreview: '#13241D',
    accentPreview: '#10B981',
  },
  {
    id: 'custom',
    name: '自由调色盘',
    desc: '完全由您自定义每个界面的色彩、底色与高光。',
    tag: '完全定制',
    bgPreview: '#F3F4F6',
    cardPreview: '#FFFFFF',
    accentPreview: '#6366F1',
  },
];

// Quick color palette inspirations
const COLOR_PALETTE_PRESETS: { name: string; bgPage: string; cardBg: string; navbarBg: string; accentColor: string }[] = [
  { name: '暮光群青', bgPage: '#F0F4F8', cardBg: '#FFFFFF', navbarBg: '#E9EFF6', accentColor: '#2563EB' },
  { name: '青竹墨韵', bgPage: '#F3F6F4', cardBg: '#FFFFFF', navbarBg: '#EBF1ED', accentColor: '#059669' },
  { name: '法式焦糖', bgPage: '#FDF8F3', cardBg: '#FFFDF9', navbarBg: '#F8F1E7', accentColor: '#D97706' },
  { name: '紫藤薄雾', bgPage: '#F6F4F9', cardBg: '#FFFFFF', navbarBg: '#EFEBF5', accentColor: '#7C3AED' },
  { name: '胭霞胭脂', bgPage: '#FDF2F4', cardBg: '#FFFFFF', navbarBg: '#FCE7EB', accentColor: '#E11D48' },
];

// Quick module color recommendations
const MODULE_COLOR_PRESETS = [
  { name: '纯净雅白', cardBg: '#FFFFFF', cardBorder: '#E5E7EB' },
  { name: '象牙温润', cardBg: '#FFFDF9', cardBorder: '#E3DCD0' },
  { name: '云阶清灰', cardBg: '#F8FAFC', cardBorder: '#E2E8F0' },
  { name: '暖阳奶黄', cardBg: '#FEFCE8', cardBorder: '#FEF08A' },
  { name: '蜜桃甘露', cardBg: '#FFF7ED', cardBorder: '#FFEDD5' },
  { name: '薄樱暖粉', cardBg: '#FFF5F7', cardBorder: '#FCE7F0' },
  { name: '暮色浆果', cardBg: '#FAF4F7', cardBorder: '#EED9E4' },
  { name: '淡紫幽兰', cardBg: '#FAF5FF', cardBorder: '#E9D5FF' },
  { name: '清凉薄荷', cardBg: '#F0FDFA', cardBorder: '#CCFBF1' },
  { name: '浅草嫩绿', cardBg: '#F0FDF4', cardBorder: '#DCFCE7' },
  { name: '灰苔青岫', cardBg: '#F2F7F4', cardBorder: '#D7E5DC' },
  { name: '冰川澄蓝', cardBg: '#F0F9FF', cardBorder: '#E0F2FE' },
  { name: '远山黛蓝', cardBg: '#F0F4F8', cardBorder: '#D3DEEA' },
  { name: '雾霾烟蓝', cardBg: '#F1F5F9', cardBorder: '#CBD5E1' },
  { name: '深空暗灰', cardBg: '#1C2028', cardBorder: '#2E3544' },
];



export const SettingsView: React.FC<SettingsViewProps> = ({
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  artworksCount,
  diariesCount,
}) => {
  const { 
    theme, 
    setTheme, 
    customColors, 
    setCustomColors, 
    resetCustomColors, 
    isThemeCustomized,
    displayMode,
    setDisplayMode,
    wallpaper,
    setWallpaper,
    removeWallpaper,
    autoPlayMedia,
    setAutoPlayMedia,
    fontSize,
    setFontSize,
    savedPresets,
    activePresetId,
    addPreset,
    updatePreset,
    deletePreset,
    applyPreset,
  } = useTheme();

  const [importStatus, setImportStatus] = useState<string>('');
  const [wallpaperUploadStatus, setWallpaperUploadStatus] = useState<string>('');
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showInHeaderInput, setShowInHeaderInput] = useState(true);
  const [presetToast, setPresetToast] = useState<string | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement | null>(null);

  const activePreset = PRESET_THEMES.find(p => p.id === theme || (p.id === 'ivory' && theme === 'light')) || PRESET_THEMES[0];

  const handleWallpaperFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setWallpaperUploadStatus('请上传有效的图片(PNG/JPG/WebP/GIF/SVG)或视频(MP4/WebM)文件');
      setTimeout(() => setWallpaperUploadStatus(''), 4000);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const url = ev.target?.result as string;
        await setWallpaper({
          type: isVideo ? 'video' : 'image',
          url,
          name: file.name,
          opacity: wallpaper.opacity !== undefined ? wallpaper.opacity : 85,
          blur: wallpaper.blur || 0,
          fit: wallpaper.fit || 'cover',
        });
        setWallpaperUploadStatus(`已成功应用自定义壁纸: ${file.name}`);
        setTimeout(() => setWallpaperUploadStatus(''), 3500);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setWallpaperUploadStatus(`上传失败: ${err.message}`);
    }
  };

  const processBackupFile = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setImportStatus('请上传 .json 格式的画匣备份文件');
      setTimeout(() => setImportStatus(''), 4000);
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const content = ev.target?.result as string;
          const result = await onImportBackup(content);
          const parts = [`${result.artworksCount} 件作品`];
          if (result.diariesCount) parts.push(`${result.diariesCount} 篇日记`);
          if (result.presetsCount) parts.push(`${result.presetsCount} 个美化预设`);
          setImportStatus(`成功恢复备份：${parts.join('、')}！`);
          setTimeout(() => setImportStatus(''), 5000);
        } catch (err: any) {
          setImportStatus(`导入失败: ${err.message || '文件格式不正确'}`);
          setTimeout(() => setImportStatus(''), 6000);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setImportStatus(`读取文件失败: ${err.message}`);
      setTimeout(() => setImportStatus(''), 4000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processBackupFile(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-2 transition-colors"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
            borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
            color: 'var(--accent-gold)',
          }}
        >
          <Settings className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
          <span>画匣系统设置与模式配置</span>
        </div>
        <h1 className="font-art-serif text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
          设置与偏好
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          管理首页展示模式、界面主体模块色彩、顶栏美化及本地数据库备份。
        </p>
      </div>

      {importStatus && (
        <div 
          className="p-4 rounded-2xl border text-xs flex items-center gap-2 transition-colors"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
            borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
            color: 'var(--accent-gold)',
          }}
        >
          <Info className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-gold)' }} />
          <span>{importStatus}</span>
        </div>
      )}

      {/* 4. 模式选择模块 (Mode Selection: 默认 vs 简洁) */}
      <section 
        id="settings-mode-selection"
        className="p-6 rounded-3xl border shadow-xs space-y-4"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-art-serif text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <LayoutTemplate className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span>模式选择</span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              配置首页排版风格。选择“默认模式”展示头像与个性签名；选择“简洁模式”则专注作品与创作数据。
            </p>
          </div>
          <span 
            className="text-xs px-2.5 py-1 rounded-full font-medium border transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
              color: 'var(--accent-gold)',
            }}
          >
            当前：{displayMode === 'default' ? '默认模式' : '简洁模式'}
          </span>
        </div>

        {/* Two Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Default Mode Card */}
          <div
            onClick={() => setDisplayMode('default')}
            className="p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xs"
            style={{
              backgroundColor: displayMode === 'default' ? 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))' : 'var(--card-bg)',
              borderColor: displayMode === 'default' ? 'var(--accent-gold)' : 'var(--card-border)',
              boxShadow: displayMode === 'default' ? '0 0 0 1px var(--accent-gold)' : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                    默认模式
                  </h3>
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium border transition-colors"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    展示头像与签名
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  首页展示艺术家专属头像、画室主理人昵称与个性签名，呈现完整的画师主页艺术风貌。
                </p>
              </div>
              {displayMode === 'default' && (
                <div 
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Visual Mini Preview for Default Mode */}
            <div 
              className="p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-page)', 
                borderColor: displayMode === 'default' 
                  ? 'color-mix(in srgb, var(--accent-gold) 40%, var(--card-border))' 
                  : 'var(--card-border)' 
              }}
            >
              <span 
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors"
                style={{ 
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 20%, transparent)',
                  color: 'var(--accent-gold)',
                }}
              >
                🎨
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[11px] truncate" style={{ color: 'var(--text-main)' }}>画师 · 画室主理人</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>以画笔勾勒世界，用色彩记录生活 ✨</p>
              </div>
              <span 
                className="text-[10px] font-mono shrink-0 flex items-center gap-0.5 font-medium transition-colors"
                style={{ color: 'var(--accent-gold)' }}
              >
                <Eye className="w-3 h-3" style={{ color: 'var(--accent-gold)' }} /> 开启
              </span>
            </div>
          </div>

          {/* Minimal Mode Card */}
          <div
            onClick={() => setDisplayMode('minimal')}
            className="p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xs"
            style={{
              backgroundColor: displayMode === 'minimal' ? 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))' : 'var(--card-bg)',
              borderColor: displayMode === 'minimal' ? 'var(--accent-gold)' : 'var(--card-border)',
              boxShadow: displayMode === 'minimal' ? '0 0 0 1px var(--accent-gold)' : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                    简洁模式
                  </h3>
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium border transition-colors"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    隐藏头像与签名
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  隐藏首页头像与个性签名卡片，界面视觉更加轻盈克制，首屏直接聚焦艺术品与创作数据。
                </p>
              </div>
              {displayMode === 'minimal' && (
                <div 
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Visual Mini Preview for Minimal Mode */}
            <div 
              className="p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-page)', 
                borderColor: displayMode === 'minimal' 
                  ? 'color-mix(in srgb, var(--accent-gold) 40%, var(--card-border))' 
                  : 'var(--card-border)' 
              }}
            >
              <span 
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{ 
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 20%, transparent)',
                  color: 'var(--accent-gold)',
                }}
              >
                <Feather className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[11px] truncate" style={{ color: 'var(--text-main)' }}>你好，画师</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>灵感稍纵即逝，将每一个笔触装入画匣</p>
              </div>
              <span 
                className="text-[10px] font-mono shrink-0 flex items-center gap-0.5 font-medium transition-colors"
                style={{ color: 'var(--accent-gold)' }}
              >
                <EyeOff className="w-3 h-3" style={{ color: 'var(--accent-gold)' }} /> 已隐
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Video & Animated GIF Auto-Play Management */}
      <section 
        id="settings-autoplay-management"
        className="p-6 rounded-3xl border shadow-xs space-y-4"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-art-serif text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Film className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span>动态视频管理</span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              控制页面列表中 MP4 动态视频与动图 GIF 的播放行为。关闭时仅展示静态封面，不自动播放。
            </p>
          </div>
          <span 
            className="text-xs px-2.5 py-1 rounded-full font-medium border transition-colors self-start sm:self-auto shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
              color: 'var(--accent-gold)',
            }}
          >
            当前：{autoPlayMedia ? '自动播放' : '仅静态封面'}
          </span>
        </div>

        {/* Two Mode Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Auto-Play Enabled Card */}
          <div
            onClick={() => setAutoPlayMedia(true)}
            className="p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xs"
            style={{
              backgroundColor: autoPlayMedia ? 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))' : 'var(--card-bg)',
              borderColor: autoPlayMedia ? 'var(--accent-gold)' : 'var(--card-border)',
              boxShadow: autoPlayMedia ? '0 0 0 1px var(--accent-gold)' : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" style={{ color: 'var(--accent-gold)' }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                    自动播放模式
                  </h3>
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium border transition-colors"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    默认开启
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  开启时，视频与 GIF 动图在画廊和列表中直接自动循环播放，动态呈现场景作品。
                </p>
              </div>
              {autoPlayMedia && (
                <div 
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
              )}
            </div>
          </div>

          {/* Auto-Play Disabled Card */}
          <div
            onClick={() => setAutoPlayMedia(false)}
            className="p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xs"
            style={{
              backgroundColor: !autoPlayMedia ? 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))' : 'var(--card-bg)',
              borderColor: !autoPlayMedia ? 'var(--accent-gold)' : 'var(--card-border)',
              boxShadow: !autoPlayMedia ? '0 0 0 1px var(--accent-gold)' : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <VideoOff className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                    仅显示静态封面
                  </h3>
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium border transition-colors"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    省流防打扰
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  关闭时，视频与 GIF 动图在页面中仅显示静止封面，不会自动播放，静谧且省流。
                </p>
              </div>
              {!autoPlayMedia && (
                <div 
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Custom Font Size Adjustment Section */}
      <section 
        id="settings-font-size"
        className="p-6 rounded-3xl border shadow-xs space-y-5"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-art-serif text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span>自定义字号大小</span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              根据视觉习惯调整基准字号，实时提升全站标题、画廊作品与日记的阅读舒适度。
            </p>
          </div>
          <button
            onClick={() => setFontSize(16)}
            className="text-xs hover:text-amber-600 flex items-center gap-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置为默认字号</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Slider Controls */}
          <ThemeSlider
            label="拖动滑块调整字号基准"
            value={fontSize}
            onChange={(val) => setFontSize(val)}
            min={12}
            max={22}
            step={1}
            unit="px"
            showReset={true}
            defaultValue={16}
            onReset={() => setFontSize(16)}
            description="拖动滑块调节基准字号，点击右侧数值可直接键盘输入自定义大小 (12px ~ 22px)"
          />

          {/* Live Text Preview Box */}
          <div 
            className="p-5 rounded-2xl border space-y-1.5 transition-all"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--card-border)',
              fontSize: `${fontSize}px` 
            }}
          >
            <div className="font-art-serif font-bold tracking-wide" style={{ color: 'var(--text-main)' }}>
              “画匣 · 灵感与时间的陈香”
            </div>
            <p className="text-[0.85em] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              实时字号预览：在此调控全站渲染尺寸，作品标题、标签提示与创作日记将自动依照此缩放比例舒展呈现。
            </p>
          </div>
        </div>
      </section>

      {/* 1 & 2. Theme Setting with Presets, Navbar & Module Custom Color Pickers */}
      <section 
        id="settings-theme-customizer"
        className="p-6 rounded-3xl border shadow-xs space-y-5"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-art-serif text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Palette className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span>界面主题与模块色彩外观</span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              内置精选艺术质感美化预设，并支持自定义微调主体模块、顶栏、寄语及背景色彩。
            </p>
          </div>
          {(isThemeCustomized || theme === 'custom') && (
            <button
              onClick={resetCustomColors}
              className="text-xs hover:text-amber-600 flex items-center gap-1 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="重置当前主题为出厂预设颜色"
            >
              <RotateCcw className="w-3 h-3" />
              <span>恢复预设色彩</span>
            </button>
          )}
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {PRESET_THEMES.map((preset) => {
            const isSelected = theme === preset.id || (preset.id === 'ivory' && theme === 'light');
            return (
              <div
                key={preset.id}
                onClick={() => setTheme(preset.id)}
                className="p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xs"
                style={{
                  backgroundColor: isSelected ? 'color-mix(in srgb, var(--accent-gold) 6%, var(--card-bg))' : 'var(--card-bg)',
                  borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
                  boxShadow: isSelected ? '0 0 0 1px var(--accent-gold)' : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                        {preset.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {preset.tag}
                      </span>
                      {isSelected && isThemeCustomized && (
                        <span 
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded border transition-colors"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                            color: 'var(--accent-gold)',
                          }}
                        >
                          已自定义
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {preset.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div 
                      className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: 'var(--accent-gold)' }}
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Color preview swatches */}
                <div className="flex items-center gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <span
                    className="w-5 h-5 rounded-md border border-black/10 shadow-xs shrink-0"
                    style={{ backgroundColor: isSelected ? customColors.bgPage : preset.bgPreview }}
                    title="背景色"
                  />
                  <span
                    className="w-5 h-5 rounded-md border border-black/10 shadow-xs shrink-0"
                    style={{ backgroundColor: isSelected ? (customColors.navbarBg || customColors.cardBg) : preset.cardPreview }}
                    title="顶栏色"
                  />
                  <span
                    className="w-5 h-5 rounded-md border border-black/10 shadow-xs shrink-0"
                    style={{ backgroundColor: isSelected ? customColors.cardBg : preset.cardPreview }}
                    title="主体模块卡片色"
                  />
                  <span
                    className="w-5 h-5 rounded-md border border-black/10 shadow-xs shrink-0"
                    style={{ backgroundColor: isSelected ? customColors.accentColor : preset.accentPreview }}
                    title="强调色"
                  />
                  <span className="text-[11px] font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
                    {isSelected && isThemeCustomized ? '已调色' : (preset.id === 'custom' ? '自由调配' : '预置调色')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 1. 主体模块配色专属快捷推荐 (Requirement 1: 主体的模块颜色也可以自定义喜欢的颜色，选择的部分为模块) */}
        <div 
          className="p-4 rounded-2xl border space-y-2.5"
          style={{
            backgroundColor: 'var(--bg-page)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
              <span>主体模块底色快捷挑选：</span>
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              一键更换全站概览、作品卡、日记卡等主体模块底色与分割线
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {MODULE_COLOR_PRESETS.map((m) => {
              const isCur = customColors.cardBg.toLowerCase() === m.cardBg.toLowerCase();
              return (
                <button
                  key={m.name}
                  onClick={() => setCustomColors({ cardBg: m.cardBg, cardBorder: m.cardBorder })}
                  className="p-2 rounded-xl border flex flex-col items-center gap-1 transition-all"
                  style={{
                    backgroundColor: m.cardBg,
                    borderColor: isCur ? 'var(--accent-gold)' : m.cardBorder,
                    boxShadow: isCur ? '0 0 0 2px var(--accent-gold)' : undefined,
                  }}
                >
                  <span 
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: m.cardBg }}
                  />
                  <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200">
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Custom Color Editor */}
        <div 
          className="p-5 rounded-2xl border space-y-5 animate-in fade-in"
          style={{
            backgroundColor: 'var(--bg-page)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--card-border)' }}>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                <span>精细化色彩调色盘（当前主题：{activePreset.name}）</span>
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                自定义主体模块、顶栏、问候语及寄语各项色彩，实时修改即时生效，持久保存在浏览器。
              </p>
            </div>

            {/* Quick Inspiration Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>全套速配:</span>
              {COLOR_PALETTE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setCustomColors(p)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium border hover:border-amber-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Pickers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* 1. 主体模块（卡片）底色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5 transition-all focus-within:ring-1 focus-within:ring-[var(--accent-gold)] focus-within:border-[var(--accent-gold)]"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--accent-gold)',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent-gold) 40%, transparent)',
              }}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold block" style={{ color: 'var(--accent-gold)' }}>
                  主体模块颜色
                </label>
                <span 
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium border transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                    color: 'var(--accent-gold)',
                  }}
                >
                  卡片/模块
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColors.cardBg}
                  onChange={(e) => setCustomColors({ cardBg: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColors.cardBg}
                  onChange={(e) => setCustomColors({ cardBg: e.target.value })}
                  className="w-full text-xs font-mono px-2 py-1 rounded border focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                  style={{ 
                    backgroundColor: 'var(--bg-page)', 
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, var(--card-border))', 
                    color: 'var(--text-main)' 
                  }}
                />
              </div>
            </div>

            {/* 2. 顶栏背景色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5 transition-all hover:border-[var(--accent-gold)]/60 focus-within:ring-1 focus-within:ring-[var(--accent-gold)] focus-within:border-[var(--accent-gold)]"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                顶栏背景色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColors.navbarBg || customColors.cardBg}
                  onChange={(e) => setCustomColors({ navbarBg: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColors.navbarBg || customColors.cardBg}
                  onChange={(e) => setCustomColors({ navbarBg: e.target.value })}
                  className="w-full text-xs font-mono px-2 py-1 rounded border focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 3. 页面底色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5 transition-all hover:border-[var(--accent-gold)]/60 focus-within:ring-1 focus-within:ring-[var(--accent-gold)] focus-within:border-[var(--accent-gold)]"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                页面底色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColors.bgPage}
                  onChange={(e) => setCustomColors({ bgPage: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColors.bgPage}
                  onChange={(e) => setCustomColors({ bgPage: e.target.value })}
                  className="w-full text-xs font-mono px-2 py-1 rounded border focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 4. 正文主字色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5 transition-all hover:border-[var(--accent-gold)]/60 focus-within:ring-1 focus-within:ring-[var(--accent-gold)] focus-within:border-[var(--accent-gold)]"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                常规正文字色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColors.textMain}
                  onChange={(e) => setCustomColors({ textMain: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColors.textMain}
                  onChange={(e) => setCustomColors({ textMain: e.target.value })}
                  className="w-full text-xs font-mono px-2 py-1 rounded border focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 5. 模块边框分割线 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5 transition-all hover:border-[var(--accent-gold)]/60 focus-within:ring-1 focus-within:ring-[var(--accent-gold)] focus-within:border-[var(--accent-gold)]"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                模块边框分割线
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColors.cardBorder}
                  onChange={(e) => setCustomColors({ cardBorder: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColors.cardBorder}
                  onChange={(e) => setCustomColors({ cardBorder: e.target.value })}
                  className="w-full text-xs font-mono px-2 py-1 rounded border focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 6. 艺术强调色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5 transition-all hover:border-[var(--accent-gold)]/60 focus-within:ring-1 focus-within:ring-[var(--accent-gold)] focus-within:border-[var(--accent-gold)]"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                艺术强调色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColors.accentColor}
                  onChange={(e) => setCustomColors({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColors.accentColor}
                  onChange={(e) => setCustomColors({ accentColor: e.target.value })}
                  className="w-full text-xs font-mono px-2 py-1 rounded border focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>
          </div>

          {/* Theme Style & Granular Opacity Controls */}
          <div className="space-y-4">
            {/* Style Selector */}
            <div 
              className="p-5 rounded-2xl border space-y-4"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    <span>整体质感风格</span>
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    实时切换全局视觉层级质感，微光、毛玻璃、立体拟态与极简纯平已深度适配全站卡片与导航
                  </p>
                </div>
                <span 
                  className="self-start sm:self-auto text-xs px-2.5 py-1 rounded-full font-mono font-medium border"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                    color: 'var(--accent-gold)'
                  }}
                >
                  当前：{
                    customColors.themeStyle === 'glass' ? '毛玻璃 (Glass)' :
                    customColors.themeStyle === 'neumorphism' ? '立体拟态 (Neumorphic)' :
                    customColors.themeStyle === 'flat' ? '极简纯平 (Flat)' : '默认常规微光'
                  }
                </span>
              </div>

              {/* Enhanced Interactive 4 Styles Showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {[
                  { 
                    id: 'default', 
                    label: '默认常规', 
                    enLabel: 'Default Elevation',
                    desc: '细腻柔和微光与适度景深阴影，经久耐看',
                    icon: SunMedium,
                    renderPreview: (selected: boolean) => (
                      <div 
                        className="w-full h-12 rounded-lg border p-2 flex items-center justify-between transition-all"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: selected ? 'var(--accent-gold)' : 'var(--card-border)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--accent-gold)' }} />
                          <span className="w-12 h-1.5 rounded-full opacity-60" style={{ backgroundColor: 'var(--text-main)' }} />
                        </div>
                        <span className="w-5 h-1.5 rounded-full opacity-40" style={{ backgroundColor: 'var(--text-muted)' }} />
                      </div>
                    )
                  },
                  { 
                    id: 'glass', 
                    label: '毛玻璃', 
                    enLabel: 'Glassmorphism',
                    desc: '双层高透模糊与镜面晶莹光晕，配合壁纸层次分明',
                    icon: Layers,
                    renderPreview: (selected: boolean) => (
                      <div 
                        className="relative w-full h-12 rounded-lg border p-2 flex items-center justify-between overflow-hidden transition-all"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, rgba(255, 255, 255, 0.2))',
                          backdropFilter: 'blur(12px)',
                          borderColor: selected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.5)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.8)',
                        }}
                      >
                        <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/40 to-transparent blur-xs pointer-events-none" />
                        <div className="flex items-center gap-1.5 relative z-10">
                          <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white/80" style={{ backgroundColor: 'var(--accent-gold)' }} />
                          <span className="w-12 h-1.5 rounded-full opacity-80 bg-white/70" />
                        </div>
                        <span className="w-5 h-1.5 rounded-full opacity-70 bg-white/50 relative z-10" />
                      </div>
                    )
                  },
                  { 
                    id: 'neumorphism', 
                    label: '立体拟态', 
                    enLabel: 'Neumorphism',
                    desc: '凸起与内嵌双向光影浮雕，极具触控实物触感',
                    icon: Box,
                    renderPreview: (selected: boolean) => (
                      <div 
                        className="w-full h-12 rounded-lg border p-2 flex items-center justify-between transition-all"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--card-bg) 95%, #cbd5e1)',
                          borderColor: selected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.65)',
                          boxShadow: '3px 3px 8px rgba(0,0,0,0.12), -3px -3px 8px rgba(255,255,255,0.85)',
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                            style={{ 
                              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.2), inset -1px -1px 2px rgba(255,255,255,0.7)',
                              color: 'var(--accent-gold)'
                            }}
                          >
                            ●
                          </span>
                          <span className="w-12 h-1.5 rounded-full opacity-50" style={{ backgroundColor: 'var(--text-main)' }} />
                        </div>
                        <span 
                          className="px-1.5 py-0.5 rounded text-[8px] font-mono"
                          style={{ 
                            boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.15), inset -1px -1px 2px rgba(255,255,255,0.8)',
                            color: 'var(--text-muted)'
                          }}
                        >
                          3D
                        </span>
                      </div>
                    )
                  },
                  { 
                    id: 'flat', 
                    label: '极简纯平', 
                    enLabel: 'Bauhaus Flat',
                    desc: '彻底移除外阴影与光晕，极度清爽的纯色平面几何',
                    icon: Minimize2,
                    renderPreview: (selected: boolean) => (
                      <div 
                        className="w-full h-12 rounded-md border p-2 flex items-center justify-between transition-all"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: selected ? 'var(--accent-gold)' : 'var(--card-border)',
                          boxShadow: 'none',
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-none border border-current" style={{ color: 'var(--accent-gold)' }} />
                          <span className="w-12 h-1 rounded-none opacity-60" style={{ backgroundColor: 'var(--text-main)' }} />
                        </div>
                        <span className="w-5 h-1 rounded-none opacity-40" style={{ backgroundColor: 'var(--text-muted)' }} />
                      </div>
                    )
                  }
                ].map(style => {
                  const isSelected = (customColors.themeStyle || 'default') === style.id;
                  const IconComp = style.icon;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setCustomColors({ themeStyle: style.id as any })}
                      className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden group ${
                        isSelected 
                          ? 'shadow-md scale-[1.01]' 
                          : 'hover:border-amber-500/50 hover:shadow-xs'
                      }`}
                      style={{
                        backgroundColor: isSelected 
                          ? 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))' 
                          : 'var(--bg-page)',
                        borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
                        color: 'var(--text-main)',
                        boxShadow: isSelected 
                          ? '0 0 0 1.5px var(--accent-gold), 0 6px 18px color-mix(in srgb, var(--accent-gold) 15%, transparent)' 
                          : undefined
                      }}
                    >
                      {/* Top Row: Icon + Name + Selection Indicator */}
                      <div className="flex items-start justify-between gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-1.5 rounded-lg shrink-0 transition-colors"
                            style={{
                              backgroundColor: isSelected 
                                ? 'var(--accent-gold)' 
                                : 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                              color: isSelected ? '#FFFFFF' : 'var(--accent-gold)',
                            }}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold">{style.label}</span>
                              {'badge' in style && Boolean((style as any).badge) && (
                                <span 
                                  className="text-[9px] px-1 py-0.2 rounded font-medium"
                                  style={{
                                    backgroundColor: isSelected
                                      ? 'color-mix(in srgb, var(--accent-gold) 20%, transparent)'
                                      : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)',
                                  }}
                                >
                                  {(style as any).badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] block font-mono opacity-50" style={{ color: 'var(--text-muted)' }}>
                              {style.enLabel}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: 'var(--accent-gold)', color: '#FFFFFF' }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border opacity-30 group-hover:opacity-60" style={{ borderColor: 'var(--card-border)' }} />
                        )}
                      </div>

                      {/* Visual Texture Mini Preview */}
                      <div className="w-full pt-0.5">
                        {style.renderPreview(isSelected)}
                      </div>

                      {/* Description */}
                      <span className="text-[11px] leading-relaxed opacity-75" style={{ color: 'var(--text-muted)' }}>
                        {style.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Granular Opacities for Every Part */}
            <div 
              className="p-5 rounded-2xl border space-y-4"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                    <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    <span>模块独立透明度自定义</span>
                  </h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    自由调整全站各个独立区域的透明度，配合自定义壁纸可获得通透半透明与层叠质感
                  </p>
                </div>
                <button
                  onClick={() => setCustomColors({
                    pageOpacity: 100,
                    contentOpacity: 100,
                    cardOpacity: 100,
                    navbarOpacity: 100,
                    dockOpacity: 100,
                    modalOpacity: 100,
                    searchOpacity: 100,
                    badgeOpacity: 100,
                  })}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  重置为 100%
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {/* 0. 页面底色透明度 */}
                <ThemeSlider
                  label="页面底色透明度"
                  value={customColors.pageOpacity !== undefined ? customColors.pageOpacity : 100}
                  onChange={(val) => setCustomColors({ pageOpacity: val })}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  description="网页最底层全屏背景色，调低可透出壁纸"
                />

                {/* 1. 主体模块背景透明度 */}
                <ThemeSlider
                  label="主体模块背景透明度"
                  value={customColors.contentOpacity !== undefined ? customColors.contentOpacity : 100}
                  onChange={(val) => setCustomColors({ contentOpacity: val })}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  description="主体框架、作品分类栏、日记容器与模式选择"
                />

                {/* 2. 模块与卡片 */}
                <ThemeSlider
                  label="模块卡片透明度"
                  value={customColors.cardOpacity !== undefined ? customColors.cardOpacity : 100}
                  onChange={(val) => setCustomColors({ cardOpacity: val })}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  description="画作卡片、日记模块与统计看板"
                />

                {/* 2. 顶部导航栏 */}
                <ThemeSlider
                  label="顶部导航栏透明度"
                  value={customColors.navbarOpacity !== undefined ? customColors.navbarOpacity : 100}
                  onChange={(val) => setCustomColors({ navbarOpacity: val })}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  description="顶部吸顶固定 Header 区域"
                />

                {/* 3. 底部移动导航栏 (仅移动端显示) */}
                <div className="sm:hidden">
                  <ThemeSlider
                    label="移动端底栏透明度"
                    value={customColors.dockOpacity !== undefined ? customColors.dockOpacity : 100}
                    onChange={(val) => setCustomColors({ dockOpacity: val })}
                    min={0}
                    max={100}
                    step={5}
                    unit="%"
                    description="手机与窄屏端底部悬浮 Dock"
                  />
                </div>

                {/* 4. 搜索与输入框 */}
                <ThemeSlider
                  label="搜索与输入框透明度"
                  value={customColors.searchOpacity !== undefined ? customColors.searchOpacity : 100}
                  onChange={(val) => setCustomColors({ searchOpacity: val })}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  description="顶部搜索框与表单输入控件"
                />

                {/* 6. 弹窗与浮层 */}
                <ThemeSlider
                  label="弹窗与浮层透明度"
                  value={customColors.modalOpacity !== undefined ? customColors.modalOpacity : 100}
                  onChange={(val) => setCustomColors({ modalOpacity: val })}
                  min={10}
                  max={100}
                  step={5}
                  unit="%"
                  description="添加/编辑画作弹窗与大图查看器"
                />
              </div>
            </div>
          </div>

          {/* Real-time Preview */}
          <div 
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{
              backgroundColor: customColors.cardBg,
              borderColor: customColors.cardBorder,
            }}
          >
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ borderColor: customColors.cardBorder, color: customColors.textMuted }}>
                实时效果预览
              </span>
              <h4 className="font-art-serif text-lg font-bold mt-1.5" style={{ color: customColors.textMain }}>
                你好，画师
              </h4>
              <p className="text-xs mt-0.5" style={{ color: customColors.textMuted }}>
                今天也来画点什么吧。 灵感稍纵即逝，将每一个笔触与故事装入画匣。 
              </p>
            </div>
            <span 
              className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
              style={{ backgroundColor: customColors.accentColor, color: '#FFFFFF' }}
            >
              强调色按钮
            </span>
          </div>

          {/* Custom Theme Presets Management (Requirement 2 & 3) */}
          <div 
            id="theme-presets-management"
            className="p-5 rounded-2xl border space-y-4 animate-in fade-in"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--card-border)' }}>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  <BookmarkPlus className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                  <span>自定义主题预设储存与管理</span>
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  在调整好主题色彩与风格后，您可以给它命名并储存起来；亦可选择是否将其同步至右上角“画室主题外观”下拉菜单。
                </p>
              </div>
              {presetToast && (
                <span className="text-xs font-semibold text-emerald-500 animate-in fade-in duration-200">
                  {presetToast}
                </span>
              )}
            </div>

            {/* Form to Save Current Theme as Preset */}
            <div 
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--card-border)',
              }}
            >
              <span className="text-xs font-bold block" style={{ color: 'var(--text-main)' }}>
                储存当前外观配置为新预设
              </span>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="例：羊皮纸暖黄、极简深灰、夜色赛博..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                />

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs shrink-0" style={{ color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={showInHeaderInput}
                    onChange={(e) => setShowInHeaderInput(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>在右上角“画室主题外观”中显示</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!presetName.trim()) return;
                    addPreset(presetName.trim(), showInHeaderInput);
                    setPresetToast(`已成功保存预设 ${presetName.trim()}`);
                    setPresetName('');
                    setTimeout(() => setPresetToast(null), 3000);
                  }}
                  disabled={!presetName.trim()}
                  style={{
                    backgroundColor: 'var(--accent-gold)',
                    opacity: presetName.trim() ? 1 : 0.5,
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>储存为新预设</span>
                </button>
              </div>
            </div>

            {/* Saved Presets List */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                  主题预设 ({savedPresets.length})
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  可随时在设置中增加、重命名或删去主题，勾选可同步至右上角外观菜单
                </span>
              </div>

              {savedPresets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {savedPresets.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    const isEditing = editingPresetId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className="p-3.5 rounded-2xl border space-y-3 transition-all relative"
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          borderColor: isActive ? 'var(--accent-gold)' : 'var(--card-border)',
                          boxShadow: isActive ? '0 0 0 1px var(--accent-gold)' : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={editingPresetName}
                                onChange={(e) => setEditingPresetName(e.target.value)}
                                className="px-2.5 py-1 text-xs rounded-lg border focus:outline-none w-full"
                                style={{
                                  backgroundColor: 'var(--card-bg)',
                                  borderColor: 'var(--card-border)',
                                  color: 'var(--text-main)',
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (editingPresetName.trim()) {
                                    updatePreset(preset.id, { name: editingPresetName.trim() });
                                  }
                                  setEditingPresetId(null);
                                }}
                                className="p-1 rounded-lg bg-amber-500 text-white text-xs font-medium shrink-0 cursor-pointer"
                                title="确认保存重命名"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>
                                {preset.name}
                              </h4>
                              <button
                                onClick={() => {
                                  setEditingPresetId(preset.id);
                                  setEditingPresetName(preset.name);
                                }}
                                className="text-neutral-400 hover:text-amber-500 p-0.5 cursor-pointer"
                                title="重命名预设"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              {isActive && (
                                <span 
                                  className="text-[10px] px-1.5 py-0.2 rounded border font-medium shrink-0"
                                  style={{
                                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                                    borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                                    color: 'var(--accent-gold)',
                                  }}
                                >
                                  当前在用
                                </span>
                              )}
                            </div>
                          )}

                          {/* Swatches preview */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                              style={{ backgroundColor: preset.colors.bgPage }}
                              title="背景色"
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                              style={{ backgroundColor: preset.colors.cardBg }}
                              title="卡片色"
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                              style={{ backgroundColor: preset.colors.accentColor }}
                              title="强调色"
                            />
                          </div>
                        </div>

                        {/* Options & Actions row */}
                        <div className="flex items-center justify-between pt-2 border-t text-[11px]" style={{ borderColor: 'var(--card-border)' }}>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none" style={{ color: 'var(--text-muted)' }}>
                            <input
                              type="checkbox"
                              checked={preset.showInHeader}
                              onChange={(e) => updatePreset(preset.id, { showInHeader: e.target.checked })}
                              className="w-3.5 h-3.5 rounded border-neutral-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <span>在右上角外观中显示</span>
                          </label>

                          <div className="flex items-center gap-2">
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => applyPreset(preset)}
                                style={{ color: 'var(--accent-gold)' }}
                                className="font-medium hover:underline cursor-pointer"
                              >
                                应用预设
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deletePreset(preset.id)}
                              className="text-neutral-400 hover:text-rose-500 cursor-pointer p-0.5"
                              title="删除预设"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div 
                  className="p-4 rounded-xl border border-dashed text-center text-xs font-light"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  尚未储存任何主题预设。微调上方色彩后，输入名称即可一键储存！
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* NEW: Wallpaper & Custom Background Management Section */}
      <section 
        className="p-6 rounded-3xl border shadow-xs space-y-5"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-art-serif text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <ImageIcon className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span>壁纸与动态背景</span>
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              支持上传自定义本地图片、GIF动图或MP4/WebM视频作为应用全屏背景，可自由调节透明度与高斯模糊度。
            </p>
          </div>

          {/* Current Wallpaper Status Badge & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {wallpaper && wallpaper.type !== 'none' && wallpaper.url && (
              <button
                onClick={() => removeWallpaper()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除壁纸</span>
              </button>
            )}

            <button
              onClick={() => wallpaperInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--accent-gold)' }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>上传图片/视频壁纸</span>
            </button>
            <input
              type="file"
              ref={wallpaperInputRef}
              onChange={handleWallpaperFileChange}
              accept="image/*,video/mp4,video/webm"
              className="hidden"
            />
          </div>
        </div>

        {/* Upload feedback */}
        {wallpaperUploadStatus && (
          <div 
            className="p-3 rounded-xl text-xs font-medium border animate-fadeIn flex items-center justify-between"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-gold) 40%, transparent)',
              color: 'var(--text-main)',
            }}
          >
            <span>{wallpaperUploadStatus}</span>
            <button onClick={() => setWallpaperUploadStatus('')} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        )}



        {/* Wallpaper Adjustments (Opacity, Blur, Fit) */}
        {wallpaper && wallpaper.type !== 'none' && wallpaper.url && (
          <div 
            className="p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                <span>壁纸效果调节参数</span>
              </h4>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                类型: {wallpaper.type === 'video' ? '动态视频' : '静止/动图画质'} {wallpaper.name ? `· ${wallpaper.name}` : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Opacity */}
              <ThemeSlider
                label="壁纸不透明度"
                value={wallpaper.opacity !== undefined ? wallpaper.opacity : 85}
                onChange={(val) => setWallpaper({ ...wallpaper, opacity: val })}
                min={5}
                max={100}
                step={5}
                unit="%"
                description="建议设置在 60% ~ 90% 以保持文字可读性"
              />

              {/* 2. Blur */}
              <ThemeSlider
                label="高斯模糊度"
                value={wallpaper.blur || 0}
                onChange={(val) => setWallpaper({ ...wallpaper, blur: val })}
                min={0}
                max={35}
                step={1}
                unit="px"
                description="增加模糊可营造柔和的背景景深氛围"
              />

              {/* 3. Fit Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>填充适应方式</label>
                <div className="flex gap-2">
                  {[
                    { id: 'cover', label: '裁剪铺满 (Cover)' },
                    { id: 'contain', label: '完整居中 (Contain)' },
                  ].map((fitOption) => (
                    <button
                      key={fitOption.id}
                      onClick={() => setWallpaper({ ...wallpaper, fit: fitOption.id as any })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        (wallpaper.fit || 'cover') === fitOption.id ? 'font-bold' : ''
                      }`}
                      style={{
                        backgroundColor: (wallpaper.fit || 'cover') === fitOption.id ? 'var(--accent-gold)' : 'var(--card-bg)',
                        color: (wallpaper.fit || 'cover') === fitOption.id ? '#FFFFFF' : 'var(--text-main)',
                        borderColor: (wallpaper.fit || 'cover') === fitOption.id ? 'var(--accent-gold)' : 'var(--card-border)',
                      }}
                    >
                      {fitOption.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Database & Data Management */}
      <section 
        className="p-5 sm:p-7 rounded-3xl border shadow-xs space-y-6"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                  color: 'var(--accent-gold)',
                }}
              >
                <Database className="w-4 h-4" />
              </div>
              <h2 className="font-art-serif text-base sm:text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                数据存储与备份
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> 本地安全沙盒
              </span>
            </div>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              您的作品原图/动图/视频媒体、分类标签、创作日记及所有自定义美化预设均私密储存于本机的 IndexedDB 数据库中。
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono shrink-0 self-start sm:self-auto"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
          >
            <HardDrive className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
            <span>存储引擎: IndexedDB</span>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div 
            className="p-3 sm:p-3.5 rounded-2xl border space-y-1"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>作品与素材</span>
            <div className="flex items-baseline gap-1">
              <span className="font-art-serif text-lg sm:text-xl font-bold" style={{ color: 'var(--text-main)' }}>
                {artworksCount}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>件</span>
            </div>
          </div>

          <div 
            className="p-3 sm:p-3.5 rounded-2xl border space-y-1"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>创作日记</span>
            <div className="flex items-baseline gap-1">
              <span className="font-art-serif text-lg sm:text-xl font-bold" style={{ color: 'var(--text-main)' }}>
                {diariesCount}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>篇</span>
            </div>
          </div>

          <div 
            className="p-3 sm:p-3.5 rounded-2xl border space-y-1"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>自定义美化预设</span>
            <div className="flex items-baseline gap-1">
              <span className="font-art-serif text-lg sm:text-xl font-bold" style={{ color: 'var(--text-main)' }}>
                {savedPresets.length}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>个</span>
            </div>
          </div>

          <div 
            className="p-3 sm:p-3.5 rounded-2xl border space-y-1"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>隐私与数据安全</span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% 离线私密</span>
            </div>
          </div>
        </div>

        {/* Backup & Restore Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Export Card */}
          <div 
            className="p-5 rounded-2xl border flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-2xs"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                      导出完整画匣备份
                    </h3>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      格式: JSON 独立归档包
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                将画匣中的全部数据打包生成单文件备份，方便在更换电脑、重装系统或长期离线归档时随时还原。
              </p>

              {/* What's included checklist */}
              <div 
                className="p-3 rounded-xl border text-[11px] space-y-1.5 font-mono"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
              >
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>高清原图、动图及短视频媒体原件</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>全部创作随笔心得及作品关联</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>自定义配色预设、各主题调色板与壁纸</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>分类标签、置顶收藏与作品尺寸参数</span>
                </div>
              </div>
            </div>

            <button
              onClick={onExportBackup}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:shadow active:scale-98 transition-all text-white"
              style={{
                backgroundColor: 'var(--accent-gold)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>立即下载完整备份包 (.json)</span>
            </button>
          </div>

          {/* Import / Restore Card */}
          <div 
            className="p-5 rounded-2xl border flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-2xs"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--text-main) 8%, transparent)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <FolderArchive className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                      恢复 / 导入画匣备份
                    </h3>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      格式: JSON 独立归档包
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                从此前导出的画匣 JSON 备份文件中完整还原作品库、创作日记与所有自定义外观配置。
              </p>

              {/* What's restored checklist */}
              <div 
                className="p-3 rounded-xl border text-[11px] space-y-1.5 font-mono"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
              >
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>兼容画匣各版本生成的标准 JSON 备份</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>自动还原作品媒体原件及画作元数据</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>恢复全部创作随笔心得及关联记录</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>实时重载自定义调色板、预设与壁纸</span>
                </div>
              </div>

              {/* Import status notification */}
              {importStatus && (
                <div 
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                    importStatus.includes('失败') ? 'text-rose-600 bg-rose-500/10 border-rose-500/30' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  {importStatus.includes('失败') ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">{importStatus}</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border hover:border-amber-500 active:scale-98 transition-all"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-main)',
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>选择本地备份文件导入</span>
            </button>
          </div>
        </div>

        {/* Data Security Notice Tip */}
        <div 
          className="p-4 rounded-2xl border text-xs flex items-start gap-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-gold) 6%, var(--bg-page))',
            borderColor: 'color-mix(in srgb, var(--accent-gold) 25%, var(--card-border))',
          }}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-gold)' }} />
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: 'var(--text-main)' }}>
              画师数据安全小建议
            </p>
            <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              画匣坚持「纯本地隐私优先」，数据仅保存在您的浏览器沙盒中，不会上传到任何第三方云端。当您清理浏览器缓存、重装操作系统或更换设备时，本地存储可能被重置，建议在创作重要节点定期「下载画匣备份包」保存在本地电脑或网盘中。
            </p>
          </div>
        </div>

        {/* Danger Zone: Reset Data */}
        <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'var(--card-border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-main)' }}>重置画匣数据</p>
            <p className="text-[11px] mt-0.5">清空本地存储的所有作品、日记与自定义美化预设，恢复至初始预设状态。</p>
          </div>

          <div className="flex items-center justify-end sm:ml-auto shrink-0 self-end sm:self-auto">
            {isResetConfirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-500 font-medium">确认重置所有数据？</span>
                <button
                  onClick={async () => {
                    await onResetDefaults();
                    setIsResetConfirming(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  确定重置
                </button>
                <button
                  onClick={() => setIsResetConfirming(false)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-medium"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsResetConfirming(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border hover:border-rose-500 hover:text-rose-500 text-xs font-medium transition-colors"
                style={{
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-muted)',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置数据</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* About ArtVault */}
      <footer className="text-center py-6 text-xs space-y-1 font-mono" style={{ color: 'var(--text-muted)' }}>
        <p>「画匣 · ART VAULT」 · 属于画师自己的数字作品档案馆</p>
        <p className="text-[11px] opacity-70">HTML5 · IndexedDB · Responsive · High Fidelity</p>
      </footer>

    </div>
  );
};
