import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  Heart, 
  Edit3, 
  Download, 
  Trash2, 
  Calendar, 
  Layers, 
  Tag, 
  FileText,
  RotateCcw,
  BookPlus,
  Pin,
  Pipette,
  Copy,
  Plus,
  Check,
  Sliders
} from 'lucide-react';
import { Artwork, DiaryEntry } from '../types';
import { ThemeSlider } from './ThemeSlider';

interface ArtworkDetailModalProps {
  artwork: Artwork | null;
  allArtworks: Artwork[];
  diaries: DiaryEntry[];
  onClose: () => void;
  onSelectArtwork: (artwork: Artwork) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onEdit: (artwork: Artwork) => void;
  onDelete: (id: string) => void;
  onAddDiaryForArtwork: (artwork: Artwork) => void;
  onUpdateArtwork?: (artwork: Artwork) => void;
}

export const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({
  artwork,
  allArtworks,
  diaries,
  onClose,
  onSelectArtwork,
  onToggleFavorite,
  onTogglePin,
  onEdit,
  onDelete,
  onAddDiaryForArtwork,
  onUpdateArtwork,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Color Palette state
  const [newColorHex, setNewColorHex] = useState('#FFFFFF');
  const [copiedColorHex, setCopiedColorHex] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset zoom & pan when switching artworks
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setIsDescriptionExpanded(false);
  }, [artwork?.id]);

  // Keyboard navigation (left/right arrows, esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!artwork) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [artwork, allArtworks]);

  if (!artwork) return null;

  const currentIndex = allArtworks.findIndex((a) => a.id === artwork.id);
  const prevArtwork = currentIndex > 0 ? allArtworks[currentIndex - 1] : null;
  const nextArtwork = currentIndex < allArtworks.length - 1 ? allArtworks[currentIndex + 1] : null;

  const goToPrev = () => {
    if (prevArtwork) onSelectArtwork(prevArtwork);
  };

  const goToNext = () => {
    if (nextArtwork) onSelectArtwork(nextArtwork);
  };

  // Color Palette handlers
  const handleAddColor = () => {
    let hex = newColorHex.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;

    const currentList = artwork?.colorPalette || [];
    const upperHex = hex.toUpperCase();
    if (currentList.includes(upperHex)) return;

    const updatedPalette = [...currentList, upperHex];
    if (artwork) {
      onUpdateArtwork?.({ ...artwork, colorPalette: updatedPalette });
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    if (!artwork) return;
    const updatedPalette = (artwork.colorPalette || []).filter((c) => c !== colorToRemove);
    onUpdateArtwork?.({ ...artwork, colorPalette: updatedPalette });
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColorHex(hex);
    setTimeout(() => setCopiedColorHex(null), 2000);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.3, 4));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.3, 0.4));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Download image, video, or raw source file
  const handleDownload = () => {
    const link = document.createElement('a');
    let blobUrlCreated = false;
    if (artwork.imageBlob && artwork.imageBlob instanceof Blob) {
      link.href = URL.createObjectURL(artwork.imageBlob);
      blobUrlCreated = true;
    } else {
      link.href = artwork.imageUrl;
    }
    const ext = artwork.fileType === 'psd'
      ? 'psd'
      : artwork.fileType === 'ai'
      ? 'ai'
      : artwork.fileType === 'video'
      ? 'mp4'
      : artwork.fileType === 'gif'
      ? 'gif'
      : 'png';
    const name = artwork.fileName || `${artwork.title.replace(/\s+/g, '_')}_${artwork.date}.${ext}`;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (blobUrlCreated) {
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    }
  };

  // Related diaries
  const relatedDiaries = diaries.filter((d) => d.artworkId === artwork.id);

  return (
    <div
      ref={containerRef}
      id="artwork-detail-lightbox"
      className="fixed inset-0 z-50 flex flex-col lg:flex-row backdrop-blur-md text-neutral-100 overflow-hidden select-none animate-in fade-in duration-200"
      style={{ backgroundColor: 'var(--modal-bg)' }}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 sm:p-4 bg-gradient-to-b from-black/85 via-black/50 to-transparent pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
          {artwork.isPinned && (
            <span
              style={{ backgroundColor: 'var(--accent-gold)' }}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-white shadow-xs shrink-0"
            >
              <Pin className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
              <span className="hidden xs:inline">已置顶</span>
            </span>
          )}
          <span className="font-art-serif text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-[120px] sm:max-w-xs md:max-w-md">
            {artwork.title}
          </span>
          <span className="text-[11px] sm:text-xs font-mono text-neutral-400 hidden sm:inline shrink-0">
            ({currentIndex + 1} / {allArtworks.length})
          </span>
        </div>

        {/* View Tools */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onTogglePin && (
            <button
              onClick={() => onTogglePin(artwork.id)}
              title={artwork.isPinned ? '取消置顶' : '置顶本作品'}
              style={{
                backgroundColor: artwork.isPinned ? 'var(--accent-gold)' : undefined,
              }}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                artwork.isPinned ? 'text-white shadow-xs' : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${artwork.isPinned ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            onClick={handleZoomOut}
            title="缩小"
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[11px] sm:text-xs font-mono px-0.5 sm:px-1 text-neutral-300 min-w-[34px] sm:min-w-[42px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="放大"
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="重置缩放"
            className="hidden sm:inline-flex p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            title="旋转 90°"
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title="全屏模式"
            className="hidden sm:inline-flex p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="关闭 (Esc)"
            className="p-1.5 sm:p-2 ml-1 sm:ml-2 rounded-full bg-white/20 hover:bg-rose-600 text-white transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage (Left / Center) */}
      <div
        className={`relative flex-1 h-[52vh] sm:h-[60vh] lg:h-full flex items-center justify-center overflow-hidden p-2 sm:p-4 ${
          zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Navigation Arrow Left */}
        {prevArtwork && (
          <button
            onClick={goToPrev}
            aria-label="上一件作品"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {nextArtwork && (
          <button
            onClick={goToNext}
            aria-label="下一件作品"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* The Display Image / Video with Smooth Zoom/Pan/Rotation & Scaler */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel * ((artwork.previewScale || 100) / 100)}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 200ms ease-out',
          }}
          className="max-h-[85%] max-w-[85%] flex items-center justify-center select-none"
        >
          {artwork.fileType === 'video' ? (
            <video
              src={artwork.imageUrl}
              controls
              autoPlay
              loop
              playsInline
              className="max-h-[80vh] max-w-[80vw] object-contain shadow-2xl rounded-lg pointer-events-auto"
            />
          ) : (
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="max-h-[80vh] max-w-[80vw] object-contain shadow-2xl rounded-lg pointer-events-none"
            />
          )}
        </div>
      </div>

      {/* Detail Metadata Sidebar (Right / Bottom) */}
      <div
        id="artwork-detail-sidebar"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          color: 'var(--text-main)',
        }}
        className="w-full lg:w-96 shrink-0 h-[48vh] sm:h-[40vh] lg:h-full border-t lg:border-t-0 lg:border-l p-4 sm:p-6 flex flex-col justify-between overflow-y-auto transition-colors duration-200"
      >
        <div className="space-y-6">
          {/* Title & Favorite */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 style={{ color: 'var(--text-main)' }} className="font-art-serif text-2xl font-bold leading-tight">
                  {artwork.title}
                </h2>
                {artwork.fileName && (
                  <span style={{ color: 'var(--text-muted)' }} className="text-[11px] font-mono block mt-0.5">
                    源文件: {artwork.fileName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {onTogglePin && (
                  <button
                    onClick={() => onTogglePin(artwork.id)}
                    style={{
                      backgroundColor: artwork.isPinned ? 'var(--accent-gold)' : 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
                      color: artwork.isPinned ? '#FFFFFF' : 'var(--text-muted)',
                    }}
                    className={`p-2.5 rounded-full transition-all cursor-pointer ${
                      artwork.isPinned ? 'shadow-xs' : 'hover:opacity-80'
                    }`}
                    title={artwork.isPinned ? '已置顶 (点击取消)' : '置顶本作品'}
                  >
                    <Pin className={`w-5 h-5 ${artwork.isPinned ? 'fill-current' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => onToggleFavorite(artwork.id)}
                  style={{
                    backgroundColor: artwork.isFavorite ? '#F43F5E' : 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
                    color: artwork.isFavorite ? '#FFFFFF' : 'var(--text-muted)',
                  }}
                  className={`p-2.5 rounded-full transition-all cursor-pointer ${
                    artwork.isFavorite ? 'shadow-xs' : 'hover:opacity-80'
                  }`}
                  title={artwork.isFavorite ? '已收藏' : '加入收藏'}
                >
                  <Heart className={`w-5 h-5 ${artwork.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-mono mt-1">
              创作于 {artwork.date}
            </p>
          </div>

          {/* Tags */}
          <div className="pb-3 border-b" style={{ borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, var(--card-border))' }}>
            <div className="flex flex-wrap gap-1.5">
              {artwork.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    color: 'var(--accent-gold)',
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 45%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, var(--card-bg))',
                  }}
                  className="text-xs px-2.5 py-1 rounded-full font-mono border"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          </div>

          {/* Specification Grid */}
          <div
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 5%, var(--card-bg))',
              borderColor: 'var(--card-border)',
            }}
            className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border text-xs"
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }} className="block">作品类型</span>
              <span style={{ color: 'var(--text-main)' }} className="font-medium mt-0.5 block">{artwork.type}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }} className="block">原始尺寸</span>
              <span style={{ color: 'var(--text-main)' }} className="font-mono mt-0.5 block">{artwork.width} × {artwork.height}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }} className="block">创作状态</span>
              <span style={{ color: 'var(--text-main)' }} className="font-medium mt-0.5 block">
                {artwork.status}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }} className="block">画质容量</span>
              <span style={{ color: 'var(--text-main)' }} className="font-mono mt-0.5 block">
                {(artwork.sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          </div>

          {/* Interactive Creation Progress Bar */}
          <div>
            <ThemeSlider
              label="创作完成进度"
              icon={<Sliders className="w-3.5 h-3.5" />}
              value={typeof artwork.progress === 'number' ? artwork.progress : (artwork.status === '已完成' ? 100 : artwork.status === '草稿' ? 20 : 60)}
              onChange={(newProg) => {
                if (!artwork || !onUpdateArtwork) return;
                const newStatus = newProg === 100 ? '已完成' : (artwork.status === '已完成' ? '创作中' : artwork.status);
                onUpdateArtwork({
                  ...artwork,
                  progress: newProg,
                  status: newStatus,
                });
              }}
              min={0}
              max={100}
              step={5}
              unit="%"
              description="拖动滑动条调整创作进度，点击右侧数值可直接键盘输入自定义进度"
            />
          </div>

          {/* Color Palette Section */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h4 style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Pipette className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                作品配色色卡 ({(artwork.colorPalette || []).length})
              </h4>
              {copiedColorHex && (
                <span className="text-[11px] font-mono font-medium text-emerald-500 flex items-center gap-1 animate-in fade-in duration-150">
                  <Check className="w-3 h-3" /> 已复制 {copiedColorHex}
                </span>
              )}
            </div>

            {/* Swatches Grid */}
            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 5%, var(--card-bg))',
                borderColor: 'var(--card-border)',
              }}
              className="flex flex-wrap gap-2 p-3 rounded-2xl border"
            >
              {(artwork.colorPalette || []).length > 0 ? (
                (artwork.colorPalette || []).map((hex, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                    }}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border hover:border-amber-500/60 transition-all shadow-2xs cursor-pointer"
                    onClick={() => handleCopyColor(hex)}
                    title={`点击复制色值 ${hex}`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shadow-inner shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span style={{ color: 'var(--text-main)' }} className="text-xs font-mono uppercase font-medium">{hex}</span>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveColor(hex);
                      }}
                      style={{ color: 'var(--text-muted)' }}
                      className="p-0.5 rounded-full hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                      title="删除此色卡"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)' }} className="text-xs py-1 font-light italic">
                  尚未添加配色色卡，可通过下方选择颜色并添加
                </div>
              )}
            </div>

            {/* Add Color Controls */}
            <div className="flex items-center gap-2">
              <div
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
                className="relative flex items-center gap-1.5 p-1 px-2 rounded-xl border flex-1"
              >
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-6 h-6 rounded-lg border-0 bg-transparent cursor-pointer p-0 shrink-0"
                  title="拾色器选择颜色"
                />
                <input
                  type="text"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  placeholder="#E63946"
                  maxLength={7}
                  style={{ color: 'var(--text-main)' }}
                  className="w-full text-xs font-mono bg-transparent focus:outline-none uppercase"
                />
              </div>

              <button
                type="button"
                onClick={handleAddColor}
                style={{ backgroundColor: 'var(--accent-gold)' }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加色卡</span>
              </button>
            </div>
          </div>

          {/* Story / Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                创作与说明
              </h4>
              {artwork.description && artwork.description.length > 70 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  style={{ color: 'var(--accent-gold)' }}
                  className="text-[11px] font-medium hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                >
                  {isDescriptionExpanded ? '收起' : '展开全文'}
                </button>
              )}
            </div>

            {artwork.description ? (
              <div
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 5%, var(--card-bg))',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
                className="p-3 rounded-xl border transition-all"
              >
                <p
                  style={{
                    display: isDescriptionExpanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: isDescriptionExpanded ? 'unset' : 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                  className="text-sm leading-relaxed font-light whitespace-pre-wrap select-text"
                  title={!isDescriptionExpanded ? artwork.description : undefined}
                >
                  {artwork.description}
                </p>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 3%, var(--card-bg))',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-muted)',
                }}
                className="p-3 rounded-xl border text-xs italic font-light"
              >
                暂无创作与说明备注
              </div>
            )}
          </div>

          {/* Associated Diaries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <BookPlus className="w-3.5 h-3.5" />
                关联创作日志 ({relatedDiaries.length})
              </h4>
              <button
                onClick={() => onAddDiaryForArtwork(artwork)}
                style={{ color: 'var(--accent-gold)' }}
                className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80 cursor-pointer"
              >
                + 写这幅画的日志
              </button>
            </div>

            {relatedDiaries.length > 0 ? (
              <div className="space-y-2">
                {relatedDiaries.map((diary) => (
                  <div
                    key={diary.id}
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-gold) 5%, var(--card-bg))',
                      borderColor: 'var(--card-border)',
                    }}
                    className="p-3 rounded-xl border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span style={{ color: 'var(--text-main)' }}>{diary.title}</span>
                      <span style={{ color: 'var(--text-muted)' }} className="font-mono text-[11px]">{diary.date}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)' }} className="line-clamp-2 leading-relaxed font-light">
                      {diary.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => onAddDiaryForArtwork(artwork)}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 5%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                  color: 'var(--accent-gold)',
                }}
                className="w-full text-xs italic p-3 rounded-xl border border-dashed text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookPlus className="w-3.5 h-3.5" />
                尚未记录这幅画的日志，点击添加日记
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Edit, Download, Delete */}
        <div 
          className="pt-6 border-t flex items-center gap-2"
          style={{ borderColor: 'color-mix(in srgb, var(--accent-gold) 25%, var(--card-border))' }}
        >
          <button
            id="btn-detail-edit"
            onClick={() => onEdit(artwork)}
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
              color: 'var(--text-main)',
              borderColor: 'var(--card-border)',
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer hover:opacity-90"
          >
            <Edit3 className="w-4 h-4" />
            <span>编辑信息</span>
          </button>
          
          <button
            id="btn-detail-download"
            onClick={handleDownload}
            style={{
              backgroundColor: 'var(--accent-gold)',
              boxShadow: '0 4px 16px color-mix(in srgb, var(--accent-gold) 30%, transparent)',
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{artwork.fileType === 'psd' ? '下载 PSD 档案' : artwork.fileType === 'ai' ? '下载 AI 档案' : '下载原图'}</span>
          </button>

          <button
            id="btn-detail-delete"
            onClick={() => onDelete(artwork.id)}
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
              color: 'var(--text-muted)',
            }}
            className="p-2.5 rounded-xl hover:bg-rose-600/80 hover:text-white transition-colors cursor-pointer"
            title="移至回收站"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
