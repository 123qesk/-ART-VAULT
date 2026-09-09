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
}
