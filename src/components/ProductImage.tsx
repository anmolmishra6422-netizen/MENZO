import React, { useState } from 'react';
import { Shirt } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
}

export function ProductImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  aspectClass = 'aspect-[4/3]',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${aspectClass} w-full bg-gradient-to-br from-neutral-100 via-stone-100 to-neutral-200 flex flex-col items-center justify-center p-4 text-center`}
      >
        <Shirt className="w-8 h-8 text-neutral-400 mb-2" strokeWidth={1.25} />
        <span className="text-xs text-neutral-500 font-medium line-clamp-2 max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`${aspectClass} w-full bg-[#F5F5F3] overflow-hidden`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    </div>
  );
}
