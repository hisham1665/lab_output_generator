import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { useStore } from '../../../store/globalStore';
import { CropOverlay } from './CropOverlay';
import type { CanvasElement } from '../../../types';

interface CanvasOverlayProps {
  pageNumber: number;
  width: number;
  height: number;
  effectiveZoom: number;
}

const ImageElement: React.FC<{
  element: CanvasElement;
  isSelected: boolean;
  isCropMode: boolean;
  zoomScale: number;
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
}> = ({ element, isSelected, isCropMode, zoomScale, onSelect, onChange }) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = element.dataUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [element.dataUrl]);

  useEffect(() => {
    if (isSelected && !isCropMode && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isCropMode, zoomScale]);

  // Calculate the displayed dimensions
  const displayX = element.x * zoomScale;
  const displayY = element.y * zoomScale;
  const displayW = element.width * zoomScale;
  const displayH = element.height * zoomScale;

  // Build Konva image props — if crop is set, use Konva's native crop to clip the source image
  const imageProps: any = {
    ref: shapeRef,
    image: image || undefined,
    x: displayX,
    y: displayY,
    width: displayW,
    height: displayH,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable: !element.isLocked && !isCropMode,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: () => onChange({ isLocked: !element.isLocked }),
    onDblTap: () => onChange({ isLocked: !element.isLocked }),
    onDragEnd: (e: any) => {
      onChange({
        x: e.target.x() / zoomScale,
        y: e.target.y() / zoomScale,
      });
    },
    onTransformEnd: () => {
      if (!shapeRef.current) return;
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        x: node.x() / zoomScale,
        y: node.y() / zoomScale,
        width: Math.max(5, (node.width() * scaleX) / zoomScale),
        height: Math.max(5, (node.height() * scaleY) / zoomScale),
        rotation: node.rotation(),
      });
    },
  };

  // Apply Konva native crop — this clips the source image pixels
  if (element.crop && image) {
    imageProps.crop = {
      x: element.crop.x,
      y: element.crop.y,
      width: element.crop.width,
      height: element.crop.height,
    };
  }

  return (
    <>
      <KonvaImage {...imageProps} />
      {isSelected && !element.isLocked && !isCropMode && (
        <Transformer
          ref={trRef}
          anchorSize={16}
          anchorCornerRadius={4}
          anchorFill="#ffffff"
          anchorStroke="#6366f1"
          anchorStrokeWidth={2}
          borderStroke="#6366f1"
          borderDash={[4, 4]}
          padding={2}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({ pageNumber, width, height, effectiveZoom }) => {
  const { 
    elements, 
    selectedElementId, 
    setSelectedElementId, 
    updateElement, 
    deleteElement 
  } = useStore();
  const zoomScale = effectiveZoom;

  // Crop mode state: which element is currently being cropped
  const [cropElementId, setCropElementId] = useState<string | null>(null);
  const [cropNaturalSize, setCropNaturalSize] = useState({ width: 100, height: 100 });

  // Expose crop mode controls via a global ref so the parent/App can activate crop mode
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { elementId, action } = e.detail;
      if (action === 'start-crop') {
        const el = elements.find((el) => el.id === elementId);
        if (el) {
          // Load natural size
          const img = new window.Image();
          img.src = el.dataUrl;
          img.onload = () => {
            setCropNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            // Initialize crop to full image if not already set
            if (!el.crop) {
              updateElement(elementId, {
                crop: { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight },
              });
            }
            setCropElementId(elementId);
          };
        }
      } else if (action === 'cancel-crop') {
        setCropElementId(null);
      }
    };

    window.addEventListener('crop-control' as any, handler as any);
    return () => window.removeEventListener('crop-control' as any, handler as any);
  }, [elements, updateElement]);

  // Keyboard nudging and deletion shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      const activeEl = elements.find((el) => el.id === selectedElementId);
      if (!activeEl) return;

      const delta = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateElement(selectedElementId, { y: activeEl.y - delta });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateElement(selectedElementId, { y: activeEl.y + delta });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateElement(selectedElementId, { x: activeEl.x - delta });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateElement(selectedElementId, { x: activeEl.x + delta });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElement(selectedElementId);
      } else if (e.key === 'Escape' && cropElementId) {
        setCropElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, updateElement, deleteElement, cropElementId]);

  const pageElements = elements
    .filter((el) => el.pageNumber === pageNumber)
    .sort((a, b) => a.zIndex - b.zIndex);

  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedElementId(null);
      setCropElementId(null);
    }
  };

  const cropElement = cropElementId ? elements.find((el) => el.id === cropElementId) : null;

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={handleStageClick}
      onTouchStart={handleStageClick}
      className="absolute top-0 left-0 z-20 pointer-events-auto"
    >
      <Layer>
        {pageElements.map((el) => (
          <ImageElement
            key={el.id}
            element={el}
            zoomScale={zoomScale}
            isSelected={el.id === selectedElementId}
            isCropMode={el.id === cropElementId}
            onSelect={() => setSelectedElementId(el.id)}
            onChange={(newAttrs) => updateElement(el.id, newAttrs)}
          />
        ))}

        {/* Crop overlay for the active crop element */}
        {cropElement && cropElement.pageNumber === pageNumber && (
          <CropOverlay
            element={cropElement}
            zoomScale={zoomScale}
            naturalWidth={cropNaturalSize.width}
            naturalHeight={cropNaturalSize.height}
            onCropChange={(newCrop) => {
              updateElement(cropElement.id, { crop: newCrop });
            }}
            onApply={() => {
              setCropElementId(null);
              // Dispatch event to notify App that crop was applied
              window.dispatchEvent(new CustomEvent('crop-applied', { detail: { elementId: cropElement.id } }));
            }}
            onCancel={() => {
              setCropElementId(null);
            }}
          />
        )}
      </Layer>
    </Stage>
  );
};
export default CanvasOverlay;
