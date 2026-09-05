import { useCallback, useRef, useState } from 'react';

const MAX_FILES = 8;

export function createDemoFile() {
  const canvas = document.createElement('canvas');
  canvas.width  = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 400, 400);

  const grad = ctx.createRadialGradient(200, 200, 20, 200, 200, 180);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(1, '#0f172a');
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 10;
  ctx.beginPath();
  ctx.arc(200, 200, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f0ede6';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE PRODUCT', 200, 192);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '11px sans-serif';
  ctx.fillText('DEMO ASSET', 200, 215);

  const dataUrl = canvas.toDataURL('image/png');
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], 'demo_product.png', { type: mime });
}

export default function BatchUploadZone({ files, onFilesChange }) {
  const inputRef  = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    const combined = [...files, ...incoming].slice(0, MAX_FILES);
    onFilesChange(combined);
  }, [files, onFilesChange]);

  const removeAt = (idx) => onFilesChange(files.filter((_, i) => i !== idx));

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          background: dragOver ? 'var(--accent-dim)' : 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
          Drop photos here, or click to browse
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>
          Up to {MAX_FILES} images · JPG, PNG, WebP
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onFilesChange([...files, createDemoFile()].slice(0, MAX_FILES));
          }}
        >
          Use demo asset
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          marginTop: 12,
        }}>
          {files.map((f, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  display: 'block',
                }}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAt(idx); }}
                title="Remove"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(23,23,26,0.85)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                ✕
              </button>
              <p style={{
                marginTop: 4,
                fontSize: 10,
                color: 'var(--text-3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {f.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
