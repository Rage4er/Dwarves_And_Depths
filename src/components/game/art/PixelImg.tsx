'use client';

// Рендер процедурного спрайта: <img> с dataURL (генерируется на клиенте, кэшируется).
// До монтирования — прозрачный placeholder того же размера, чтобы не было рассинхрона SSR.

import { useEffect, useState } from 'react';

export function PixelImg({
  url,
  size = 32,
  alt = '',
  className = '',
  style,
}: {
  url: string;
  size?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !url) {
    return (
      <span
        aria-hidden
        className={className}
        style={{ display: 'inline-block', width: size, height: size, ...style }}
      />
    );
  }

  return (
    <img
      src={url}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
      className={`pixelated select-none ${className}`}
      style={style}
    />
  );
}
