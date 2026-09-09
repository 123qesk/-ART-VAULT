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
  Feather
} from 'lucide-react';
import { ThemeMode, CustomThemeColors, DisplayMode } from '../types';
import { useTheme, BUILTIN_THEMES_DEFAULT } from '../context/ThemeContext';

interface SettingsViewProps {
  onExportBackup: () => void;
  onImportBackup: (jsonContent: string) => Promise<{ artworksCount: number; diariesCount: number }>;
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
  { name: '黛黑深室', cardBg: '#141822', cardBorder: '#232A3B' },
  { name: '薄樱暖粉', cardBg: '#FFF5F7', cardBorder: '#FCE7F0' },
  { name: '浅草嫩绿', cardBg: '#F0FDF4', cardBorder: '#DCFCE7' },
  { name: '冰川澄蓝', cardBg: '#F0F9FF', cardBorder: '#E0F2FE' },
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
    setDisplayMode 
  } = useTheme();

  const [importStatus, setImportStatus] = useState<string>('');
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePreset = PRESET_THEMES.find(p => p.id === theme || (p.id === 'ivory' && theme === 'light')) || PRESET_THEMES[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const content = ev.target?.result as string;
          const result = await onImportBackup(content);
          setImportStatus(`成功导入 ${result.artworksCount} 件作品及 ${result.diariesCount} 篇日志！`);
          setTimeout(() => setImportStatus(''), 4000);
        } catch (err: any) {
          setImportStatus(`导入失败: ${err.message || '文件格式不正确'}`);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setImportStatus(`读取文件失败: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-2"
          style={{
            backgroundColor: 'rgba(194, 142, 90, 0.1)',
            borderColor: 'rgba(194, 142, 90, 0.25)',
            color: 'var(--accent-gold)',
          }}
        >
          <Settings className="w-3.5 h-3.5" />
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
          className="p-4 rounded-2xl border text-xs flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(194, 142, 90, 0.1)',
            borderColor: 'rgba(194, 142, 90, 0.3)',
            color: 'var(--accent-gold)',
          }}
        >
          <Info className="w-4 h-4 shrink-0" />
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
              <LayoutTemplate className="w-4 h-4 text-amber-500" />
              <span>模式选择</span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              配置首页排版风格。选择“默认模式”展示头像与个性签名；选择“简洁模式”则专注作品与创作数据。
            </p>
          </div>
          <span 
            className="text-xs px-2.5 py-1 rounded-full font-medium border"
            style={{
              backgroundColor: 'rgba(194, 142, 90, 0.1)',
              borderColor: 'rgba(194, 142, 90, 0.25)',
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
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
              displayMode === 'default'
                ? 'border-amber-500 shadow-xs'
                : 'hover:border-amber-300'
            }`}
            style={{
              backgroundColor: displayMode === 'default' ? 'rgba(194, 142, 90, 0.05)' : 'var(--card-bg)',
              borderColor: displayMode === 'default' ? 'var(--accent-gold)' : 'var(--card-border)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                    默认模式
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">
                    展示头像与签名
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  首页展示艺术家专属头像、画室主理人昵称与个性签名，呈现完整的画师主页艺术风貌。
                </p>
              </div>
              {displayMode === 'default' && (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Visual Mini Preview for Default Mode */}
            <div 
              className="p-2.5 rounded-xl border flex items-center gap-2.5 text-xs"
              style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
            >
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                🎨
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[11px] truncate" style={{ color: 'var(--text-main)' }}>莫奈画师 · 画室主理人</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>以画笔勾勒世界，用色彩记录生活 ✨</p>
              </div>
              <span className="text-[10px] text-emerald-500 font-mono shrink-0 flex items-center gap-0.5">
                <Eye className="w-3 h-3" /> 开启
              </span>
            </div>
          </div>

          {/* Minimal Mode Card */}
          <div
            onClick={() => setDisplayMode('minimal')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
              displayMode === 'minimal'
                ? 'border-amber-500 shadow-xs'
                : 'hover:border-amber-300'
            }`}
            style={{
              backgroundColor: displayMode === 'minimal' ? 'rgba(194, 142, 90, 0.05)' : 'var(--card-bg)',
              borderColor: displayMode === 'minimal' ? 'var(--accent-gold)' : 'var(--card-border)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                    简洁模式
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                    隐藏头像与签名
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  隐藏首页头像与个性签名卡片，界面视觉更加轻盈克制，首屏直接聚焦艺术品与创作数据。
                </p>
              </div>
              {displayMode === 'minimal' && (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Visual Mini Preview for Minimal Mode */}
            <div 
              className="p-2.5 rounded-xl border flex items-center gap-2.5 text-xs"
              style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
            >
              <Feather className="w-4 h-4 text-neutral-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[11px] truncate" style={{ color: 'var(--text-main)' }}>你好，画师</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>灵感稍纵即逝，将每一个笔触装入画匣</p>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono shrink-0 flex items-center gap-0.5">
                <EyeOff className="w-3 h-3" /> 已隐
              </span>
            </div>
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
              <Palette className="w-4 h-4 text-amber-500" />
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
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-500 shadow-xs'
                    : 'hover:border-amber-300'
                }`}
                style={{
                  backgroundColor: isSelected ? 'rgba(194, 142, 90, 0.05)' : 'var(--card-bg)',
                  borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
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
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          已自定义
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {preset.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
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
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>主体模块底色快捷挑选：</span>
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              一键更换全站概览、作品卡、日记卡等主体模块底色与分割线
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {MODULE_COLOR_PRESETS.map((m) => {
              const isCur = customColors.cardBg.toLowerCase() === m.cardBg.toLowerCase();
              return (
                <button
                  key={m.name}
                  onClick={() => setCustomColors({ cardBg: m.cardBg, cardBorder: m.cardBorder })}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    isCur ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs' : 'hover:border-amber-400'
                  }`}
                  style={{
                    backgroundColor: m.cardBg,
                    borderColor: isCur ? 'var(--accent-gold)' : m.cardBorder,
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
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
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

          {/* Color Pickers Grid including Module Color, Greeting & Motto Colors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* 1. 主体模块（卡片）底色 (Requirement 1) */}
            <div 
              className="p-3 rounded-xl border space-y-1.5 ring-1 ring-amber-500/20"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--accent-gold)' }}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold block" style={{ color: 'var(--accent-gold)' }}>
                  主体模块颜色
                </label>
                <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
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
                  className="w-full text-xs font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 2. 首页问候语字色 (Requirement 2) */}
            <div 
              className="p-3 rounded-xl border space-y-1.5"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                首页问候语颜色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColors.homeGreetingColor || customColors.textMain || '#111827'}
                  onChange={(e) => setCustomColors({ homeGreetingColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColors.homeGreetingColor || customColors.textMain || '#111827'}
                  onChange={(e) => setCustomColors({ homeGreetingColor: e.target.value })}
                  className="w-full text-xs font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 3. 首页寄语字色 (Requirement 2) */}
            <div 
              className="p-3 rounded-xl border space-y-1.5"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <label className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                首页寄语颜色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColors.homeMottoColor || customColors.textMuted || '#6B7280'}
                  onChange={(e) => setCustomColors({ homeMottoColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColors.homeMottoColor || customColors.textMuted || '#6B7280'}
                  onChange={(e) => setCustomColors({ homeMottoColor: e.target.value })}
                  className="w-full text-xs font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 4. 顶栏背景色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5"
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
                  className="w-full text-xs font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 5. 页面底色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5"
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
                  className="w-full text-xs font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 6. 正文主字色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5"
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
                  className="w-full text-xs font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 7. 模块边框分割线 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5"
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
                  className="w-full text-xs font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* 8. 艺术强调色 */}
            <div 
              className="p-3 rounded-xl border space-y-1.5"
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
                  className="w-full text-xs font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>
          </div>

          {/* Real-time Preview of Greeting, Motto and Module Card */}
          <div 
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{
              backgroundColor: customColors.cardBg,
              borderColor: customColors.cardBorder,
            }}
          >
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ borderColor: customColors.cardBorder, color: customColors.textMuted }}>
                实时效果预览（当前主体模块底色）
              </span>
              <h4 className="font-art-serif text-lg font-bold mt-1.5" style={{ color: customColors.homeGreetingColor || customColors.textMain }}>
                你好，画师（问候语预览）
              </h4>
              <p className="text-xs mt-0.5" style={{ color: customColors.homeMottoColor || customColors.textMuted }}>
                今天也来画点什么吧。灵感稍纵即逝，将每一个笔触与故事装入画匣。（寄语预览）
              </p>
            </div>
            <span 
              className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
              style={{ backgroundColor: customColors.accentColor, color: '#FFFFFF' }}
            >
              强调色按钮
            </span>
          </div>

        </div>
      </section>

      {/* Database & Data Management */}
      <section 
        className="p-6 rounded-3xl border shadow-xs space-y-5"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-art-serif text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Database className="w-4 h-4 text-amber-500" />
              <span>数据存储与备份 (IndexedDB)</span>
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              您的作品原图/动图/视频、标签、日期及日记均储存于浏览器专属的本地数据库 (IndexedDB)，安全私密且不限常规5MB容量。
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono block" style={{ color: 'var(--text-muted)' }}>当前数据统计</span>
            <span className="font-art-serif text-sm font-bold" style={{ color: 'var(--text-main)' }}>
              {artworksCount} 件作品 · {diariesCount} 篇日记
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Backup */}
          <div 
            className="p-4 rounded-2xl border flex flex-col justify-between space-y-3"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                导出完整备份 (JSON)
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                将作品信息、原图/动图/视频媒体与所有创作日记打包导出为本地单文件，方便换电脑或长期归档。
              </p>
            </div>
            <button
              onClick={onExportBackup}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold hover:shadow transition-all"
              style={{
                backgroundColor: 'var(--text-main)',
                color: 'var(--bg-page)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载画匣备份包</span>
            </button>
          </div>

          {/* Import Backup */}
          <div 
            className="p-4 rounded-2xl border flex flex-col justify-between space-y-3"
            style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--card-border)' }}
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                恢复 / 导入画匣备份
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                从此前导出的画匣 JSON 备份文件中还原所有作品与日记。
              </p>
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
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border hover:border-amber-500 transition-all"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-main)',
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>选择备份文件导入</span>
            </button>
          </div>
        </div>

        {/* Reset to defaults */}
        <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--card-border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-main)' }}>重置示例演示数据</p>
            <p>恢复预置的 7 张艺术作品《雨夜》《少女》《森林》及示范日记。</p>
          </div>

          {isResetConfirming ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-500 font-medium">确认重置？</span>
              <button
                onClick={async () => {
                  await onResetDefaults();
                  setIsResetConfirming(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
              >
                确定重置
              </button>
              <button
                onClick={() => setIsResetConfirming(false)}
                className="px-3 py-1.5 rounded-lg border text-xs"
                style={{ borderColor: 'var(--card-border)' }}
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsResetConfirming(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:border-rose-500 hover:text-rose-500 text-xs font-medium transition-colors"
              style={{
                borderColor: 'var(--card-border)',
                color: 'var(--text-muted)',
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置为精美预置画作</span>
            </button>
          )}
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
