import React from 'react';
import { Eye } from 'lucide-react';

interface ImagePreviewProps {
  url?: string | null;
}

export function ImagePreview({ url }: ImagePreviewProps) {
  if (!url) return null;
  const resolved = url.startsWith('http') || url.startsWith('/') ? url : `/${url}`;
  return (
    <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-border bg-surface-soft">
      <img
        src={resolved}
        alt="Preview"
        className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp'; }}
      />
      <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
        <Eye size={10} /> Preview
      </div>
    </div>
  );
}
