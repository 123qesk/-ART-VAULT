import React from 'react';
import { Heart, Pin, Calendar, Eye } from 'lucide-react';
import { Artwork, StatusItem } from '../types';

interface ArtworkCardProps {
  artwork: Artwork;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onTogglePin?: (e: React.MouseEvent) => void;
  customStatuses?: StatusItem[];
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  onClick,
  onToggleFavorite,
  onTogglePin,
  customStatuses,
}) => {
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
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">创作中</span>;
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
      onClick={onClick}
      className={`masonry-item group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#181B22] border transition-all duration-300 cursor-pointer transform hover:-translate-y-1 shadow-xs hover:shadow-xl ${
        artwork.isPinned
          ? 'border-amber-400/80 dark:border-amber-500/60 ring-1 ring-amber-400/30'
          : 'border-[#E8E4DC] dark:border-[#262B38]'
      }`}
    >
      {/* Artwork Image Container */}
      <div className="relative w-full overflow-hidden bg-neutral-100 dark:bg-[#12141A]">
        <div className="overflow-hidden flex items-center justify-center">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            loading="lazy"
            style={{
              transform: artwork.previewScale ? `scale(${artwork.previewScale / 100})` : undefined,
            }}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Pinned Badge */}
            {artwork.isPinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-sm pointer-events-auto">
                <Pin className="w-3 h-3 fill-current" />
                置顶
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

          <div className="flex items-center gap-1 pointer-events-auto">
            {/* Quick Pin Toggle button */}
            {onTogglePin && (
              <button
                type="button"
                onClick={onTogglePin}
                aria-label={artwork.isPinned ? '取消置顶' : '置顶作品'}
                title={artwork.isPinned ? '取消置顶' : '置顶作品'}
                className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                  artwork.isPinned
                    ? 'bg-amber-500 text-white shadow-sm scale-105'
                    : 'bg-black/30 hover:bg-black/60 text-white/80 hover:text-white opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${artwork.isPinned ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Favorite button */}
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
          </div>
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

      {/* Info Body */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-art-serif text-base font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {artwork.title}
          </h3>
          <div className="shrink-0">
            {getStatusBadge(artwork.status)}
          </div>
        </div>

        {artwork.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed font-light">
            {artwork.description}
          </p>
        )}

        {/* Tags */}
        {artwork.tags && artwork.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {artwork.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono"
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
            {artwork.tags.length > 3 && (
              <span className="text-[10px] text-neutral-400 self-center">
                +{artwork.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {artwork.date}
          </span>
          <span>
            {(artwork.sizeBytes / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
      </div>
    </div>
  );
};
