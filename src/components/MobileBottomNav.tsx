import React from 'react';
import { 
  Home, 
  LayoutGrid, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Plus 
} from 'lucide-react';
import { ViewTab } from '../types';

interface MobileBottomNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
  artworksCount: number;
  diariesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  artworksCount,
  diariesCount,
}) => {
  return (
    <nav
      id="mobile-bottom-dock"
      aria-label="移动端快速导航栏"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#141822]/95 backdrop-blur-lg border-t border-[#E8E4DC] dark:border-[#232A3B] safe-area-bottom shadow-lg"
      style={{
        backgroundColor: 'var(--dock-bg, var(--navbar-bg, var(--bg-page)))',
        borderColor: 'var(--navbar-border, var(--card-border))',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1 h-14 max-w-lg mx-auto">
        {/* 1. 首页 */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-w-[50px] transition-all active:scale-90 ${
            currentTab === 'home'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          style={{
            color: currentTab === 'home' ? 'var(--accent-gold)' : undefined,
          }}
        >
          <div className="relative">
            <Home className="w-5 h-5" />
            {currentTab === 'home' && (
              <span 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" 
              />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">首页</span>
        </button>

        {/* 2. 作品库 */}
        <button
          type="button"
          onClick={() => onSelectTab('gallery')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-w-[50px] transition-all active:scale-90 relative ${
            currentTab === 'gallery' || currentTab === 'favorites'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          style={{
            color: (currentTab === 'gallery' || currentTab === 'favorites') ? 'var(--accent-gold)' : undefined,
          }}
        >
          <div className="relative">
            <LayoutGrid className="w-5 h-5" />
            {artworksCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] px-1 py-0.2 rounded-full font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {artworksCount > 99 ? '99+' : artworksCount}
              </span>
            )}
            {(currentTab === 'gallery' || currentTab === 'favorites') && (
              <span 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" 
              />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">作品库</span>
        </button>

        {/* 3. 创作日记 */}
        <button
          type="button"
          onClick={() => onSelectTab('diary')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-w-[50px] transition-all active:scale-90 relative ${
            currentTab === 'diary'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          style={{
            color: currentTab === 'diary' ? 'var(--accent-gold)' : undefined,
          }}
        >
          <div className="relative">
            <BookOpen className="w-5 h-5" />
            {diariesCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] px-1 py-0.2 rounded-full font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {diariesCount}
              </span>
            )}
            {currentTab === 'diary' && (
              <span 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" 
              />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">手记</span>
        </button>

        {/* 5. 统计 */}
        <button
          type="button"
          onClick={() => onSelectTab('stats')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-w-[50px] transition-all active:scale-90 ${
            currentTab === 'stats'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          style={{
            color: currentTab === 'stats' ? 'var(--accent-gold)' : undefined,
          }}
        >
          <div className="relative">
            <BarChart3 className="w-5 h-5" />
            {currentTab === 'stats' && (
              <span 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" 
              />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">统计</span>
        </button>

        {/* 6. 设置 */}
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-w-[50px] transition-all active:scale-90 ${
            currentTab === 'settings'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          style={{
            color: currentTab === 'settings' ? 'var(--accent-gold)' : undefined,
          }}
        >
          <div className="relative">
            <Settings className="w-5 h-5" />
            {currentTab === 'settings' && (
              <span 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" 
              />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">设置</span>
        </button>
      </div>
    </nav>
  );
};
