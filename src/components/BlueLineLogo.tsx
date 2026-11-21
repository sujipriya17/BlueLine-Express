import { BusFront } from 'lucide-react';

interface BlueLineLogoProps {
  variant?: 'dark' | 'light';
}

export function BlueLineLogo({ variant = 'dark' }: BlueLineLogoProps) {
  const isLight = variant === 'light';
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
          isLight ? 'bg-sky-500 text-white' : 'bg-[#0F294A] text-white'
        }`}
      >
        <BusFront className="w-4 h-4" />
      </span>
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          isLight ? 'text-white' : 'text-[#0F294A]'
        }`}
      >
        BlueLine <span className={isLight ? 'text-sky-300' : 'text-[#0284C7]'}>Express</span>
      </span>
    </span>
  );
}
