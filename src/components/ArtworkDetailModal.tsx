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
  Pin
} from 'lucide-react';
import { Artwork, DiaryEntry } from '../types';

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
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset zoom & pan when switching artworks
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
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

  // Download image or source file
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = artwork.imageUrl;
    const ext = artwork.fileType === 'psd' ? 'psd' : artwork.fileType === 'ai' ? 'ai' : 'png';
    link.download = `${artwork.title.replace(/\s+/g, '_')}_${artwork.date}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Related diaries
  const relatedDiaries = diaries.filter((d) => d.artworkId === artwork.id);

  return (
    <div
      ref={containerRef}
      id="artwork-detail-lightbox"
      className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-[#0E1015]/95 backdrop-blur-md text-neutral-100 overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <div className="flex items-center gap-3">
          {artwork.isPinned && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
              <Pin className="w-3 h-3 fill-current" />
              已置顶
            </span>
          )}
          <span className="font-art-serif text-base font-bold text-white tracking-wide">
            {artwork.title}
          </span>
          <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
            ({currentIndex + 1} / {allArtworks.length})
          </span>
        </div>

        {/* View Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {onTogglePin && (
            <button
              onClick={() => onTogglePin(artwork.id)}
              title={artwork.isPinned ? '取消置顶' : '置顶本作品'}
              className={`p-2 rounded-full transition-colors ${
                artwork.isPinned ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              <Pin className={`w-4 h-4 ${artwork.isPinned ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            onClick={handleZoomOut}
            title="缩小"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-1 text-neutral-300 min-w-[42px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="放大"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="重置缩放"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            title="旋转 90°"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title="全屏模式"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="关闭 (Esc)"
            className="p-2 ml-2 rounded-full bg-white/20 hover:bg-rose-600 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage (Left / Center) */}
      <div
        className={`relative flex-1 h-[60vh] lg:h-full flex items-center justify-center overflow-hidden p-4 ${
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {nextArtwork && (
          <button
            onClick={goToNext}
            aria-label="下一件作品"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* The Display Image with Smooth Zoom/Pan/Rotation & Scaler */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel * ((artwork.previewScale || 100) / 100)}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 200ms ease-out',
          }}
          className="max-h-[85%] max-w-[85%] flex items-center justify-center pointer-events-none select-none"
        >
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="max-h-[80vh] max-w-[80vw] object-contain shadow-2xl rounded-lg"
          />
        </div>
      </div>

      {/* Detail Metadata Sidebar (Right / Bottom) */}
      <div
        id="artwork-detail-sidebar"
        className="w-full lg:w-96 shrink-0 h-[40vh] lg:h-full bg-[#15181F] border-t lg:border-t-0 lg:border-l border-neutral-800 p-6 flex flex-col justify-between overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Title & Favorite */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-art-serif text-2xl font-bold text-white leading-tight">
                  《{artwork.title}》
                </h2>
                {artwork.fileName && (
                  <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                    源文件: {artwork.fileName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {onTogglePin && (
                  <button
                    onClick={() => onTogglePin(artwork.id)}
                    className={`p-2.5 rounded-full transition-all ${
                      artwork.isPinned ? 'bg-amber-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title={artwork.isPinned ? '已置顶 (点击取消)' : '置顶本作品'}
                  >
                    <Pin className={`w-5 h-5 ${artwork.isPinned ? 'fill-current' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => onToggleFavorite(artwork.id)}
                  className={`p-2.5 rounded-full transition-all ${
                    artwork.isFavorite
                      ? 'bg-rose-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title={artwork.isFavorite ? '已收藏' : '加入收藏'}
                >
                  <Heart className={`w-5 h-5 ${artwork.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              创作于 {artwork.date}
            </p>
          </div>

          {/* Tags */}
          <div>
            <div className="flex flex-wrap gap-1.5">
              {artwork.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-amber-300/90 font-mono border border-neutral-700"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          </div>

          {/* Specification Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs">
            <div>
              <span className="text-neutral-500 block">作品类型</span>
              <span className="font-medium text-neutral-200 mt-0.5 block">{artwork.type}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">原始尺寸</span>
              <span className="font-mono text-neutral-200 mt-0.5 block">{artwork.width} × {artwork.height}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">创作状态</span>
              <span className="font-medium text-neutral-200 mt-0.5 block">
                {artwork.status}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">画质容量</span>
              <span className="font-mono text-neutral-200 mt-0.5 block">
                {(artwork.sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          </div>

          {/* Story / Description */}
          {artwork.description && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                创作心得与说明
              </h4>
              <p className="text-sm text-neutral-300 leading-relaxed font-light p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80">
                {artwork.description}
              </p>
            </div>
          )}

          {/* Associated Diaries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookPlus className="w-3.5 h-3.5" />
                关联创作日志 ({relatedDiaries.length})
              </h4>
              <button
                onClick={() => onAddDiaryForArtwork(artwork)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
              >
                + 写这幅画的日志
              </button>
            </div>

            {relatedDiaries.length > 0 ? (
              <div className="space-y-2">
                {relatedDiaries.map((diary) => (
                  <div
                    key={diary.id}
                    className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-medium text-neutral-200">
                      <span>{diary.title}</span>
                      <span className="text-neutral-500 font-mono text-[11px]">{diary.date}</span>
                    </div>
                    <p className="text-neutral-400 line-clamp-2 leading-relaxed font-light">
                      {diary.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic p-3 rounded-xl bg-neutral-900/30 border border-dashed border-neutral-800 text-center">
                尚未记录这幅画的日志，点击上方按钮记录画师心得
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons: Edit, Download, Delete */}
        <div className="pt-6 border-t border-neutral-800 flex items-center gap-2">
          <button
            id="btn-detail-edit"
            onClick={() => onEdit(artwork)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-neutral-200 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>编辑信息</span>
          </button>
          
          <button
            id="btn-detail-download"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-sm font-medium text-white transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{artwork.fileType === 'psd' ? '下载 PSD 档案' : artwork.fileType === 'ai' ? '下载 AI 档案' : '下载原图'}</span>
          </button>

          <button
            id="btn-detail-delete"
            onClick={() => onDelete(artwork.id)}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-rose-600/80 text-neutral-400 hover:text-white transition-colors"
            title="移至回收站"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
