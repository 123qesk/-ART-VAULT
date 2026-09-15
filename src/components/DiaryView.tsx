import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Clock, 
  Tag, 
  Edit3, 
  Trash2, 
  Image as ImageIcon,
  Sparkles,
  Link,
  X,
  Check
} from 'lucide-react';
import { DiaryEntry, Artwork } from '../types';

interface DiaryViewProps {
  diaries: DiaryEntry[];
  artworks: Artwork[];
  onSaveDiary: (diary: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<void>;
  onDeleteDiary: (id: string) => Promise<void>;
  onSelectArtwork: (artwork: Artwork) => void;
  preselectedArtwork?: Artwork | null;
  onClearPreselectedArtwork?: () => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  diaries,
  artworks,
  onSaveDiary,
  onDeleteDiary,
  onSelectArtwork,
  preselectedArtwork,
  onClearPreselectedArtwork,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [selectedArtId, setSelectedArtId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [filterArtworkId, setFilterArtworkId] = useState<string>('all');

  // Open modal for creation or edit
  const handleOpenAdd = (associatedArt?: Artwork | null) => {
    setEditingDiary(null);
    setTitle(associatedArt ? `${associatedArt.title} 创作随笔` : '');
    setDate(new Date().toISOString().split('T')[0]);
    setContent('');
    setSelectedArtId(associatedArt?.id || '');
    setTagsInput(associatedArt ? '#技法笔记 #创作心得' : '#日常灵感');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (diary: DiaryEntry) => {
    setEditingDiary(diary);
    setTitle(diary.title);
    setDate(diary.date);
    setContent(diary.content);
    setSelectedArtId(diary.artworkId || '');
    setTagsInput((diary.tags || []).map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' '));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const matchedArt = artworks.find((a) => a.id === selectedArtId);

    const parsedTags = tagsInput
      .split(/[\s,，]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    await onSaveDiary(
      {
        title: title.trim(),
        date,
        content: content.trim(),
        artworkId: matchedArt?.id,
        artworkTitle: matchedArt?.title,
        artworkThumbnail: matchedArt?.imageUrl,
        tags: parsedTags,
      },
      editingDiary?.id
    );

    setIsModalOpen(false);
    onClearPreselectedArtwork?.();
  };

  // Group diaries by Year and Month (e.g., "2026年9月")
  const filteredDiaries = diaries.filter((d) => {
    if (filterArtworkId === 'all') return true;
    return d.artworkId === filterArtworkId;
  });

  const groupedDiaries = filteredDiaries.reduce((acc, entry) => {
    const d = new Date(entry.date);
    const yearMonth = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    if (!acc[yearMonth]) {
      acc[yearMonth] = [];
    }
    acc[yearMonth].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-24 sm:pb-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div>
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-2 transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
              color: 'var(--accent-gold)',
            }}
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
            <span>作品 + 日记 创作空间</span>
          </div>
          <h1 className="font-art-serif text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
            创作日志
          </h1>
          <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            记录每一次笔刷尝试、色彩突破与深夜思考。每一张画都是一段不可复制的光阴。
          </p>
        </div>

        <button
          id="btn-new-diary"
          onClick={() => handleOpenAdd(preselectedArtwork)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow active:scale-95 transition-all w-full sm:w-auto shrink-0 text-white"
          style={{
            backgroundColor: 'var(--accent-gold)',
          }}
        >
          <Plus className="w-4 h-4" />
          <span>写创作日记</span>
        </button>
      </div>

      {/* Filter by artwork bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span style={{ color: 'var(--text-muted)' }}>筛选关联作品:</span>
          <select
            value={filterArtworkId}
            onChange={(e) => setFilterArtworkId(e.target.value)}
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              color: 'var(--text-main)',
            }}
            className="px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 max-w-full sm:max-w-xs truncate"
          >
            <option value="all">全部日志 ({diaries.length})</option>
            {artworks.map((art) => (
              <option key={art.id} value={art.id}>
                {art.title}
              </option>
            ))}
          </select>
        </div>
        <span className="font-mono text-[11px] sm:text-xs self-end sm:self-auto" style={{ color: 'var(--text-muted)' }}>{filteredDiaries.length} 篇日记</span>
      </div>

      {/* Timeline entries */}
      {Object.keys(groupedDiaries).length > 0 ? (
        <div className="space-y-8 sm:space-y-10">
          {(Object.entries(groupedDiaries) as [string, DiaryEntry[]][]).map(([yearMonth, entries]) => (
            <div key={yearMonth} className="space-y-4">
              
              {/* Month Heading */}
              <div 
                className="sticky top-14 sm:top-20 z-10 flex items-center gap-2.5 py-2 backdrop-blur-md px-1 rounded-xl"
                style={{ backgroundColor: 'color-mix(in srgb, var(--bg-page) 85%, transparent)' }}
              >
                <span 
                  className="font-art-serif text-sm sm:text-lg font-bold px-3 py-1 rounded-lg border shadow-2xs"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                >
                  {yearMonth}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--card-border)' }} />
                <span className="text-[11px] sm:text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {entries.length} 篇记录
                </span>
              </div>

              {/* Entries List */}
              <div 
                className="space-y-4 relative ml-1 sm:ml-2 pl-4 sm:pl-6 border-l-2"
                style={{ borderColor: 'var(--card-border)' }}
              >
                {entries.map((diary) => {
                  const day = diary.date ? diary.date.slice(8) : '';
                  const fullDate = diary.date ? diary.date.replace(/-/g, '.') : '';
                  const matchedArt = artworks.find((a) => a.id === diary.artworkId);

                  return (
                    <article
                      key={diary.id}
                      id={`diary-card-${diary.id}`}
                      className="relative group"
                    >
                      {/* Timeline dot */}
                      <div 
                        className="absolute -left-[23px] sm:-left-[31px] top-5 w-3 h-3 rounded-full border-2 group-hover:scale-125 transition-transform duration-200 shadow-xs"
                        style={{ 
                          backgroundColor: 'var(--accent-gold)',
                          borderColor: 'var(--bg-page)',
                        }}
                      />

                      <div 
                        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} 
                        className="p-3.5 sm:p-6 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-3"
                      >
                        {/* Header: Date + Title + Associated Art Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                              <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>
                                {fullDate}
                              </span>
                              {diary.artworkTitle && (
                                <button
                                  onClick={() => matchedArt && onSelectArtwork(matchedArt)}
                                  className="inline-flex items-center gap-1 font-sans hover:underline text-xs truncate max-w-full"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">关联作品: {diary.artworkTitle}</span>
                                </button>
                              )}
                            </div>
                            <h3 className="font-art-serif text-base sm:text-lg font-bold break-words" style={{ color: 'var(--text-main)' }}>
                              {diary.title}
                            </h3>
                          </div>

                          {/* Actions: Edit / Delete */}
                          <div className="flex items-center gap-1 self-end sm:self-start shrink-0 opacity-90 sm:opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit(diary)}
                              className="p-1.5 rounded-lg hover:opacity-80 transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              title="编辑日志"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteDiary(diary.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                              title="删除日志"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Associated Artwork Preview Thumbnail (if any) */}
                        {matchedArt && (
                          <div
                            onClick={() => onSelectArtwork(matchedArt)}
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--card-bg) 80%, var(--bg-page))',
                              borderColor: 'var(--card-border)',
                            }}
                            className="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer hover:border-amber-500/50 transition-colors min-w-0"
                          >
                            <img
                              src={matchedArt.imageUrl}
                              alt={matchedArt.title}
                              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shrink-0"
                            />
                            <div className="text-xs space-y-0.5 min-w-0 flex-1">
                              <span className="font-medium truncate block" style={{ color: 'var(--text-main)' }}>
                                {matchedArt.title}
                              </span>
                              <span className="block font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                {matchedArt.type} · {matchedArt.width} × {matchedArt.height}
                              </span>
                              <span className="font-medium text-[11px] inline-flex items-center gap-1" style={{ color: 'var(--accent-gold)' }}>
                                点击进入大图查看 →
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Content text */}
                        <div className="text-xs sm:text-sm leading-relaxed font-light whitespace-pre-wrap break-words" style={{ color: 'var(--text-main)' }}>
                          {diary.content}
                        </div>

                        {/* Tag Pills */}
                        {diary.tags && diary.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                            {diary.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
                                  borderColor: 'var(--card-border)',
                                  color: 'var(--text-muted)',
                                }}
                                className="text-[11px] px-2 py-0.5 rounded-full border font-mono"
                              >
                                #{tag.replace(/^#/, '')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="py-16 sm:py-20 rounded-3xl border border-dashed text-center p-6 sm:p-8 space-y-4">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
              color: 'var(--accent-gold)',
            }}
          >
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-art-serif text-base sm:text-lg font-bold" style={{ color: 'var(--text-main)' }}>
              还没有创作日志
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              记录画画时的灵感、踩坑经验与色彩笔记。日积月累，是一部属于你自己的成长史。
            </p>
          </div>
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-medium shadow-sm transition-all active:scale-95"
            style={{ backgroundColor: 'var(--accent-gold)' }}
          >
            <Plus className="w-4 h-4" />
            <span>写第一篇日志</span>
          </button>
        </div>
      )}

      {/* Diary Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div 
            style={{ backgroundColor: "var(--modal-bg)", borderColor: "var(--card-border)" }} 
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl p-4 sm:p-6 animate-in fade-in zoom-in-95 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b pb-3 shrink-0" style={{ borderColor: 'var(--card-border)' }}>
              <h2 className="font-art-serif text-base sm:text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                {editingDiary ? '编辑创作日记' : '新建创作日记'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pt-3 pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                  日志标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：雨夜环境光攻克、深夜速涂随笔..."
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                    创作日期
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                    关联画匣作品 (可选)
                  </label>
                  <select
                    value={selectedArtId}
                    onChange={(e) => setSelectedArtId(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-main)',
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="">不关联具体作品 (纯日记)</option>
                    {artworks.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                  日记内容 / 心得记录
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="今天完成了哪一步？尝试了什么新笔刷或光影技法？有遇到什么困扰或突破吗？"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>
                  分类标签 (空格分隔)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="#色彩心得 #技法笔记 #写生 #日常"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-main)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t shrink-0" style={{ borderColor: 'var(--card-border)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white shadow-sm transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                >
                  保存日志
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
