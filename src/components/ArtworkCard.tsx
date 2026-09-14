import React, { useState } from 'react';
import { Heart, Pin, Calendar, Eye, Check, RotateCcw, Trash2 } from 'lucide-react';
import { Artwork, StatusItem } from '../types';

interface ArtworkCardProps {
  artwork: Artwork;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onTogglePin?: (e: React.MouseEvent) => void;
  customStatuses?: StatusItem[];
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  isTrashMode?: boolean;
  onRestore?: (e: React.MouseEvent) => void;
  onPermanentDelete?: (e: React.MouseEvent) => void;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  onClick,
  onToggleFavorite,
  onTogglePin,
  customStatuses,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  isTrashMode,
  onRestore,
  onPermanentDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadge = (statusName: string) => {
    const customMatch = customStatuses?.find((s) => s.name === statusName);
    if (customMatch) {
      const color = customMatch.color || 'amber';
      return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
          color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
          color === 'rose' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
          color === 'sky' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
          color === 'purple' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
          color === 'neutral' ? 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20' :
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        }`}>
          {statusName}
        </span>
      );
    }

    switch (statusName) {
      case 'completed':
      case '已完成':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">已完成</span>;
      case 'in_progress':
      case '创作中':
        return (
          <span 
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
              color: 'var(--accent-gold)',
            }}
          >
            创作中
          </span>
        );
      case 'draft':
      case '草稿':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">草稿</span>;
      case 'abandoned':
      case '废稿':
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">废稿</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">{statusName}</span>;
    }
  };

  return (
    <div
      id={`artwork-card-${artwork.id}`}
      onClick={(e) => {
        if (isSelectionMode && onToggleSelect) {
          onToggleSelect(e);
        } else {
          onClick();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: (isSelected || isHovered || artwork.isPinned) ? 'var(--accent-gold)' : 'var(--card-border)',
        boxShadow: isSelected
          ? '0 0 0 2px var(--accent-gold), 0 10px 25px -5px color-mix(in srgb, var(--accent-gold) 30%, transparent)'
          : isHovered
          ? '0 12px 28px -4px color-mix(in srgb, var(--accent-gold) 25%, transparent), 0 0 0 1.5px var(--accent-gold)'
          : artwork.isPinned
          ? '0 0 0 1.5px var(--accent-gold)'
          : undefined,
      }}
      className={`masonry-item group relative flex flex-col h-full rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer transform hover:-translate-y-1 shadow-xs ${
        isSelected ? 'bg-amber-500/5' : ''
      }`}
    >
      {/* Artwork Image Container with balanced 4/3 mobile ratio */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-[#12141A]">
        <div className="w-full h-full overflow-hidden flex items-center justify-center">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            loading="lazy"
            style={{
              transform: artwork.previewScale ? `scale(${artwork.previewScale / 100})` : undefined,
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </div>

        {/* Selection Checkbox Overlay */}
        {isSelectionMode && (
          <div className="absolute top-2 left-2 z-20 pointer-events-auto">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${
                isSelected
                  ? 'bg-amber-500 border-amber-500 text-white scale-105'
                  : 'bg-black/40 border-white/80 text-transparent hover:border-white'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className={`flex items-center gap-1.5 flex-wrap ${isSelectionMode ? 'ml-7' : ''}`}>
            {/* Pinned Badge */}
            {artwork.isPinned && !isTrashMode && (
              <span 
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm pointer-events-auto"
                style={{ backgroundColor: 'var(--accent-gold)' }}
              >
                <Pin className="w-3 h-3 fill-current" />
                置顶
              </span>
            )}

            {/* Trash Badge */}
            {isTrashMode && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-md text-white shadow-xs">
                已删除
              </span>
            )}

            {/* Type badge */}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-white border border-white/10">
              {artwork.type}
            </span>

            {/* PSD / AI Badge */}
            {artwork.fileType === 'psd' && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                PSD
              </span>
            )}
            {artwork.fileType === 'ai' && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-orange-600 text-white shadow-xs">
                AI
              </span>
            )}
          </div>

          {!isSelectionMode && (
            <div className="flex items-center gap-1 pointer-events-auto">
              {/* Single Restore Button for Recycle Bin */}
              {isTrashMode && onRestore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(e);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95"
                  title="恢复作品"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢复</span>
                </button>
              )}

              {/* Permanent Delete Button for Recycle Bin */}
              {isTrashMode && onPermanentDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPermanentDelete(e);
                  }}
                  className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
                  title="彻底删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Quick Pin Toggle button */}
              {!isTrashMode && onTogglePin && (
                <button
                  type="button"
                  onClick={onTogglePin}
                  aria-label={artwork.isPinned ? '取消置顶' : '置顶作品'}
                  title={artwork.isPinned ? '取消置顶' : '置顶作品'}
                  style={{
                    backgroundColor: artwork.isPinned ? 'var(--accent-gold)' : undefined,
                  }}
                  className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                    artwork.isPinned
                      ? 'text-white shadow-sm scale-105'
                      : 'bg-black/30 hover:bg-black/60 text-white/80 hover:text-white opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${artwork.isPinned ? 'fill-current' : ''}`} />
                </button>
              )}

              {/* Favorite button */}
              {!isTrashMode && onToggleFavorite && (
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-label={artwork.isFavorite ? '取消收藏' : '加入收藏'}
                  className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                    artwork.isFavorite
                      ? 'bg-rose-500/90 text-white shadow-sm scale-105'
                      : 'bg-black/30 hover:bg-black/60 text-white/80 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${artwork.isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none">
          <div className="flex items-center justify-between w-full text-white text-xs">
            <span className="flex items-center gap-1 font-mono text-[11px] opacity-90">
              {artwork.width} × {artwork.height}
            </span>
            <span className="flex items-center gap-1 opacity-90">
              <Eye className="w-3.5 h-3.5" />
              查看详情
            </span>
          </div>
        </div>
      </div>

      {/* Info Body with standardized heights */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-1.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 
              style={{
                color: isHovered ? 'var(--accent-gold)' : undefined,
              }}
              className="font-art-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 transition-colors"
            >
              {artwork.title}
            </h3>
            <div className="shrink-0">
              {getStatusBadge(artwork.status)}
            </div>
          </div>

          <p 
            title={artwork.description || undefined}
            className="text-xs text-neutral-500 dark:text-neutral-400 font-light mt-1 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              textOverflow: 'ellipsis',
              lineHeight: '1.25rem',
              height: '2.5rem',
              minHeight: '2.5rem',
              maxHeight: '2.5rem',
            }}
          >
            {artwork.description || <span className="opacity-30 italic select-none">暂无创作故事 / 技法笔记 / 备注</span>}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 pt-0.5">
          {/* Tags */}
          <div className="flex items-center flex-wrap gap-1 h-5 overflow-hidden">
            {artwork.tags && artwork.tags.length > 0 ? (
              artwork.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-neutral-400 opacity-40 font-mono">无标签</span>
            )}
            {artwork.tags && artwork.tags.length > 3 && (
              <span className="text-[10px] text-neutral-400 font-mono">
                +{artwork.tags.length - 3}
              </span>
            )}
          </div>

          {/* Footer Meta */}
          <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" style={{ color: isHovered ? 'var(--accent-gold)' : undefined }} />
              {artwork.date}
            </span>
            <span>
              {(artwork.sizeBytes / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
