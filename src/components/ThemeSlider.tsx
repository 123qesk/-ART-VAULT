import React, { useState, useRef, useEffect } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';

export interface ThemeSliderProps {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showReset?: boolean;
  defaultValue?: number;
  onReset?: () => void;
  className?: string;
  id?: string;
  description?: string;
}

export const ThemeSlider: React.FC<ThemeSliderProps> = ({
  label,
  icon,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  showReset = false,
  defaultValue = 100,
  onReset,
  className = '',
  id,
  description,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [inputVal, setInputVal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep inputVal in sync when not editing
  useEffect(() => {
    if (!isEditing) {
      setInputVal(String(value));
    }
  }, [value, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setInputVal(String(value));
    setIsEditing(true);
  };

  const handleCommitEdit = () => {
    let num = parseFloat(inputVal);
    if (isNaN(num)) {
      num = value;
    } else {
      num = Math.max(min, Math.min(max, num));
    }
    onChange(num);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setInputVal(String(value));
    }
  };

  // Calculate percentage for CSS track fill
  const clampedVal = Math.max(min, Math.min(max, value));
  const percent = max > min ? Math.round(((clampedVal - min) / (max - min)) * 100) : 0;

  return (
    <div
      className={`space-y-1.5 p-2.5 rounded-xl border transition-all duration-200 ${className}`}
      style={{
        backgroundColor: isInteracting
          ? 'color-mix(in srgb, var(--accent-gold) 7%, var(--card-bg, #ffffff))'
          : 'color-mix(in srgb, var(--accent-gold) 3%, var(--card-bg, #ffffff))',
        borderColor: isInteracting
          ? 'var(--accent-gold)'
          : 'color-mix(in srgb, var(--accent-gold) 22%, var(--card-border, #e5e7eb))',
        boxShadow: isInteracting
          ? '0 0 0 1.5px var(--accent-gold), 0 4px 14px color-mix(in srgb, var(--accent-gold) 20%, transparent)'
          : '0 1px 2px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Header with Label and Interactive Value Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
          {icon && <span style={{ color: 'var(--accent-gold)' }}>{icon}</span>}
          {label && <span>{label}</span>}
        </div>

        {/* Clickable/Editable Progress Display */}
        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <div 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border shadow-inner"
              style={{
                backgroundColor: 'var(--card-bg, #ffffff)',
                borderColor: 'var(--accent-gold)',
              }}
            >
              <input
                ref={inputRef}
                type="number"
                min={min}
                max={max}
                step={step}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleCommitEdit}
                className="w-14 text-xs font-mono font-bold bg-transparent text-center focus:outline-none"
                style={{ color: 'var(--text-main)' }}
              />
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {unit}
              </span>
              <button
                type="button"
                onClick={handleCommitEdit}
                className="p-0.5 rounded text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 cursor-pointer"
                title="确认"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-0.5 rounded text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 cursor-pointer"
                title="取消"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              title="点击直接输入自定义数值"
              className="px-2 py-0.5 rounded-lg border font-mono text-xs font-bold transition-all hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-gold) 12%, var(--card-bg, #ffffff))',
                borderColor: isInteracting
                  ? 'var(--accent-gold)'
                  : 'color-mix(in srgb, var(--accent-gold) 40%, transparent)',
                color: 'var(--accent-gold)',
              }}
            >
              <span>{value}{unit}</span>
            </button>
          )}

          {showReset && onReset && (
            <button
              type="button"
              onClick={onReset}
              title={`重置为 ${defaultValue}${unit}`}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Styled Slider with dynamic gradient track fill based on theme color */}
      <div className="relative flex items-center py-0.5">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onMouseDown={() => setIsInteracting(true)}
          onMouseUp={() => setIsInteracting(false)}
          onTouchStart={() => setIsInteracting(true)}
          onTouchEnd={() => setIsInteracting(false)}
          onFocus={() => setIsInteracting(true)}
          onBlur={() => setIsInteracting(false)}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            accentColor: 'var(--accent-gold)',
            background: `linear-gradient(to right, var(--accent-gold) 0%, var(--accent-gold) ${percent}%, color-mix(in srgb, var(--card-border, #d1d5db) 60%, transparent) ${percent}%, color-mix(in srgb, var(--card-border, #d1d5db) 60%, transparent) 100%)`,
          }}
          className="theme-slider-track w-full h-1.5 rounded-full appearance-none cursor-pointer transition-all focus:outline-none"
        />
      </div>

      {description && (
        <span className="text-[10px] block leading-tight" style={{ color: 'var(--text-muted)' }}>
          {description}
        </span>
      )}
    </div>
  );
};
