'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, Crop } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
  onClose: () => void;
  onCropComplete: (file: File) => void;
  outputSize?: number;
}

const BOX_SIZE = 320; // Size of the square crop frame in UI

export default function ImageCropModal({
  isOpen,
  imageUrl,
  title = 'Adjust QR Code Frame',
  onClose,
  onCropComplete,
  outputSize = 800
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgDims, setImgDims] = useState<{ width: number; height: number; baseW: number; baseH: number } | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset states when a new image is provided
  useEffect(() => {
    if (!imageUrl) return;
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const W = img.naturalWidth || 600;
      const H = img.naturalHeight || 600;
      // Scale so the smaller dimension fits the box
      const initialScale = Math.max(BOX_SIZE / W, BOX_SIZE / H);
      setImgDims({
        width: W,
        height: H,
        baseW: W * initialScale,
        baseH: H * initialScale
      });
    };
  }, [imageUrl, isOpen]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(Math.max(0.6, prev + delta), 3.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleConfirmCrop = useCallback(() => {
    if (!imgDims || !imageUrl) return;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Solid white background (vital for high-contrast QR reading)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outputSize, outputSize);

    const R = outputSize / BOX_SIZE;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      ctx.save();
      // Center canvas
      ctx.translate(outputSize / 2, outputSize / 2);
      // Pan
      ctx.translate(pan.x * R, pan.y * R);
      // Rotate
      ctx.rotate((rotation * Math.PI) / 180);
      // Scale
      ctx.scale(zoom * R, zoom * R);
      // Draw image centered
      ctx.drawImage(
        img,
        -imgDims.baseW / 2,
        -imgDims.baseH / 2,
        imgDims.baseW,
        imgDims.baseH
      );
      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], `qr_cropped_${Date.now()}.png`, { type: 'image/png' });
        onCropComplete(file);
      }, 'image/png');
    };
  }, [imgDims, imageUrl, outputSize, pan, rotation, zoom, onCropComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
              <p className="text-[11px] text-zinc-400">Drag & zoom to frame the QR code inside the square</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Viewport */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800/90 shadow-inner flex items-center justify-center">
          <div
            style={{ width: BOX_SIZE, height: BOX_SIZE }}
            className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
          >
            {imgDims && (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop Source"
                draggable={false}
                style={{
                  width: `${imgDims.baseW}px`,
                  height: `${imgDims.baseH}px`,
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: `-${imgDims.baseW / 2}px`,
                  marginTop: `-${imgDims.baseH / 2}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
                className="pointer-events-none select-none transition-transform duration-75"
              />
            )}

            {/* Square Frame Border Overlay & Rule-of-Thirds Grid */}
            <div className="absolute inset-0 pointer-events-none border-2 border-purple-500/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {/* Corner Bracket Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400" />

              {/* Grid Lines */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-25">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            </div>

            {/* Quick helper tag */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-mono text-zinc-400 border border-white/10 flex items-center gap-1">
                <Move className="w-3 h-3 text-purple-400" />
                Drag to center QR
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="w-full space-y-3.5 mt-5">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="range"
              min="0.6"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-purple-500 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="text-xs font-mono text-zinc-400 w-12 text-right shrink-0">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700/60"
              >
                <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200 font-mono text-xs transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            <span className="text-[10px] font-mono text-zinc-500">
              Output: {outputSize}x{outputSize}px PNG
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-end gap-3 pt-5 mt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmCrop}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply & Upload QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

