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
  Check,
  Trash2,
  Files
} from 'lucide-react';
import { Artwork, CategoryItem, StatusItem } from '../types';

export interface BatchFileItem {
  id: string;
  file: File;
  title: string;
  imageUrl: string;
  fileType: 'image' | 'psd' | 'ai';
  fileName: string;
  width: number;
  height: number;
  sizeBytes: number;
}

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
  const [batchProgress, setBatchProgress] = useState('');
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // New category inline input
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Custom Tag input state (Requirement 1)
  const [customTagInput, setCustomTagInput] = useState('');
  const [userCustomTags, setUserCustomTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('art_vault_custom_user_tags');
    return saved ? JSON.parse(saved) : [];
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setBatchFiles([]);
    setBatchProgress('');
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
      // Reset form - start with empty tags so user chooses their own
      setTitle('');
      setType(categories[0]?.name || '插画');
      setTagsInput('');
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

  const processSingleFile = (file: File): Promise<BatchFileItem> => {
    return new Promise((resolve, reject) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const id = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      if (ext === 'psd') {
        const placeholder = generateFilePlaceholder(file.name, 'psd', file.size);
        resolve({
          id,
          file,
          title: cleanName,
          imageUrl: placeholder,
          fileType: 'psd',
          fileName: file.name,
          width: 4000,
          height: 3000,
          sizeBytes: file.size,
        });
        return;
      }

      if (ext === 'ai') {
        const placeholder = generateFilePlaceholder(file.name, 'ai', file.size);
        resolve({
          id,
          file,
          title: cleanName,
          imageUrl: placeholder,
          fileType: 'ai',
          fileName: file.name,
          width: 4000,
          height: 3000,
          sizeBytes: file.size,
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error(`不支持的文件格式: ${file.name}`));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({
            id,
            file,
            title: cleanName,
            imageUrl: result,
            fileType: 'image',
            fileName: file.name,
            width: img.naturalWidth || 3000,
            height: img.naturalHeight || 2000,
            sizeBytes: file.size,
          });
        };
        img.onerror = () => {
          resolve({
            id,
            file,
            title: cleanName,
            imageUrl: result,
            fileType: 'image',
            fileName: file.name,
            width: 3000,
            height: 2000,
            sizeBytes: file.size,
          });
        };
        img.src = result;
      };
      reader.onerror = () => reject(new Error(`读取失败: ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const handleFilesProcess = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setErrorMsg('');

    if (files.length === 1 && batchFiles.length === 0) {
      // Single file upload
      try {
        const item = await processSingleFile(files[0]);
        setSizeBytes(item.sizeBytes);
        setFileName(item.fileName);
        setFileType(item.fileType);
        setImageUrl(item.imageUrl);
        setWidth(item.width);
        setHeight(item.height);
        if (!title) {
          setTitle(item.title);
        }
      } catch (err: any) {
        setErrorMsg(err.message || '文件解析失败');
      }
      return;
    }

    // Multiple files batch upload
    try {
      const results = await Promise.allSettled(files.map((f) => processSingleFile(f)));
      const successfulItems: BatchFileItem[] = [];
      const failedNames: string[] = [];

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          successfulItems.push(res.value);
        } else {
          failedNames.push(files[idx].name);
        }
      });

      if (failedNames.length > 0) {
        setErrorMsg(`已跳过不支持的文件: ${failedNames.join(', ')}`);
      }

      if (successfulItems.length > 0) {
        setBatchFiles((prev) => {
          const combined = [...prev, ...successfulItems];
          if (!imageUrl && combined.length > 0) {
            setImageUrl(combined[0].imageUrl);
            setFileType(combined[0].fileType);
            setFileName(combined[0].fileName);
            setWidth(combined[0].width);
            setHeight(combined[0].height);
            setSizeBytes(combined[0].sizeBytes);
            if (!title) setTitle(combined[0].title);
          }
          return combined;
        });
      }
    } catch (err: any) {
      setErrorMsg('批量处理文件时出错');
    }
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length === 1) {
        const single = filtered[0];
        setTitle(single.title);
        setImageUrl(single.imageUrl);
        setFileType(single.fileType);
        setFileName(single.fileName);
        setWidth(single.width);
        setHeight(single.height);
        setSizeBytes(single.sizeBytes);
      } else if (filtered.length === 0) {
        setImageUrl('');
        setFileName('');
        setTitle('');
      }
      return filtered;
    });
  };

  const handleUpdateBatchTitle = (id: string, newTitle: string) => {
    setBatchFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesProcess(Array.from(e.dataTransfer.files));
    }
  };

  const handleToggleTag = (tag: string) => {
    const clean = tag.replace(/^#/, '');
    const formatted = `#${clean}`;
    const currentTags = tagsInput.split(/\s+/).filter(Boolean);
    if (currentTags.includes(formatted)) {
      setTagsInput(currentTags.filter((t) => t !== formatted).join(' '));
    } else {
      setTagsInput([...currentTags, formatted].join(' '));
    }
  };

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim().replace(/^#/, '');
    if (!clean) return;
    const formatted = `#${clean}`;
    const currentTags = tagsInput.split(/\s+/).filter(Boolean);
    if (!currentTags.includes(formatted)) {
      setTagsInput([...currentTags, formatted].join(' '));
    }
    if (!userCustomTags.includes(clean) && !SUGGESTED_TAGS.includes(clean)) {
      const updated = [clean, ...userCustomTags];
      setUserCustomTags(updated);
      localStorage.setItem('art_vault_custom_user_tags', JSON.stringify(updated));
    }
    setCustomTagInput('');
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

    const parsedTags = tagsInput
      .split(/[\s,，]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    // Multi-file batch submission
    if (batchFiles.length > 1) {
      try {
        setIsSubmitting(true);
        for (let i = 0; i < batchFiles.length; i++) {
          const item = batchFiles[i];
          setBatchProgress(`正在保存第 ${i + 1}/${batchFiles.length} 张: 《${item.title}》...`);
          await onSave({
            title: item.title.trim() || `作品_${i + 1}`,
            type,
            tags: parsedTags,
            date,
            status,
            description: description.trim(),
            imageUrl: item.imageUrl,
            fileType: item.fileType,
            fileName: item.fileName,
            previewScale,
            width: item.width,
            height: item.height,
            sizeBytes: item.sizeBytes,
            isFavorite,
            isPinned,
          });
        }
        onClose();
      } catch (err) {
        console.error(err);
        setErrorMsg('批量保存部分作品失败，请重试');
      } finally {
        setIsSubmitting(false);
        setBatchProgress('');
      }
      return;
    }

    // Single-file submission
    if (!title.trim()) {
      setErrorMsg('请在此填写作品名称');
      return;
    }
    if (!imageUrl) {
      setErrorMsg('请上传作品图片或工程源文件 (PSD / AI)');
      return;
    }

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
        className="relative w-full max-w-2xl my-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="font-art-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {batchFiles.length > 1 
                ? `批量录入作品 (${batchFiles.length} 件)` 
                : (editArtwork ? '编辑作品信息' : '添加新作品')}
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
              {batchFiles.length > 1
                ? '支持多张图片/工程源文件同时上传，统一归类存档至个人画匣'
                : '保存至个人本地画匣 (IndexedDB)，支持高分图、PSD/AI工程与多文件批量录入'}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="px-3.5 py-2 rounded-xl text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          {/* Upload Dropzone (Supports Single & Multiple Images + PSD + AI) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                作品文件 (支持多选、拖入多个文件、.psd、.ai 格式)
              </label>
              {fileType !== 'image' && batchFiles.length <= 1 && (
                <span 
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                    color: 'var(--accent-gold)',
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase border"
                >
                  {fileType} 源文件
                </span>
              )}
            </div>

            {batchFiles.length > 1 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full text-white shadow-xs"
                      style={{ backgroundColor: 'var(--accent-gold)' }}
                    >
                      <Files className="w-3.5 h-3.5" />
                      <span>已选 {batchFiles.length} 个文件 (批量录入)</span>
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      可在此直接修改各画作专属标题
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs font-medium hover:underline cursor-pointer"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    <Plus className="w-3.5 h-3.5" /> 继续追加文件
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 rounded-2xl border border-neutral-200 dark:border-[#262B38] p-2.5 bg-neutral-50/70 dark:bg-[#12141A]/70">
                  {batchFiles.map((item, idx) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#181B22] border border-neutral-200 dark:border-[#262B38] shadow-xs"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 flex items-center justify-center">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                        />
                        {item.fileType !== 'image' && (
                          <span 
                            style={{ backgroundColor: 'var(--accent-gold)' }}
                            className="absolute bottom-0 right-0 text-[8px] font-bold px-1 rounded-tl uppercase text-white"
                          >
                            {item.fileType}
                          </span>
                        )}
                      </div>

                      {/* Title input */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-neutral-400">作品 #{idx + 1}</span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {item.width}×{item.height} · {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateBatchTitle(item.id, e.target.value)}
                          placeholder="在此填写此张作品名称"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBatchItem(item.id)}
                        title="从本次批量中移除"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  💡 提示：下方的分类、状态、日期、标签与故事将批量应用至这 {batchFiles.length} 张作品，保存后将自动分别独立建档。
                </p>
              </div>
            ) : (
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
                      <span>更换图片或源文件 (可多选)</span>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-[10px] text-white font-mono">
                      {width} × {height} ({((sizeBytes / (1024 * 1024))).toFixed(1)} MB)
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center text-center gap-2">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                        color: 'var(--accent-gold)',
                      }}
                    >
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      拖入作品 (支持多文件) 或 <span style={{ color: 'var(--accent-gold)' }} className="underline">点击上传</span>
                    </p>
                    <p className="text-xs text-neutral-400">
                      支持 PNG, JPG, WEBP, SVG 以及 Photoshop (.psd) 和 Illustrator (.ai) 档案，可一次选择多个文件批量上传
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Hidden multi-file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.psd,.ai"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesProcess(Array.from(e.target.files));
                }
              }}
            />

            {/* Image Scaling Slider after single upload */}
            {imageUrl && batchFiles.length <= 1 && (
              <div className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                  <ZoomIn className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
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
                    style={{ accentColor: 'var(--accent-gold)' }}
                    className="w-full cursor-pointer"
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

          {/* Title & Pin Option (Title shown for single file, individual titles shown in batch list) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            {batchFiles.length <= 1 ? (
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
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  required
                />
              </div>
            ) : (
              <div className="sm:col-span-2 p-3 rounded-xl bg-neutral-50 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                <Files className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>批量录入模式中，每件作品的标题已在上方清单中分别命名。</span>
              </div>
            )}

            {/* Pin to Top Feature (置顶) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                置顶展示
              </label>
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                style={{
                  backgroundColor: isPinned ? 'color-mix(in srgb, var(--accent-gold) 15%, transparent)' : undefined,
                  borderColor: isPinned ? 'var(--accent-gold)' : undefined,
                  color: isPinned ? 'var(--accent-gold)' : undefined,
                }}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                  isPinned
                    ? 'font-semibold'
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
                  style={{ color: 'var(--accent-gold)' }}
                  className="text-[11px] font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
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
                    style={{ borderColor: 'var(--accent-gold)' }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-[#12141A] border focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewCategory}
                    style={{ backgroundColor: 'var(--accent-gold)' }}
                    className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold shrink-0 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  >
                    添加
                  </button>
                </div>
              ) : (
                <select
                  id="modal-artwork-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  style={{
                    borderColor: 'var(--card-border)',
                  }}
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
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none"
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
                标签便签 (空格或回车分隔)
              </label>
              <span className="text-[11px] text-neutral-400">点击标签即可自由选中或取消</span>
            </div>
            <input
              id="modal-artwork-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="请输入或选择便签，如: #人物 #场景 #二次元"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none font-mono"
            />

            {/* Custom Tag Name input & Add Button (Requirement 1) */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="输入自定义便签/标签名，回车或点击添加..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                style={{ backgroundColor: 'var(--accent-gold)' }}
                className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold shrink-0 hover:opacity-90 transition-opacity flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 添加便签
              </button>
            </div>

            {/* Combined Tag Suggestions & Custom Tags as Interactive Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {Array.from(new Set([...userCustomTags, ...SUGGESTED_TAGS])).map((tag) => {
                const isSelected = tagsInput.split(/\s+/).some((t) => t.replace(/^#/, '') === tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-gold)' : undefined,
                      borderColor: isSelected ? 'var(--accent-gold)' : undefined,
                      color: isSelected ? '#FFFFFF' : undefined,
                    }}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'shadow-2xs font-semibold'
                        : 'bg-neutral-100 hover:opacity-80 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {isSelected ? `✓ #${tag}` : `+#${tag}`}
                  </button>
                );
              })}
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
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none font-mono"
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  style={{ accentColor: 'var(--accent-gold)' }}
                  className="w-4 h-4 rounded"
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
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-100 dark:bg-[#12141A] border border-neutral-200 dark:border-[#262B38] text-neutral-900 dark:text-neutral-100 focus:outline-none"
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
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow active:scale-95 disabled:opacity-50 transition-all"
              style={{
                backgroundColor: 'var(--accent-gold)',
              }}
            >
              {isSubmitting
                ? (batchProgress || '保存中...')
                : batchFiles.length > 1
                  ? `批量存入画匣 (共 ${batchFiles.length} 件作品)`
                  : (editArtwork ? '更新作品' : '保存作品')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
