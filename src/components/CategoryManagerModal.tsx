import React, { useState } from 'react';
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

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  statuses,
  onUpdateCategories,
  onUpdateStatuses,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'statuses'>('categories');

  // Category local state
  const [localCategories, setLocalCategories] = useState<CategoryItem[]>(categories);
  const [newCatName, setNewCatName] = useState('');

  // Status local state
  const [localStatuses, setLocalStatuses] = useState<StatusItem[]>(statuses);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('amber');

  // Drag state
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);
  const [draggedStatusIndex, setDraggedStatusIndex] = useState<number | null>(null);

  if (!isOpen) return null;

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
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="font-art-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              作品分类与状态管理
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              支持自由拖拽排序、新增和删除分类/状态
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex px-4 sm:px-6 pt-3 sm:pt-4 gap-2 border-b border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'categories'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            自定义分类 ({localCategories.length})
          </button>
          <button
            onClick={() => setActiveTab('statuses')}
            className={`pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'statuses'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            自定义创作状态 ({localStatuses.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 max-h-[65vh] sm:max-h-[60vh] overflow-y-auto space-y-4 sm:space-y-5">
          {activeTab === 'categories' ? (
            <div className="space-y-4">
              {/* Add category input */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="输入新分类名称 (如: 场景速写, 厚涂头像)..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shrink-0"
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
                    className={`flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-[#12141A] transition-all cursor-move select-none ${
                      draggedCatIndex === idx
                        ? 'border-amber-500 shadow-md bg-amber-500/5'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50'
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
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="删除分类"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add status form */}
              <form onSubmit={handleAddStatus} className="space-y-2 p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    placeholder="输入新状态 (如: 构思中, 待交稿, 绝赞连载)..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#181B22] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={!newStatusName.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shrink-0"
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
                      className={`w-5 h-5 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
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
                    className={`flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-[#12141A] transition-all cursor-move select-none ${
                      draggedStatusIndex === idx
                        ? 'border-amber-500 shadow-md bg-amber-500/5'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50'
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
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
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
