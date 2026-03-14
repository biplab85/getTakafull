'use client';

import { useEffect } from 'react';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function SlidePanel({ isOpen, onClose, title, subtitle, children }: SlidePanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="slide-panel-overlay" onClick={onClose} />
      <div className={`m-view-details popup-details ${isOpen ? 'open' : ''}`}>
        <div className="m-view-header flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-sm text-white">
              {title} {subtitle && <span className="font-normal"> / {subtitle}</span>}
            </span>
          </div>
          <button className="cursor-pointer" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="full-content">
          {children}
        </div>
      </div>
    </>
  );
}
