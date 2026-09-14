export interface CategoryItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface StatusItem {
  id: string;
  name: string;
  color: string; // e.g., 'emerald', 'amber', 'rose', 'sky', 'purple', 'neutral'
  bgClass?: string;
  textClass?: string;
  borderClass?: string;
  isDefault?: boolean;
}

export interface Artwork {
  id: string;
  title: string;
  type: string; // supports custom categories
  tags: string[];
  date: string; // YYYY-MM-DD
  status: string; // supports custom statuses
  width: number;
  height: number;
  sizeBytes: number;
  description: string;
  imageUrl: string; // Data URL or Blob URL or SVG
  isFavorite: boolean;
  isPinned?: boolean; // Pinned to top
  fileType?: 'image' | 'gif' | 'video' | 'psd' | 'ai'; // file format: image, animated gif, video, psd, ai
  fileName?: string;
  previewScale?: number; // scale percentage, e.g. 100 for 100%
  isDeleted?: boolean;
  deletedAt?: string;
  colorPalette?: string[]; // Custom color palette swatches (e.g. ['#FF5733', '#2E4057'])
  createdAt: string;
  updatedAt: string;
}

export interface DiaryMediaItem {
  id: string;
  url: string;
  type: 'image' | 'gif' | 'video';
  name?: string;
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  artworkId?: string;
  artworkTitle?: string;
  artworkThumbnail?: string;
  tags?: string[];
  media?: DiaryMediaItem[];
  createdAt: string;
  updatedAt: string;
}

export type ViewTab = 'home' | 'gallery' | 'favorites' | 'diary' | 'stats' | 'settings';

export type DateFilter = 'all' | 'today' | '7days' | '30days' | 'year' | 'custom';

export type SortOrder = 'newest' | 'oldest' | 'title' | 'largest';

export type GalleryLayoutMode = 'masonry' | 'list';

export type ThemeMode = 'ivory' | 'pure_white' | 'dark' | 'pink' | 'pixel' | 'custom' | 'light';

export type DisplayMode = 'default' | 'minimal';

export type ThemeStyle = 'default' | 'glass' | 'neumorphism' | 'flat';

export interface WallpaperConfig {
  type: 'none' | 'image' | 'video';
  url: string; // Base64 data URL, blob URL, or preset url/gradient
  name?: string;
  opacity: number; // 0 to 100
  blur: number; // 0 to 40 (px)
  fit?: 'cover' | 'contain' | 'repeat';
}

export interface CustomThemeColors {
  bgPage: string;
  cardBg: string;
  navbarBg: string;
  textMain: string;
  textMuted: string;
  cardBorder: string;
  accentColor: string;
  homeGreetingColor?: string;
  homeMottoColor?: string;
  themeStyle?: ThemeStyle;
  // Granular opacities for every part (0 to 100)
  pageOpacity?: number;      // 页面底层背景透明度
  contentOpacity?: number;   // 主体模块背景透明度
  cardOpacity?: number;      // 模块卡片透明度
  navbarOpacity?: number;    // 顶部导航栏透明度
  dockOpacity?: number;      // 底部移动端导航透明度
  modalOpacity?: number;     // 弹窗与浮层卡片透明度
  searchOpacity?: number;    // 搜索框与输入框透明度
  badgeOpacity?: number;     // 标签胶囊与徽章透明度
  // Custom wallpaper config
  wallpaper?: WallpaperConfig;
}

export interface ThemePreset {
  id: string;
  name: string;
  themeMode: ThemeMode;
  colors: CustomThemeColors;
  showInHeader: boolean; // 是否在右上角“画室主题外观”菜单中可选择
  createdAt: string;
}
