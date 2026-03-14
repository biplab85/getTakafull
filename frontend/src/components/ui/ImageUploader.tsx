'use client';

import { useState, useRef, useCallback } from 'react';

interface ImageUploaderProps {
  currentImage?: string | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
}

export default function ImageUploader({ currentImage, onFileSelect, accept = '.jpg,.jpeg,.png,.gif' }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) return;
    setPreviewUrl(URL.createObjectURL(file));
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleRemove = () => {
    setPreviewUrl(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasImage = !!previewUrl;

  return (
    <div className="image-uploader">
      <label style={{ fontSize: 13, fontWeight: 500, color: '#444', display: 'block', marginBottom: 8 }}>Profile Image</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Preview */}
        <div className="image-uploader-preview">
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Profile" />
              <div className="image-uploader-overlay">
                <button type="button" onClick={() => inputRef.current?.click()} className="image-uploader-icon-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button type="button" onClick={handleRemove} className="image-uploader-icon-btn delete">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="image-uploader-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>

        {/* Upload Zone */}
        <div style={{ flex: 1 }}>
          <div
            className={`image-uploader-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className="image-uploader-dropzone-content">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-color)" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="image-uploader-dropzone-text">
                <span style={{ color: 'var(--brand-color)', fontWeight: 500 }}>Click to upload</span> or drag and drop
              </p>
              <p className="image-uploader-dropzone-hint">JPG, JPEG, PNG or GIF (max 2MB)</p>
            </div>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-default-color)', marginTop: 6 }}>Accepted file types: jpg, jpeg, png, gif.</p>
    </div>
  );
}
