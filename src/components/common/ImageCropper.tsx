import { useState, useRef, useEffect } from 'react';
import { X, Crop, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCrop: (croppedImage: string) => void;
  onClose: () => void;
}

export default function ImageCropper({ image, onCrop, onClose }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [dispSize, setDispSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (imgRef.current?.complete) calcSizes();
  }, []);

  const calcSizes = () => {
    const img = imgRef.current;
    if (!img) return;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalSize({ w: nw, h: nh });
    const maxW = Math.min(500, window.innerWidth - 80);
    const maxH = Math.min(400, window.innerHeight - 300);
    const ratio = Math.min(maxW / nw, maxH / nh, 1);
    setDispSize({ w: Math.round(nw * ratio), h: Math.round(nh * ratio) });
  };

  const getPos = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(clientX - rect.left, dispSize.w)),
      y: Math.max(0, Math.min(clientY - rect.top, dispSize.h)),
    };
  };

  const handleStart = (clientX: number, clientY: number) => {
    const pos = getPos(clientX, clientY);
    setSelecting(true);
    setStartPos(pos);
    setSelection(null);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!selecting || !startPos) return;
    const pos = getPos(clientX, clientY);
    const x = Math.min(startPos.x, pos.x);
    const y = Math.min(startPos.y, pos.y);
    const w = Math.abs(pos.x - startPos.x);
    const h = Math.abs(pos.y - startPos.y);
    if (w < 5 && h < 5) return;
    setSelection({ x, y, w: Math.max(w, 5), h: Math.max(h, 5) });
  };

  const handleEnd = () => {
    setSelecting(false);
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };
  const onMouseUp = () => handleEnd();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onTouchEnd = () => handleEnd();

  const doCrop = () => {
    if (!selection || selection.w < 10 || selection.h < 10 || !imgRef.current) return;
    const ratio = naturalSize.w / dispSize.w;
    const sx = selection.x * ratio;
    const sy = selection.y * ratio;
    const sw = selection.w * ratio;
    const sh = selection.h * ratio;
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, sw, sh);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  const doRotate = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  // Prevent overlay close when clicking dialog content
  const onDialogClick = (e: React.MouseEvent) => e.stopPropagation();

  if (!dispSize.w) {
    return (
      <div ref={overlayRef} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <img ref={imgRef} src={image} alt="加载中" className="max-w-full max-h-[400px]" onLoad={() => {
            calcSizes();
          }} />
        </div>
      </div>
    );
  }

  const hasSelection = selection && selection.w > 10 && selection.h > 10;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4" onClick={onDialogClick}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Crop className="w-4 h-4 text-indigo-500" />
            裁剪图片
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Image area */}
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative mx-auto select-none"
            style={{ width: dispSize.w, height: dispSize.h }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img ref={imgRef} src={image} alt="待裁剪"
              className="block"
              style={{ width: dispSize.w, height: dispSize.h, objectFit: 'contain' }}
              draggable={false} />

            {/* Selection with overlay */}
            {hasSelection && (
              <>
                <svg className="absolute inset-0 pointer-events-none" width={dispSize.w} height={dispSize.h}>
                  <defs>
                    <mask id="cm">
                      <rect width={dispSize.w} height={dispSize.h} fill="white" />
                      <rect x={selection!.x} y={selection!.y} width={selection!.w} height={selection!.h} fill="black" />
                    </mask>
                  </defs>
                  <rect width={dispSize.w} height={dispSize.h} fill="rgba(0,0,0,0.4)" mask="url(#cm)" />
                </svg>
                <div className="absolute border-2 border-orange-400 pointer-events-none"
                  style={{ left: selection!.x, top: selection!.y, width: selection!.w, height: selection!.h }}>
                  {/* Corner dots */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-orange-400 rounded-full" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-orange-400 rounded-full" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-orange-400 rounded-full" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-orange-400 rounded-full" />
                </div>
              </>
            )}

            {!hasSelection && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
                  拖动选择裁剪区域
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button onClick={doRotate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RotateCw className="w-4 h-4" />
            右旋90°
          </button>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              取消
            </button>
            <button onClick={doCrop}
              disabled={!hasSelection}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <Crop className="w-4 h-4" />
              裁剪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
