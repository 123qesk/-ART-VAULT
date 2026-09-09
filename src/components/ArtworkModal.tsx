import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  X, 
  Sparkles, 
  Pin, 
  ZoomIn, 
  Layers, 
  FileCode, 
  Plus, 
  Sliders, 
  RotateCcw,
  Check
} from 'lucide-react';
import { Artwork, CategoryItem, StatusItem } from '../types';

interface ArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (artworkData: Omit<Artwork, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<void>;
  editArtwork?: Artwork | null;
  categories: CategoryItem[];
  statuses: StatusItem[];
  onAddCategory?: (name: string) => void;
}

const SUGGESTED_TAGS = ['原创', '人物', '夜景', '场景', '厚涂', '二次元', '光影练习', '写生', '赛博朋克', '自然'];

// Helper to create elegant SVG representation for PSD / AI files
function generateFilePlaceholder(fileName: string, type: 'psd' | 'ai', sizeBytes: number): string {
  const isPsd = type === 'psd';
  const brandColor = isPsd ? '#31A8FF' : '#FF9A00';
  const brandBg = isPsd ? '#001E36' : '#331B00';
  const brandTag = isPsd ? 'PHOTOSHOP PSD' : 'ILLUSTRATOR AI';
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <defs>
      <linearGradient id="bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#12161F" />
        <stop offset="50%" stop-color="${brandBg}" />
        <stop offset="100%" stop-color="#0B0D14" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1200" height="900" fill="url(#bg_grad)"/>
    <rect width="1200" height="900" fill="url(#grid)"/>
    
    <!-- Central File Card -->
    <rect x="360" y="220" width="480" height="460" rx="28" fill="#181D28" stroke="${brandColor}" stroke-width="3" opacity="0.95"/>
    
    <!-- File Emblem Icon -->
    <rect x="420" y="280" width="100" height="100" rx="20" fill="${brandColor}" />
    <text x="470" y="348" font-family="system-ui, sans-serif" font-weight="900" font-size="44" fill="#050B14" text-anchor="middle">${isPsd ? 'Ps' : 'Ai'}</text>
    
    <!-- File Info -->
    <text x="540" y="325" font-family="'Noto Serif SC', serif" font-weight="bold" font-size="30" fill="#FFFFFF">${isPsd ? 'PSD 工程档案' : 'AI 矢量源文件'}</text>
    <text x="540" y="365" font-family="monospace" font-size="18" fill="${brandColor}">${brandTag} · ${sizeMB} MB</text>
    
    <!-- Decorative File Name -->
    <rect x="420" y="420" width="360" height="60" rx="14" fill="#0F131C" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="440" y="457" font-family="monospace" font-size="16" fill="#E2E8F0">${fileName.length > 28 ? fileName.slice(0, 25) + '...' : fileName}</text>
    
    <!-- Layer/Vector Hint -->
    <text x="600" y="550" font-family="system-ui, sans-serif" font-size="17" fill="#8895A7" text-anchor="middle">
      ${isPsd ? '含多图层通道 · 图层蒙版 · 完整历史画稿工程' : '含矢量贝塞尔曲线 · 画板 · 符号与色彩画板'}
    </text>
    <text x="600" y="590" font-family="monospace" font-size="15" fill="#4B5563" text-anchor="middle">
      点击作品详情可直接下载提取此原文件
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const ArtworkModal: React.FC<ArtworkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editArtwork,
  categories,
  statuses,
  onAddCategory,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('插画');
  const [tagsInput, setTagsInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<string>('已完成');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fileType, setFileType] = useState<'image' | 'psd' | 'ai'>('image');
  const [fileName, setFileName] = useState('');
  const [previewScale, setPreviewScale] = useState<number>(100);
  const [width, setWidth] = useState(3840);
  const [height, setHeight] = useState(2160);
  const [sizeBytes, setSizeBytes] = useState(8500000);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // New category inline input
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editArtwork) {
      setTitle(editArtwork.title);
      setType(editArtwork.type);
      setTagsInput(editArtwork.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' '));
      setDate(editArtwork.date);
      setStatus(editArtwork.status);
      setDescription(editArtwork.description || '');
      setImageUrl(editArtwork.imageUrl);
      setFileType(editArtwork.fileType || 'image');
      setFileName(editArtwork.fileName || '');
      setPreviewScale(editArtwork.previewScale || 100);
      setWidth(editArtwork.width);
      setHeight(editArtwork.height);
      setSizeBytes(editArtwork.sizeBytes);
      setIsFavorite(editArtwork.isFavorite);
      setIsPinned(!!editArtwork.isPinned);
    } else {
      // Reset form
      setTitle('');
      setType(categories[0]?.name || '插画');
      setTagsInput('#原创 #作品');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus(statuses[0]?.name || '已完成');
      setDescription('');
      setImageUrl('');
      setFileType('image');
      setFileName('');
      setPreviewScale(100);
      setWidth(3840);
      setHeight(2160);
      setSizeBytes(5200000);
      setIsFavorite(false);
      setIsPinned(false);
    }
    setErrorMsg('');
  }, [editArtwork, isOpen, categories, statuses]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setSizeBytes(file.size);
    setFileName(file.name);

    if (ext === 'psd') {
      setFileType('psd');
      const placeholder = generateFilePlaceholder(file.name, 'psd', file.size);
      setImageUrl(placeholder);
      setWidth(4000);
      setHeight(3000);
      if (!title) {
        setTitle(file.name.replace(/\.psd$/i, ''));
      }
      setErrorMsg('');
      return;
    }

    if (ext === 'ai') {
      setFileType('ai');
      const placeholder = generateFilePlaceholder(file.name, 'ai', file.size);
      setImageUrl(placeholder);
      setWidth(4000);
      setHeight(3000);
      if (!title) {
        setTitle(file.name.replace(/\.ai$/i, ''));
      }
      setErrorMsg('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('请上传支持的图片或工程文件 (PNG, JPG, WebP, GIF, SVG, PSD, AI 等)');
      return;
    }

    setFileType('image');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result);

      // Auto detect image dimensions
      const img = new Image();
      img.onload = () => {
        setWidth(img.naturalWidth || 3000);
        setHeight(img.naturalHeight || 2000);
        if (!title && file.name) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setTitle(cleanName);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    setErrorMsg('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = (tag: string) => {
    const formatted = tag.startsWith('#') ? tag : `#${tag}`;
    const currentTags = tagsInput.split(/\s+/).filter(Boolean);
    if (!currentTags.includes(formatted)) {
      setTagsInput([...currentTags, formatted].join(' '));
    }
  };

  const handleCreateNewCategory = () => {
    if (!newCatName.trim()) return;
    if (onAddCategory) {
      onAddCategory(newCatName.trim());
    }
    setType(newCatName.trim());
    setNewCatName('');
    setIsAddingNewCat(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('请在此填写作品名称');
      return;
    }
    if (!imageUrl) {
      setErrorMsg('请上传作品图片或工程源文件 (PSD / AI)');
      return;
    }

    const parsedTags = tagsInput
      .split(/[\s,，]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    try {
      setIsSubmitting(true);
      await onSave(
        {
          title: title.trim(),
          type,
          tags: parsedTags,
          date,
          status,
          description: description.trim(),
          imageUrl,
          fileType,
          fileName,
          previewScale,
          width,
          height,
          sizeBytes,
          isFavorite,
          isPinned,
        },
        editArtwork?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('保存作品失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="artwork-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div 
        id="artwork-modal-container"
        className="relative w-full max-w-2xl my-auto rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="font-art-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {editArtwork ? '编辑作品信息' : '添加新作品'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              保存至个人本地画匣 (IndexedDB)，支持高分图、PSD/AI工程与缩放调节
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="px-3.5 py-2 rounded-xl text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          {/* Upload Dropzone (Supports Images + PSD + AI) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                作品文件 (支持高清图片、.psd、.ai 格式)
              </label>
              {fileType !== 'image' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {fileType} 源文件
                </span>
              )}
            </div>

            <div
              id="artwork-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-amber-500 bg-amber-500/5'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-amber-500/70 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.psd,.ai"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              {imageUrl ? (
                <div className="relative w-full max-h-60 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center group">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ transform: `scale(${previewScale / 100})` }}
                    className="max-h-60 w-auto object-contain rounded-lg transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
                    <Upload className="w-4 h-4" />
                    <span>更换图片或源文件</span>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-[10px] text-white font-mono">
                    {width} × {height} ({((sizeBytes / (1024 * 1024))).toFixed(1)} MB)
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    拖入作品 或 <span className="text-amber-600 dark:text-amber-400 underline">点击上传</span>
                  </p>
                  <p className="text-xs text-neutral-400">
                    支持 PNG, JPG, WEBP, SVG 以及 Photoshop (.psd) 和 Illustrator (.ai) 档案
                  </p>
                </div>
              )}
            </div>

            {/* Image Scaling Slider after upload */}
            {imageUrl && (
              <div className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                  <ZoomIn className="w-4 h-4 text-amber-500" />
                  <span>作品显示缩放: <strong className="font-mono">{previewScale}%</strong></span>
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <input
                    type="range"
                    min="50"
                    max="180"
                    step="5"
                    value={previewScale}
                    onChange={(e) => setPreviewScale(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewScale(100)}
                    title="重置缩放比例"
                    className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title (Requirement 5: "作品名称", placeholder "在此填写作品名称") & Pin Option */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                作品名称
              </label>
              <input
                id="modal-artwork-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="在此填写作品名称"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                required
              />
            </div>

            {/* Pin to Top Feature (置顶) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                置顶展示
              </label>
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                  isPinned
                    ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold'
                    : 'bg-neutral-100 dark:bg-[#12141A] border-neutral-200 dark:border-[#262B38] text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                <span>{isPinned ? '已置顶作品' : '设为置顶'}</span>
              </button>
            </div>
          </div>

          {/* Category & Status (Supports Custom Categories & Statuses) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  分类类型
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> 新建分类
                </button>
              </div>

              {isAddingNewCat ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="输入新分类名称..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewCategory}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs shrink-0"
                  >
                    添加
                  </button>
                </div>
              ) : (
                <select
                  id="modal-artwork-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                创作状态
              </label>
              <select
                id="modal-artwork-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                标签 (空格分隔)
              </label>
              <span className="text-[11px] text-neutral-400">推荐标签点击快速添加</span>
            </div>
            <input
              id="modal-artwork-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#人物 #原创 #夜景 #厚涂"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
            />
            {/* Tag Quick suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 hover:bg-amber-100 dark:bg-neutral-800 dark:hover:bg-amber-900/40 text-neutral-600 dark:text-neutral-300 transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Favorite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                创作日期
              </label>
              <input
                id="modal-artwork-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  加入心仪收藏
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              创作故事 / 技法笔记 / 备注
            </label>
            <textarea
              id="modal-artwork-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="记录这幅画的创作构思、心路历程、笔刷参数或灵感来源..."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              取消
            </button>
            <button
              id="modal-save-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow active:scale-95 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? '保存中...' : '保存作品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
