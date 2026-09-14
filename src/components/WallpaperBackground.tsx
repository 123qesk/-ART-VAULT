import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const WallpaperBackground: React.FC = () => {
  const { wallpaper } = useTheme();

  if (!wallpaper || wallpaper.type === 'none' || !wallpaper.url) {
    return null;
  }

  const opacity = (wallpaper.opacity !== undefined ? wallpaper.opacity : 85) / 100;
  const blur = wallpaper.blur || 0;
  const fit = wallpaper.fit || 'cover';

  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none transition-opacity duration-300"
      aria-hidden="true"
    >
      {wallpaper.type === 'image' && (
        <img
          src={wallpaper.url}
          alt="App Background Wallpaper"
          className="w-full h-full object-center transition-all duration-300"
          style={{
            objectFit: fit,
            opacity: opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            transform: blur > 0 ? 'scale(1.04)' : 'scale(1)', // prevent blur white edges
          }}
        />
      )}

      {wallpaper.type === 'video' && (
        <video
          src={wallpaper.url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-center transition-all duration-300"
          style={{
            objectFit: fit,
            opacity: opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            transform: blur > 0 ? 'scale(1.04)' : 'scale(1)',
          }}
        />
      )}

      {/* Removed subtle contrast mask as requested */}
    </div>
  );
};
