import React, { useState, useEffect } from 'react';
import { X, GripVertical, Trash2, Plus, Check, Palette } from 'lucide-react';
import { CategoryItem, StatusItem } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  statuses: StatusItem[];
  onUpdateCategories: (categories: CategoryItem[]) => void;
  onUpdateStatuses: (statuses: StatusItem[]) => void;
}

const DEFAULT_BUILTIN_TAGS = ['原创', '人物', '夜景', '场景', '厚涂', '二次元', '光影练习', '写生', '赛博朋克', '自然'];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  statuses,
  onUpdateCategories,
  onUpdateStatuses,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'statuses' | 'tags'>('categories');

  // Category local state
  const [localCategories, setLocalCategories] = useState<CategoryItem[]>(categories);
  const [newCatName, setNewCatName] = useState('');

  // Status local state
  const [localStatuses, setLocalStatuses] = useState<StatusItem[]>(statuses);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('amber');

  // Tags local state (supports deleting and adding tags, strictly tags only - strips any status names)
  const [localTags, setLocalTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('art_vault_all_available_tags');
      const statusNames = statuses.map((s) => s.name);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        // Exclude any status names that might have been mixed in
        return parsed.filter((t) => !statusNames.includes(t));
      }
      const oldCustom = localStorage.getItem('art_vault_custom_user_tags');
      const customList: string[] = oldCustom ? JSON.parse(oldCustom) : [];
      return Array.from(new Set([...customList, ...DEFAULT_BUILTIN_TAGS])).filter((t) => !statusNames.includes(t));
    } catch {
      return DEFAULT_BUILTIN_TAGS;
    }
  });
  const [newTagName, setNewTagName] = useState('');

  // Drag state
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);
  const [draggedStatusIndex, setDraggedStatusIndex] = useState<number | null>(null);

  // Sync and clean tags whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      setLocalCategories(categories);
      setLocalStatuses(statuses);
      try {
        const saved = localStorage.getItem('art_vault_all_available_tags');
        const statusNames = statuses.map((s) => s.name);
        if (saved) {
          const parsed: string[] = JSON.parse(saved);
          const cleaned = parsed.filter((t) => !statusNames.includes(t));
          setLocalTags(cleaned);
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('art_vault_all_available_tags', JSON.stringify(cleaned));
          }
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen, categories, statuses]);

  if (!isOpen) return null;

  // --- Tag Handlers ---
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagName.trim().replace(/^#/, '');
    if (!clean) return;
    // Disallow adding creation status names as tags
    const statusNames = statuses.map((s) => s.name);
    if (statusNames.includes(clean)) {
      setNewTagName('');
      return;
    }
    if (!localTags.includes(clean)) {
      const updated = [clean, ...localTags];
      setLocalTags(updated);
      localStorage.setItem('art_vault_all_available_tags', JSON.stringify(updated));
    }
    setNewTagName('');
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const clean = tagToDelete.replace(/^#/, '');
    const updated = localTags.filter((t) => t !== clean);
    setLocalTags(updated);
    localStorage.setItem('art_vault_all_available_tags', JSON.stringify(updated));
  };

  const handleRestoreDefaultTags = () => {
    const statusNames = statuses.map((s) => s.name);
    const merged = Array.from(new Set([...DEFAULT_BUILTIN_TAGS, ...localTags])).filter((t) => !statusNames.includes(t));
    setLocalTags(merged);
    localStorage.setItem('art_vault_all_available_tags', JSON.stringify(merged));
  };

  // --- Category Handlers ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const item: CategoryItem = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      isDefault: false,
    };
    const updated = [...localCategories, item];
    setLocalCategories(updated);
    onUpdateCategories(updated);
    setNewCatName('');
  };

  const handleDeleteCategory = (id: string) => {
    const updated = localCategories.filter((c) => c.id !== id);
    setLocalCategories(updated);
    onUpdateCategories(updated);
  };

  const handleCatDragStart = (index: number) => {
    setDraggedCatIndex(index);
  };

  const handleCatDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCatIndex === null || draggedCatIndex === index) return;
    const updated = [...localCategories];
    const dragged = updated.splice(draggedCatIndex, 1)[0];
    updated.splice(index, 0, dragged);
    setDraggedCatIndex(index);
    setLocalCategories(updated);
    onUpdateCategories(updated);
  };

  // --- Status Handlers ---
  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;
    const item: StatusItem = {
      id: `status_${Date.now()}`,
      name: newStatusName.trim(),
      color: newStatusColor,
      isDefault: false,
    };
    const updated = [...localStatuses, item];
    setLocalStatuses(updated);
    onUpdateStatuses(updated);
    setNewStatusName('');
  };

  const handleDeleteStatus = (id: string) => {
    const updated = localStatuses.filter((s) => s.id !== id);
    setLocalStatuses(updated);
    onUpdateStatuses(updated);
  };

  const handleStatusDragStart = (index: number) => {
    setDraggedStatusIndex(index);
  };

  const handleStatusDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedStatusIndex === null || draggedStatusIndex === index) return;
    const updated = [...localStatuses];
    const dragged = updated.splice(draggedStatusIndex, 1)[0];
    updated.splice(index, 0, dragged);
    setDraggedStatusIndex(index);
    setLocalStatuses(updated);
    onUpdateStatuses(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        style={{
          backgroundColor: 'var(--modal-bg)',
          borderColor: 'var(--card-border)',
        }}
        className="relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="font-art-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              作品分类与状态管理
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              支持自由拖拽排序、新增和删除分类/状态/标签
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex px-4 sm:px-6 pt-3 sm:pt-4 gap-2 border-b border-neutral-100 dark:border-neutral-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('categories')}
            style={{
              borderColor: activeTab === 'categories' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'categories' ? 'var(--accent-gold)' : undefined,
            }}
            className={`pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'font-bold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            自定义分类 ({localCategories.length})
          </button>
          <button
            onClick={() => setActiveTab('statuses')}
            style={{
              borderColor: activeTab === 'statuses' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'statuses' ? 'var(--accent-gold)' : undefined,
            }}
            className={`pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'statuses'
                ? 'font-bold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            创作状态 ({localStatuses.length})
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            style={{
              borderColor: activeTab === 'tags' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'tags' ? 'var(--accent-gold)' : undefined,
            }}
            className={`pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tags'
                ? 'font-bold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            标签管理 ({localTags.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 max-h-[65vh] sm:max-h-[60vh] overflow-y-auto space-y-4 sm:space-y-5">
          {activeTab === 'categories' && (
            <div className="space-y-4">
              {/* Add category input */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="输入新分类名称 (如: 场景速写, 厚涂头像)..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                  className="px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加分类</span>
                </button>
              </form>

              {/* Category drag list */}
              <div className="space-y-2">
                <div className="text-[11px] text-neutral-400">
                  拖拽把手可调整分类在侧边栏的展示先后顺序：
                </div>
                {localCategories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={() => handleCatDragStart(idx)}
                    onDragOver={(e) => handleCatDragOver(e, idx)}
                    onDragEnd={() => setDraggedCatIndex(null)}
                    style={{
                      borderColor: draggedCatIndex === idx ? 'var(--accent-gold)' : undefined,
                      backgroundColor: draggedCatIndex === idx ? 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))' : undefined,
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-[#12141A] transition-all cursor-move select-none ${
                      draggedCatIndex === idx
                        ? 'shadow-md'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab" />
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="删除分类"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'statuses' && (
            <div className="space-y-4">
              {/* Add status form */}
              <form onSubmit={handleAddStatus} className="space-y-2 p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    placeholder="输入新状态 (如: 构思中, 待交稿, 绝赞连载)..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#181B22] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newStatusName.trim()}
                    style={{ backgroundColor: 'var(--accent-gold)' }}
                    className="px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加状态</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-neutral-500">
                  <Palette className="w-3.5 h-3.5" />
                  <span>标签色调:</span>
                  {[
                    { key: 'emerald', label: '翠绿', bg: 'bg-emerald-500' },
                    { key: 'amber', label: '琥珀', bg: 'bg-amber-500' },
                    { key: 'sky', label: '天蓝', bg: 'bg-sky-500' },
                    { key: 'purple', label: '紫藤', bg: 'bg-purple-500' },
                    { key: 'rose', label: '嫣红', bg: 'bg-rose-500' },
                    { key: 'neutral', label: '冷灰', bg: 'bg-neutral-500' },
                  ].map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setNewStatusColor(c.key)}
                      className={`w-5 h-5 rounded-full ${c.bg} flex items-center justify-center transition-transform cursor-pointer ${
                        newStatusColor === c.key ? 'ring-2 ring-offset-2 ring-neutral-800 scale-110' : 'opacity-70'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </form>

              {/* Status drag list */}
              <div className="space-y-2">
                <div className="text-[11px] text-neutral-400">
                  拖拽把手可调整状态在筛选栏中的先后顺序：
                </div>
                {localStatuses.map((st, idx) => (
                  <div
                    key={st.id}
                    draggable
                    onDragStart={() => handleStatusDragStart(idx)}
                    onDragOver={(e) => handleStatusDragOver(e, idx)}
                    onDragEnd={() => setDraggedStatusIndex(null)}
                    style={{
                      borderColor: draggedStatusIndex === idx ? 'var(--accent-gold)' : undefined,
                      backgroundColor: draggedStatusIndex === idx ? 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))' : undefined,
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-[#12141A] transition-all cursor-move select-none ${
                      draggedStatusIndex === idx
                        ? 'shadow-md'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab" />
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {st.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {st.color}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteStatus(st.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="删除状态"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Tags Management */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              {/* Add Tag Form */}
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="输入新标签名称 (如: 场景速写, 厚涂, 赛博)..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                  className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> 添加标签
                </button>
              </form>

              {/* Tags Grid with Delete Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                  <span>所有标签 (内置与自定义均可点击删除)</span>
                  {localTags.length < DEFAULT_BUILTIN_TAGS.length && (
                    <button
                      type="button"
                      onClick={handleRestoreDefaultTags}
                      className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      恢复默认内置标签
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                  {localTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 group hover:border-neutral-300 dark:hover:border-neutral-600 transition-all"
                    >
                      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <span className="text-neutral-400 font-mono">#</span>
                        {tag}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(tag)}
                        title={`删除标签 #${tag}`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {localTags.length === 0 && (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    <p>暂无标签</p>
                    <button
                      type="button"
                      onClick={handleRestoreDefaultTags}
                      className="mt-2 text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      点击恢复默认内置标签
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
