import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  Calendar, 
  Star, 
  BookOpen, 
  CheckCircle2, 
  Layers,
  Clock,
  Filter,
  ArrowRight,
  TrendingUp,
  Smile,
  Heart,
  PieChart
} from 'lucide-react';
import { Artwork, DiaryEntry, StatusItem } from '../types';

interface StatsViewProps {
  artworks: Artwork[];
  diaries: DiaryEntry[];
  statuses?: StatusItem[];
  onSelectArtwork?: (art: Artwork) => void;
}

type DateScopeMode = 'all' | 'year' | 'month' | 'day' | 'range';

export const StatsView: React.FC<StatsViewProps> = ({ artworks, diaries, statuses, onSelectArtwork }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const todayStr = new Date().toISOString().split('T')[0];

  // Date selection states (Requirement 4)
  const [scopeMode, setScopeMode] = useState<DateScopeMode>('all');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Available years from artworks & diaries
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    artworks.forEach((a) => {
      const y = parseInt(a.date.slice(0, 4), 10);
      if (!isNaN(y)) years.add(y);
    });
    diaries.forEach((d) => {
      const y = parseInt(d.date.slice(0, 4), 10);
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [artworks, diaries, currentYear]);

  // Filter artworks according to selected date / year / month / day
  const filteredArtworks = useMemo(() => {
    if (scopeMode === 'all') return artworks;

    if (scopeMode === 'year') {
      const prefix = String(selectedYear);
      return artworks.filter((a) => a.date.startsWith(prefix));
    }

    if (scopeMode === 'month') {
      const mStr = String(selectedMonth).padStart(2, '0');
      const prefix = `${selectedYear}-${mStr}`;
      return artworks.filter((a) => a.date.startsWith(prefix));
    }

    if (scopeMode === 'day') {
      return artworks.filter((a) => a.date === selectedDay);
    }

    if (scopeMode === 'range') {
      return artworks.filter((a) => a.date >= startDate && a.date <= endDate);
    }

    return artworks;
  }, [artworks, scopeMode, selectedYear, selectedMonth, selectedDay, startDate, endDate]);

  // Filter diaries according to selected date
  const filteredDiaries = useMemo(() => {
    if (scopeMode === 'all') return diaries;

    if (scopeMode === 'year') {
      const prefix = String(selectedYear);
      return diaries.filter((d) => d.date.startsWith(prefix));
    }

    if (scopeMode === 'month') {
      const mStr = String(selectedMonth).padStart(2, '0');
      const prefix = `${selectedYear}-${mStr}`;
      return diaries.filter((d) => d.date.startsWith(prefix));
    }

    if (scopeMode === 'day') {
      return diaries.filter((d) => d.date === selectedDay);
    }

    if (scopeMode === 'range') {
      return diaries.filter((d) => d.date >= startDate && d.date <= endDate);
    }

    return diaries;
  }, [diaries, scopeMode, selectedYear, selectedMonth, selectedDay, startDate, endDate]);

  // Core metrics for the selected time scope
  const totalArtworks = filteredArtworks.length;
  const favoriteCount = filteredArtworks.filter((a) => a.isFavorite).length;
  const diaryCount = filteredDiaries.length;
  const completedCount = filteredArtworks.filter((a) => a.status === 'completed' || a.status === '已完成').length;
  const completionRate = totalArtworks > 0 ? Math.round((completedCount / totalArtworks) * 100) : 0;

  // Total storage size
  const totalSizeBytes = filteredArtworks.reduce((acc, a) => acc + (a.sizeBytes || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  // Creation days (unique active dates in artworks + diaries)
  const uniqueActiveDates = useMemo(() => {
    const set = new Set<string>();
    filteredArtworks.forEach((a) => set.add(a.date));
    filteredDiaries.forEach((d) => set.add(d.date));
    return set.size;
  }, [filteredArtworks, filteredDiaries]);

  // Monthly works count for selected year
  const monthlyStats = useMemo(() => {
    const targetYear = scopeMode === 'month' || scopeMode === 'year' ? selectedYear : currentYear;
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthStr = String(monthNum).padStart(2, '0');
      const count = artworks.filter((a) => a.date.startsWith(`${targetYear}-${monthStr}`)).length;
      return {
        month: `${monthNum}月`,
        monthNum,
        count,
      };
    });
  }, [artworks, scopeMode, selectedYear, currentYear]);

  const maxMonthCount = Math.max(...monthlyStats.map((m) => m.count), 1);

  // Type breakdown
  const typeStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredArtworks.forEach((a) => {
      map.set(a.type, (map.get(a.type) || 0) + 1);
    });
    const list = Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      percent: totalArtworks > 0 ? Math.round((count / totalArtworks) * 100) : 0,
    }));
    return list.sort((a, b) => b.count - a.count);
  }, [filteredArtworks, totalArtworks]);

  // Top tags
  const topTags = useMemo(() => {
    const map = new Map<string, number>();
    filteredArtworks.forEach((a) => {
      a.tags.forEach((t) => {
        const clean = t.replace(/^#/, '');
        map.set(clean, (map.get(clean) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [filteredArtworks]);

  // Status breakdown
  const statusStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredArtworks.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [filteredArtworks]);

  // Mood statistics calculation (Requirement 1: 创作日志心情分布与情绪趋势)
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);

  const moodStats = useMemo(() => {
    // Determine scope of diaries: prefer current filtered diaries, fallback to all diaries if filtered has 0 with mood
    const activeList = filteredDiaries;
    const fallbackList = diaries;
    const listToAnalyze = activeList.length > 0 ? activeList : fallbackList;

    const moodMap = new Map<string, { count: number; recentTitle?: string }>();
    let totalWithMood = 0;

    listToAnalyze.forEach((d) => {
      const m = d.mood?.trim();
      if (m) {
        totalWithMood++;
        const prev = moodMap.get(m) || { count: 0, recentTitle: d.title };
        moodMap.set(m, { count: prev.count + 1, recentTitle: d.title });
      }
    });

    // Harmonious palette for mood slices
    const MOOD_COLOR_PALETTE = [
      '#f59e0b', // Amber / Gold
      '#10b981', // Emerald
      '#8b5cf6', // Violet
      '#3b82f6', // Blue
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#ef4444', // Rose Red
    ];

    const list = Array.from(moodMap.entries())
      .map(([rawMood, data], idx) => {
        const emojiMatch = rawMood.match(/^(\p{Extended_Pictographic}|\S+)\s*(.*)$/u);
        const emoji = emojiMatch ? emojiMatch[1] : '🎨';
        const label = emojiMatch && emojiMatch[2] ? emojiMatch[2] : rawMood;
        const percent = totalWithMood > 0 ? Math.round((data.count / totalWithMood) * 100) : 0;
        const color = MOOD_COLOR_PALETTE[idx % MOOD_COLOR_PALETTE.length];
        return {
          rawMood,
          emoji,
          label,
          count: data.count,
          percent,
          color,
          recentTitle: data.recentTitle,
        };
      })
      .sort((a, b) => b.count - a.count);

    // Calculate chronological mood timeline & flow state index
    const timelineEntries = listToAnalyze
      .filter((d) => d.mood && d.mood.trim())
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-15) // Recent 15 entries for timeline trend
      .map((d) => {
        const m = d.mood!.trim();
        const emojiMatch = m.match(/^(\p{Extended_Pictographic}|\S+)\s*(.*)$/u);
        const emoji = emojiMatch ? emojiMatch[1] : '🎨';
        const label = emojiMatch && emojiMatch[2] ? emojiMatch[2] : m;
        const matchedItem = list.find((item) => item.rawMood === m);
        return {
          id: d.id,
          date: d.date,
          title: d.title,
          mood: m,
          emoji,
          label,
          color: matchedItem?.color || '#f59e0b',
        };
      });

    // High flow / positive inspiration moods count
    const highFlowCount = listToAnalyze.filter((d) => {
      const m = (d.mood || '').toLowerCase();
      return m.includes('灵感') || m.includes('心流') || m.includes('热血') || m.includes('专注') || m.includes('突破') || m.includes('愉悦') || m.includes('爽');
    }).length;

    const flowIndex = totalWithMood > 0 ? Math.round((highFlowCount / totalWithMood) * 100) : 0;

    return {
      list,
      totalWithMood,
      totalDiaries: listToAnalyze.length,
      coveragePercent: listToAnalyze.length > 0 ? Math.round((totalWithMood / listToAnalyze.length) * 100) : 0,
      dominantMood: list.length > 0 ? list[0] : null,
      flowIndex,
      timelineEntries,
      isScopeFallback: activeList.length === 0 && fallbackList.length > 0,
    };
  }, [filteredDiaries, diaries]);

  // Descriptive title of current scope
  const currentScopeTitle = useMemo(() => {
    if (scopeMode === 'all') return '全部历史统计';
    if (scopeMode === 'year') return `${selectedYear} 年度统计`;
    if (scopeMode === 'month') return `${selectedYear}年 ${selectedMonth}月 创作统计`;
    if (scopeMode === 'day') return `${selectedDay} 当日创作记录`;
    if (scopeMode === 'range') return `${startDate} 至 ${endDate} 统计`;
    return '统计概览';
  }, [scopeMode, selectedYear, selectedMonth, selectedDay, startDate, endDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[#E8E4DC] dark:border-[#262B38]">
        <div>
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-2 transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
              color: 'var(--accent-gold)',
            }}
          >
            <BarChart3 className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
            <span>画师数字足迹与产出统计</span>
          </div>
          <h1 className="font-art-serif text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            创作统计
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            用数据直观见证你的每一份坚持、产出节奏与偏好演变。
          </p>
        </div>

        {/* Current Active Filter Badge */}
        <div className="text-right">
          <span className="text-xs text-neutral-400 block font-mono">当前查看范围</span>
          <span className="text-sm sm:text-base font-bold font-art-serif" style={{ color: 'var(--accent-gold)' }}>
            {currentScopeTitle}
          </span>
        </div>
      </div>

      {/* Date Scope Controls (Requirement 4: 支持选择日期，不同的年月日) */}
      <section 
        id="stats-date-selector"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-4 sm:p-5 rounded-3xl border shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 shrink-0 whitespace-nowrap">
            <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-gold)' }} />
            <span className="whitespace-nowrap">日期统计范围切换:</span>
          </div>

          {/* Scope Mode Tabs */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs overflow-x-auto no-scrollbar max-w-full shrink-0">
            <button
              onClick={() => setScopeMode('all')}
              style={scopeMode === 'all' ? { backgroundColor: 'var(--accent-gold)', color: '#FFFFFF' } : undefined}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
                scopeMode === 'all'
                  ? 'font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              全部历史
            </button>
            <button
              onClick={() => setScopeMode('year')}
              style={scopeMode === 'year' ? { backgroundColor: 'var(--accent-gold)', color: '#FFFFFF' } : undefined}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
                scopeMode === 'year'
                  ? 'font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              按年份
            </button>
            <button
              onClick={() => setScopeMode('month')}
              style={scopeMode === 'month' ? { backgroundColor: 'var(--accent-gold)', color: '#FFFFFF' } : undefined}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
                scopeMode === 'month'
                  ? 'font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              按月份
            </button>
            <button
              onClick={() => setScopeMode('day')}
              style={scopeMode === 'day' ? { backgroundColor: 'var(--accent-gold)', color: '#FFFFFF' } : undefined}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
                scopeMode === 'day'
                  ? 'font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              按具体日期
            </button>
            <button
              onClick={() => setScopeMode('range')}
              style={scopeMode === 'range' ? { backgroundColor: 'var(--accent-gold)', color: '#FFFFFF' } : undefined}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
                scopeMode === 'range'
                  ? 'font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              日期区间
            </button>
          </div>
        </div>

        {/* Sub-inputs based on Scope Mode */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center gap-4 text-xs">
          
          {/* Year Selector */}
          {scopeMode === 'year' && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">选择年份:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
          )}

          {/* Month Selector */}
          {scopeMode === 'month' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">年份:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y} 年</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-neutral-500">月份:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m} 月</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Specific Day Selector */}
          {scopeMode === 'day' && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">选择具体年月日:</span>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          )}

          {/* Range Selector */}
          {scopeMode === 'range' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">起始日期:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
              <span className="text-neutral-400">至</span>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">截止日期:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          )}

          {scopeMode === 'all' && (
            <span className="text-neutral-400">
              包含从开天辟地第一笔至今所有的绘画与日记记录
            </span>
          )}
        </div>
      </section>

      {/* 4 Big Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-5 sm:p-6 rounded-2xl border shadow-xs">
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 block mb-2">
            所选区间作品
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-art-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              {totalArtworks}
            </span>
            <span className="text-xs text-neutral-400 font-mono">件</span>
          </div>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>完成率 {completionRate}%</span>
          </div>
        </div>

        <div style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-5 sm:p-6 rounded-2xl border shadow-xs">
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 block mb-2">
            活跃创作天数
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-art-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              {uniqueActiveDates}
            </span>
            <span className="text-xs text-neutral-400 font-mono">天</span>
          </div>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
            <span>有产出或写日记的天数</span>
          </div>
        </div>

        <div style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-5 sm:p-6 rounded-2xl border shadow-xs">
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 block mb-2">
            心仪收藏
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-art-serif text-3xl sm:text-4xl font-bold" style={{ color: 'var(--accent-gold)' }}>
              {favoriteCount}
            </span>
            <span className="text-xs text-neutral-400 font-mono">件</span>
          </div>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-mono">
            <Star className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)', fill: 'var(--accent-gold)' }} />
            <span>占比 {totalArtworks > 0 ? Math.round((favoriteCount / totalArtworks) * 100) : 0}%</span>
          </div>
        </div>

        <div style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-5 sm:p-6 rounded-2xl border shadow-xs">
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 block mb-2">
            创作日记
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-art-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              {diaryCount}
            </span>
            <span className="text-xs text-neutral-400 font-mono">篇</span>
          </div>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-mono">
            <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
            <span>文字心得记录</span>
          </div>
        </div>
      </section>

      {/* Monthly Output Bar Chart */}
      <section style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-6 rounded-3xl border shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-art-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {scopeMode === 'year' ? `${selectedYear}年每月作品产出分布` : `年度每月作品产出`}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              各月份创作产出与灵感起伏
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            单位：件
          </span>
        </div>

        {/* Custom Bar Chart */}
        <div className="pt-6 pb-2 overflow-x-auto no-scrollbar">
          <div className="h-44 min-w-[500px] sm:min-w-0 flex items-end justify-between gap-1 sm:gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            {monthlyStats.map((item) => {
              const heightPercent = item.count > 0 ? Math.max((item.count / maxMonthCount) * 100, 15) : 4;
              const hasWorks = item.count > 0;
              return (
                <div key={item.month} className="flex-1 min-w-[32px] flex flex-col items-center gap-2 group h-full justify-end shrink-0 sm:shrink">
                  {/* Tooltip & Value */}
                  <span 
                    className="text-[11px] font-mono transition-opacity whitespace-nowrap leading-none"
                    style={{
                      color: hasWorks ? 'var(--accent-gold)' : undefined,
                      fontWeight: hasWorks ? 700 : 400,
                    }}
                  >
                    {item.count}
                  </span>

                  {/* Bar */}
                  <div
                    style={{ 
                      height: `${heightPercent}%`,
                      backgroundColor: hasWorks ? 'var(--accent-gold)' : undefined,
                    }}
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                      hasWorks
                        ? 'shadow-xs hover:opacity-85'
                        : 'bg-neutral-100 dark:bg-neutral-800/60'
                    }`}
                  />

                  {/* Label */}
                  <span className="text-[11px] text-neutral-400 font-mono whitespace-nowrap leading-none text-center block">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirement 1: Mood Distribution Chart & Trend Analysis (创作日志中心情分布的占比情况) */}
      <section 
        id="section-mood-distribution-chart"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} 
        className="p-6 rounded-3xl border shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 35%, transparent)',
                  color: 'var(--accent-gold)',
                }}
              >
                <Smile className="w-4 h-4" />
              </div>
              <h2 className="font-art-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
                创作日记心情分布与心流趋势
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              统计创作日记中记录的各种心情占比与情绪趋势，洞察高产灵感与瓶颈心境
              {moodStats.isScopeFallback && '（当前选定时段暂无心情记录，已展示全部历史心情趋势）'}
            </p>
          </div>

          {moodStats.totalWithMood > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono self-start sm:self-auto">
              <span 
                className="px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                  color: 'var(--accent-gold)',
                }}
              >
                共记录 {moodStats.totalWithMood} 次心情 · 覆盖率 {moodStats.coveragePercent}%
              </span>
            </div>
          )}
        </div>

        {moodStats.totalWithMood > 0 ? (
          <div className="space-y-6">
            {/* Top Summary Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div 
                className="p-3.5 rounded-2xl border flex items-center gap-3.5"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 8%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 25%, var(--card-border))',
                }}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                  }}
                >
                  {moodStats.dominantMood?.emoji || '✨'}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-neutral-400 block">主导创作心态</span>
                  <span className="font-art-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate block">
                    {moodStats.dominantMood?.label} ({moodStats.dominantMood?.percent}%)
                  </span>
                </div>
              </div>

              <div 
                className="p-3.5 rounded-2xl border flex items-center gap-3.5"
                style={{
                  backgroundColor: 'color-mix(in srgb, #f59e0b 8%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, #f59e0b 25%, var(--card-border))',
                }}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-neutral-400 block">心流与高产指数</span>
                  <span className="font-art-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 block">
                    {moodStats.flowIndex}% <span className="text-[11px] font-mono font-normal text-neutral-400">灵感/心流占比</span>
                  </span>
                </div>
              </div>

              <div 
                className="p-3.5 rounded-2xl border flex items-center gap-3.5"
                style={{
                  backgroundColor: 'color-mix(in srgb, #10b981 8%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, #10b981 25%, var(--card-border))',
                }}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-neutral-400 block">记录篇数 / 覆盖率</span>
                  <span className="font-art-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 block">
                    {moodStats.totalWithMood} 篇 / {moodStats.coveragePercent}%
                  </span>
                </div>
              </div>

              <div 
                className="p-3.5 rounded-2xl border flex items-center gap-3.5"
                style={{
                  backgroundColor: 'color-mix(in srgb, #8b5cf6 8%, var(--card-bg))',
                  borderColor: 'color-mix(in srgb, #8b5cf6 25%, var(--card-border))',
                }}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                >
                  <Smile className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-neutral-400 block">创作心境丰富度</span>
                  <span className="font-art-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 block">
                    {moodStats.list.length} 种不同情绪
                  </span>
                </div>
              </div>
            </div>

            {/* Donut Chart & Mood Ranking Dual View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
              
              {/* Left Column: Interactive SVG Donut Chart */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800">
                <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    {/* Background circle track */}
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="24"
                      className="text-neutral-100 dark:text-neutral-800/80"
                    />

                    {/* Colored Donut Segments */}
                    {(() => {
                      const radius = 70;
                      const circumference = 2 * Math.PI * radius; // ≈ 439.82
                      let accumulatedPercent = 0;

                      return moodStats.list.map((item) => {
                        const strokeDash = (item.percent / 100) * circumference;
                        const strokeOffset = -(accumulatedPercent / 100) * circumference;
                        accumulatedPercent += item.percent;

                        const isHovered = hoveredMood === item.rawMood;

                        return (
                          <circle
                            key={item.rawMood}
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth={isHovered ? 28 : 24}
                            strokeDasharray={`${strokeDash} ${circumference}`}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="butt"
                            className="transition-all duration-300 cursor-pointer"
                            style={{
                              filter: isHovered ? `drop-shadow(0 0 8px ${item.color}80)` : undefined,
                              opacity: hoveredMood && !isHovered ? 0.45 : 1,
                            }}
                            onMouseEnter={() => setHoveredMood(item.rawMood)}
                            onMouseLeave={() => setHoveredMood(null)}
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Centered Mood Display Info in Donut Hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    {(() => {
                      const activeItem = hoveredMood 
                        ? moodStats.list.find((m) => m.rawMood === hoveredMood) 
                        : moodStats.dominantMood;

                      if (!activeItem) {
                        return (
                          <>
                            <span className="text-2xl mb-0.5">🎨</span>
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">创作心流</span>
                            <span className="text-[10px] text-neutral-400 font-mono mt-0.5">{moodStats.totalWithMood} 篇记录</span>
                          </>
                        );
                      }

                      return (
                        <>
                          <span className="text-3xl mb-0.5 transition-transform scale-110">
                            {activeItem.emoji}
                          </span>
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 max-w-[120px]">
                            {activeItem.label}
                          </span>
                          <span className="text-xs font-mono font-bold mt-0.5" style={{ color: activeItem.color }}>
                            {activeItem.percent}% ({activeItem.count}篇)
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono mt-0.5">
                            {hoveredMood ? '当前选中心情' : '主导创作情绪'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <span className="text-[11px] text-neutral-400 mt-2 font-mono text-center">
                  可悬停或点击右侧列表查看各情绪分布详情
                </span>
              </div>

              {/* Right Column: Mood List with Bars & Percentages */}
              <div className="lg:col-span-7 space-y-2.5">
                {moodStats.list.map((item) => {
                  const isHovered = hoveredMood === item.rawMood;
                  return (
                    <div
                      key={item.rawMood}
                      onMouseEnter={() => setHoveredMood(item.rawMood)}
                      onMouseLeave={() => setHoveredMood(null)}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                        isHovered 
                          ? 'shadow-xs scale-[1.01]' 
                          : 'hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                      style={{
                        backgroundColor: isHovered 
                          ? 'color-mix(in srgb, var(--accent-gold) 10%, var(--card-bg))' 
                          : 'var(--card-bg)',
                        borderColor: isHovered 
                          ? item.color 
                          : 'var(--card-border)',
                      }}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{item.emoji}</span>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {item.label}
                          </span>
                          {item.recentTitle && (
                            <span className="hidden sm:inline text-[10px] text-neutral-400 truncate max-w-[150px]">
                              例：《{item.recentTitle}》
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                            {item.count} 篇
                          </span>
                          <span 
                            className="font-bold px-1.5 py-0.5 rounded text-[11px]"
                            style={{ 
                              backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)`,
                              color: item.color 
                            }}
                          >
                            {item.percent}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(item.percent, 3)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Emotional Trend Insight Notice */}
                <div 
                  className="p-3 rounded-xl border text-xs flex items-center gap-2.5 mt-3"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-gold) 6%, var(--card-bg))',
                    borderColor: 'color-mix(in srgb, var(--accent-gold) 20%, var(--card-border))',
                    color: 'var(--text-main)',
                  }}
                >
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-gold)' }} />
                  <p className="text-[11px] leading-relaxed">
                    <strong>情绪洞察：</strong>
                    {moodStats.dominantMood?.label.includes('心流') || moodStats.dominantMood?.label.includes('专注')
                      ? '画师专注度极高，深度的“心流”能带来源源不断的笔触掌控力，建议保留当下的作画仪式感。'
                      : moodStats.dominantMood?.label.includes('灵感') || moodStats.dominantMood?.label.includes('突破')
                      ? '近期的创作伴随着强烈的新鲜感与突破冲劲，适合趁热打铁挑战更具挑战性的主题或画风。'
                      : '情绪是笔触的灵魂，在日记中如实记录每一次起伏，能帮助你清晰看到自己艺术风格与心态的成长脉络。'}
                  </p>
                </div>
              </div>

            </div>

            {/* Timeline Flow Trend: Chronological Mood Shift & Flow Sequence */}
            {moodStats.timelineEntries && moodStats.timelineEntries.length > 0 && (
              <div 
                className="p-4 sm:p-5 rounded-2xl border space-y-3 pt-4"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) 70%, var(--bg-page))',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      近阶段创作心流与情绪演进轨迹
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    按时间正序呈现最近 {moodStats.timelineEntries.length} 篇日记的心情脉络
                  </span>
                </div>

                {/* Horizontal Flow Strip */}
                <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
                  <div className="flex items-center gap-2 min-w-max">
                    {moodStats.timelineEntries.map((entry, idx) => {
                      const isHovered = hoveredMood === entry.mood;
                      return (
                        <div
                          key={entry.id || idx}
                          onMouseEnter={() => setHoveredMood(entry.mood)}
                          onMouseLeave={() => setHoveredMood(null)}
                          className={`relative flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer min-w-[90px] max-w-[120px] text-center ${
                            isHovered ? 'scale-105 shadow-md -translate-y-0.5' : 'hover:border-amber-500/40'
                          }`}
                          style={{
                            backgroundColor: isHovered 
                              ? 'color-mix(in srgb, var(--accent-gold) 15%, var(--card-bg))' 
                              : 'var(--card-bg)',
                            borderColor: isHovered ? entry.color : 'var(--card-border)',
                          }}
                        >
                          <span className="text-xl mb-1">{entry.emoji}</span>
                          <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate w-full">
                            {entry.label}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400 mt-0.5">
                            {entry.date ? entry.date.slice(5) : ''}
                          </span>
                          {entry.title && (
                            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 truncate w-full mt-0.5 opacity-80">
                              {entry.title}
                            </span>
                          )}

                          {/* Node indicator dot */}
                          <div 
                            className="w-2 h-2 rounded-full mt-1.5 shadow-xs" 
                            style={{ backgroundColor: entry.color }} 
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State if no moods logged yet */
          <div 
            className="text-center py-10 px-4 rounded-2xl border border-dashed space-y-3"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)',
                color: 'var(--accent-gold)',
              }}
            >
              <Smile className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                暂无心情分布数据
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                在创作日记中为每次画画记录心情（如 ✨ 灵感爆发、🎨 沉浸心流、🔥 热血沸腾、🍵 心静如水），系统将在此为你呈现创作情绪占比图表与情绪趋势。
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 pt-1 text-xs">
              {['✨ 灵感爆发', '🎨 沉浸心流', '🔥 热血沸腾', '🍵 心静如水', '☕ 疲惫充实', '🌧️ 遇到瓶颈'].map((m) => (
                <span 
                  key={m}
                  className="px-2.5 py-1 rounded-full border bg-neutral-100/60 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 font-mono text-[11px]"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most painted types */}
        <div style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-6 rounded-3xl border shadow-xs space-y-4">
          <h3 className="font-art-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
            <span>创作类型偏好 ({typeStats.length})</span>
          </h3>

          <div className="space-y-3 pt-2">
            {typeStats.length > 0 ? (
              typeStats.map((t) => (
                <div key={t.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{t.name}</span>
                    <span className="text-neutral-400 font-mono">{t.count}件 ({t.percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      style={{ width: `${t.percent}%`, backgroundColor: 'var(--accent-gold)' }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 py-6 text-center">当前区间暂无分类数据</p>
            )}
          </div>
        </div>

        {/* Most frequent tags */}
        <div style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-6 rounded-3xl border shadow-xs space-y-4">
          <h3 className="font-art-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
            <span>最常用创作标签</span>
          </h3>

          {topTags.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {topTags.map(([tag, count]) => (
                <div
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-mono"
                >
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">#{tag}</span>
                  <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>×{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-6 text-center">当前区间暂无标签记录</p>
          )}

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>存储占用 (所选作品)</span>
            <span>{totalSizeMB} MB</span>
          </div>
        </div>

      </div>

      {/* Creation Status Breakdown */}
      <section style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-6 rounded-3xl border shadow-xs">
        <h3 className="font-art-serif text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          创作状态分布
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(statusStats).length > 0 ? (
            Object.entries(statusStats).map(([stName, cnt]) => (
              <div 
                key={stName} 
                className="p-3.5 rounded-xl border text-center transition-colors"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                }}
              >
                <span className="text-xs block font-semibold" style={{ color: 'var(--accent-gold)' }}>{stName}</span>
                <span className="font-art-serif text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 block">
                  {cnt}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-4 text-xs text-neutral-400">
              当前区间暂无作品状态统计
            </div>
          )}
        </div>
      </section>

      {/* Requirement 2: Selected Date Artworks Module (所选日期作品模块) */}
      <section style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }} className="p-6 rounded-3xl border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-art-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span>所选区间作品展厅 ({filteredArtworks.length}件)</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              {scopeMode === 'all' && '全部历史作品记录'}
              {scopeMode === 'year' && `${selectedYear} 年度创作一览`}
              {scopeMode === 'month' && `${selectedYear}年${selectedMonth}月 创作作品`}
              {scopeMode === 'day' && `${selectedDay} 当天创作作品`}
              {scopeMode === 'range' && `${startDate} 至 ${endDate} 区间作品`}
            </p>
          </div>
        </div>

        {filteredArtworks.length > 0 ? (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5 pt-2">
            {filteredArtworks.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArtwork && onSelectArtwork(art)}
                className="group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-md cursor-pointer flex flex-col"
                style={{ backgroundColor: 'var(--content-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="aspect-square relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
                    <span className="text-[10px] text-white/90 font-mono truncate">{art.date}</span>
                  </div>
                </div>
                <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-amber-600 transition-colors">
                    {art.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 truncate max-w-[70px]">
                      {art.type}
                    </span>
                    <span className="font-mono">{art.width}×{art.height}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 rounded-2xl border border-dashed text-neutral-400 space-y-2" style={{ borderColor: 'var(--card-border)' }}>
            <p className="text-xs">所选日期区间内暂无作品画稿</p>
            <p className="text-[11px] text-neutral-400">试着切换上方“全部 / 年 / 月 / 日”筛选时间范围</p>
          </div>
        )}
      </section>

    </div>
  );
};
