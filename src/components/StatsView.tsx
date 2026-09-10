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
  TrendingUp
} from 'lucide-react';
import { Artwork, DiaryEntry, StatusItem } from '../types';

interface StatsViewProps {
  artworks: Artwork[];
  diaries: DiaryEntry[];
  statuses?: StatusItem[];
}

type DateScopeMode = 'all' | 'year' | 'month' | 'day' | 'range';

export const StatsView: React.FC<StatsViewProps> = ({ artworks, diaries, statuses }) => {
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
        className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
            <Calendar className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
            <span>日期统计范围切换:</span>
          </div>

          {/* Scope Mode Tabs */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setScopeMode('all')}
              style={scopeMode === 'all' ? { backgroundColor: 'var(--accent-gold)', color: '#FFFFFF' } : undefined}
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs">
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

        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs">
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
            <span>有产出或写日志的天数</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs">
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

        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs">
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 block mb-2">
            创作日志
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
      <section className="p-6 rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs space-y-6">
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
        <div className="pt-6 pb-2">
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            {monthlyStats.map((item) => {
              const heightPercent = item.count > 0 ? Math.max((item.count / maxMonthCount) * 100, 15) : 4;
              const hasWorks = item.count > 0;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip & Value */}
                  <span 
                    className="text-[11px] font-mono transition-opacity"
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
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two Columns: Category Distribution & Tag Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most painted types */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs space-y-4">
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
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs space-y-4">
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
      <section className="p-6 rounded-3xl bg-white dark:bg-[#181B22] border border-[#E8E4DC] dark:border-[#262B38] shadow-xs">
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

    </div>
  );
};
