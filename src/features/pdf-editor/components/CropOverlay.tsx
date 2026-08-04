import React, { useCallback } from 'react';
import { Rect, Group, Line } from 'react-konva';
import type { CanvasElement } from '../../../types';

interface CropOverlayProps {
  element: CanvasElement;
  zoomScale: number;
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
  onApply: () => void;
  onCancel: () => void;
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Visual crop overlay that renders on top of an image element.
 * Users drag the crop frame and its handles to select a region — 
 * just like a real photo editor crop tool.
 *
 * The crop values are in SOURCE IMAGE pixel coordinates.
 * The overlay is rendered in STAGE coordinates (scaled by zoomScale).
 */
export const CropOverlay: React.FC<CropOverlayProps> = ({
  element,
  zoomScale,
  onCropChange,
  onApply: _onApply,
  onCancel: _onCancel,
  naturalWidth,
  naturalHeight,
}) => {
  // Current crop in source coords
  const crop = element.crop || { x: 0, y: 0, width: naturalWidth, height: naturalHeight };

  // Element position in stage coords
  const elX = element.x * zoomScale;
  const elY = element.y * zoomScale;
  const elW = element.width * zoomScale;
  const elH = element.height * zoomScale;

  // Scale factors: source pixels → stage pixels
  const scaleX = elW / naturalWidth;
  const scaleY = elH / naturalHeight;

  // Crop region in stage coords
  const cropStageX = elX + crop.x * scaleX;
  const cropStageY = elY + crop.y * scaleY;
  const cropStageW = crop.width * scaleX;
  const cropStageH = crop.height * scaleY;

  // Handle size
  const HANDLE = 12;

  // Helper: clamp crop to natural size bounds
  const clampCrop = useCallback((c: { x: number; y: number; width: number; height: number }) => {
    const minSize = 20;
    let { x, y, width, height } = c;
    x = Math.max(0, Math.min(x, naturalWidth - minSize));
    y = Math.max(0, Math.min(y, naturalHeight - minSize));
    width = Math.max(minSize, Math.min(width, naturalWidth - x));
    height = Math.max(minSize, Math.min(height, naturalHeight - y));
    return { x, y, width, height };
  }, [naturalWidth, naturalHeight]);

  // ─── Drag the crop region (move) ───
  const handleCropDrag = useCallback((e: any) => {
    const node = e.target;
    // Convert stage coords back to source coords
    const newX = (node.x() - elX) / scaleX;
    const newY = (node.y() - elY) / scaleY;
    
    const clamped = clampCrop({
      x: newX,
      y: newY,
      width: crop.width,
      height: crop.height,
    });
    
    // Reset node position to the clamped value
    node.x(elX + clamped.x * scaleX);
    node.y(elY + clamped.y * scaleY);
    
    onCropChange(clamped);
  }, [elX, elY, scaleX, scaleY, crop.width, crop.height, clampCrop, onCropChange]);

  // ─── Drag a handle to resize ───
  const handleResizeHandle = useCallback((corner: string) => (e: any) => {
    const node = e.target;
    const handleStageX = node.x() + HANDLE / 2;
    const handleStageY = node.y() + HANDLE / 2;

    // Convert to source coords
    const srcX = (handleStageX - elX) / scaleX;
    const srcY = (handleStageY - elY) / scaleY;

    let newCrop = { ...crop };

    switch (corner) {
      case 'tl': // top-left
        newCrop = {
          x: srcX,
          y: srcY,
          width: crop.x + crop.width - srcX,
          height: crop.y + crop.height - srcY,
        };
        break;
      case 'tr': // top-right
        newCrop = {
          x: crop.x,
          y: srcY,
          width: srcX - crop.x,
          height: crop.y + crop.height - srcY,
        };
        break;
      case 'bl': // bottom-left
        newCrop = {
          x: srcX,
          y: crop.y,
          width: crop.x + crop.width - srcX,
          height: srcY - crop.y,
        };
        break;
      case 'br': // bottom-right
        newCrop = {
          x: crop.x,
          y: crop.y,
          width: srcX - crop.x,
          height: srcY - crop.y,
        };
        break;
      case 't': // top edge
        newCrop = {
          x: crop.x,
          y: srcY,
          width: crop.width,
          height: crop.y + crop.height - srcY,
        };
        break;
      case 'b': // bottom edge
        newCrop = {
          x: crop.x,
          y: crop.y,
          width: crop.width,
          height: srcY - crop.y,
        };
        break;
      case 'l': // left edge
        newCrop = {
          x: srcX,
          y: crop.y,
          width: crop.x + crop.width - srcX,
          height: crop.height,
        };
        break;
      case 'r': // right edge
        newCrop = {
          x: crop.x,
          y: crop.y,
          width: srcX - crop.x,
          height: crop.height,
        };
        break;
    }

    const clamped = clampCrop(newCrop);
    onCropChange(clamped);
  }, [crop, elX, elY, scaleX, scaleY, clampCrop, onCropChange]);

  // Build drag-bound function for the crop region
  const cropDragBound = useCallback((pos: { x: number; y: number }) => {
    const maxX = elX + (naturalWidth - crop.width) * scaleX;
    const maxY = elY + (naturalHeight - crop.height) * scaleY;
    return {
      x: Math.max(elX, Math.min(pos.x, maxX)),
      y: Math.max(elY, Math.min(pos.y, maxY)),
    };
  }, [elX, elY, naturalWidth, naturalHeight, crop.width, crop.height, scaleX, scaleY]);

  // Handle positions for the 8 handles
  const handles = [
    { id: 'tl', x: cropStageX - HANDLE / 2, y: cropStageY - HANDLE / 2, cursor: 'nwse-resize' },
    { id: 'tr', x: cropStageX + cropStageW - HANDLE / 2, y: cropStageY - HANDLE / 2, cursor: 'nesw-resize' },
    { id: 'bl', x: cropStageX - HANDLE / 2, y: cropStageY + cropStageH - HANDLE / 2, cursor: 'nesw-resize' },
    { id: 'br', x: cropStageX + cropStageW - HANDLE / 2, y: cropStageY + cropStageH - HANDLE / 2, cursor: 'nwse-resize' },
    { id: 't', x: cropStageX + cropStageW / 2 - HANDLE / 2, y: cropStageY - HANDLE / 2, cursor: 'ns-resize' },
    { id: 'b', x: cropStageX + cropStageW / 2 - HANDLE / 2, y: cropStageY + cropStageH - HANDLE / 2, cursor: 'ns-resize' },
    { id: 'l', x: cropStageX - HANDLE / 2, y: cropStageY + cropStageH / 2 - HANDLE / 2, cursor: 'ew-resize' },
    { id: 'r', x: cropStageX + cropStageW - HANDLE / 2, y: cropStageY + cropStageH / 2 - HANDLE / 2, cursor: 'ew-resize' },
  ];

  // Rule-of-thirds guide lines
  const thirdW = cropStageW / 3;
  const thirdH = cropStageH / 3;

  return (
    <Group>
      {/* Dark overlay – LEFT of crop */}
      <Rect x={elX} y={elY} width={cropStageX - elX} height={elH} fill="rgba(0,0,0,0.55)" listening={false} />
      {/* Dark overlay – RIGHT of crop */}
      <Rect x={cropStageX + cropStageW} y={elY} width={elX + elW - (cropStageX + cropStageW)} height={elH} fill="rgba(0,0,0,0.55)" listening={false} />
      {/* Dark overlay – TOP of crop (between left & right) */}
      <Rect x={cropStageX} y={elY} width={cropStageW} height={cropStageY - elY} fill="rgba(0,0,0,0.55)" listening={false} />
      {/* Dark overlay – BOTTOM of crop (between left & right) */}
      <Rect x={cropStageX} y={cropStageY + cropStageH} width={cropStageW} height={elY + elH - (cropStageY + cropStageH)} fill="rgba(0,0,0,0.55)" listening={false} />

      {/* Crop region (draggable) */}
      <Rect
        x={cropStageX}
        y={cropStageY}
        width={cropStageW}
        height={cropStageH}
        fill="transparent"
        stroke="#818cf8"
        strokeWidth={2}
        draggable
        dragBoundFunc={cropDragBound}
        onDragEnd={handleCropDrag}
      />

      {/* Rule of thirds guides */}
      <Line points={[cropStageX + thirdW, cropStageY, cropStageX + thirdW, cropStageY + cropStageH]} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} listening={false} />
      <Line points={[cropStageX + thirdW * 2, cropStageY, cropStageX + thirdW * 2, cropStageY + cropStageH]} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} listening={false} />
      <Line points={[cropStageX, cropStageY + thirdH, cropStageX + cropStageW, cropStageY + thirdH]} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} listening={false} />
      <Line points={[cropStageX, cropStageY + thirdH * 2, cropStageX + cropStageW, cropStageY + thirdH * 2]} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} listening={false} />

      {/* 8 resize handles */}
      {handles.map((h) => (
        <Rect
          key={h.id}
          x={h.x}
          y={h.y}
          width={HANDLE}
          height={HANDLE}
          fill="#ffffff"
          stroke="#818cf8"
          strokeWidth={2}
          cornerRadius={2}
          draggable
          onDragEnd={handleResizeHandle(h.id)}
          hitStrokeWidth={20}
        />
      ))}
    </Group>
  );
};

export default CropOverlay;
