import { Artwork, DiaryEntry, CategoryItem, StatusItem } from '../types';

// Built-in artwork initial empty list as requested by user
export const INITIAL_ARTWORKS: Artwork[] = [];

export const INITIAL_DIARIES: DiaryEntry[] = [];

// Default custom categories (can be reordered, deleted, added)
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: '插画', isDefault: true },
  { id: 'cat-2', name: '角色设计', isDefault: true },
  { id: 'cat-3', name: '场景设计', isDefault: true },
  { id: 'cat-4', name: '漫画', isDefault: true },
  { id: 'cat-5', name: '草稿', isDefault: true },
  { id: 'cat-6', name: '概念设定', isDefault: true },
  { id: 'cat-7', name: '其他', isDefault: true },
];

// Default custom statuses (can be reordered, deleted, added)
export const DEFAULT_STATUSES: StatusItem[] = [
  { id: 'status-1', name: '已完成', color: 'emerald', isDefault: true },
  { id: 'status-2', name: '创作中', color: 'amber', isDefault: true },
  { id: 'status-3', name: '草稿', color: 'neutral', isDefault: true },
  { id: 'status-4', name: '废稿', color: 'rose', isDefault: true },
];
