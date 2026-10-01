'use client';

// React-обёртки над процедурным арт-движком (§5): пиксельные спрайты и иконки.

import { useEffect, useState } from 'react';
import { BLANK_SPRITE, coinUrl, dwarfSpriteUrl, foeSpriteUrl, itemIconUrl, nodeIconUrl } from '@/lib/game/art';

// SSR: canvas недоступен, art.ts отдаёт BLANK_SPRITE. Чтобы гидрация сошлась,
// первый клиентский рендер тоже рисует заглушку — реальный dataURL подставляется
// сразу после монтирования (один кадр, под экраном загрузки не видно)
function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function PixelSprite({
  src,
  size,
  alt = '',
  className = '',
  style,
}: {
  src: string;
  size: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const mounted = useMounted();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mounted ? src : BLANK_SPRITE}
      alt={alt}
      draggable={false}
      width={size}
      height={size}
      className={`pixelated select-none ${className}`}
      style={style}
    />
  );
}

export function DwarfSprite({
  name,
  roleBias,
  size = 72,
  className = '',
  style,
}: {
  name: string;
  roleBias?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <PixelSprite
      src={dwarfSpriteUrl(name, roleBias)}
      size={size}
      alt={name}
      className={className}
      style={style}
    />
  );
}

export function FoeSprite({
  name,
  size = 72,
  className = '',
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <PixelSprite src={foeSpriteUrl(name)} size={size} alt={name} className={className} style={style} />
  );
}

export function ItemIcon({ itemId, size = 32, className = '' }: { itemId: string; size?: number; className?: string }) {
  return <PixelSprite src={itemIconUrl(itemId)} size={size} alt="" className={className} />;
}

export function NodeIcon({ type, size = 24, className = '' }: { type: string; size?: number; className?: string }) {
  return <PixelSprite src={nodeIconUrl(type)} size={size} alt="" className={className} />;
}

export function CoinIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return <PixelSprite src={coinUrl()} size={size} alt="золото" className={className} />;
}
