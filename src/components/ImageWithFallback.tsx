import { BusFront } from 'lucide-react';
import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithFallback({ src, alt, className = '' }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0F294A] to-[#0284C7] text-white p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <BusFront className="w-10 h-10 text-sky-200 mb-2" />
        <span className="text-sm font-medium text-sky-100">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
