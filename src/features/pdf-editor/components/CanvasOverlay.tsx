import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { useStore } from '../../../store/globalStore';
import type { CanvasElement } from '../../../types';

interface CanvasOverlayProps {
  pageNumber: number;
  width: number;
  height: number;
}

const ImageElement: React.FC<{
  element: CanvasElement;
  isSelected: boolean;
  zoomScale: number;
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
}> = ({ element, isSelected, zoomScale, onSelect, onChange }) => {
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
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, zoomScale]);

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
    draggable: !element.isLocked,
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
      {isSelected && !element.isLocked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({ pageNumber, width, height }) => {
  const { 
    elements, 
    selectedElementId, 
    setSelectedElementId, 
    updateElement, 
    pdfDoc, 
    deleteElement 
  } = useStore();
  const zoomScale = pdfDoc.zoomScale;

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, updateElement, deleteElement]);

  const pageElements = elements
    .filter((el) => el.pageNumber === pageNumber)
    .sort((a, b) => a.zIndex - b.zIndex);

  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedElementId(null);
    }
  };

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
            onSelect={() => setSelectedElementId(el.id)}
            onChange={(newAttrs) => updateElement(el.id, newAttrs)}
          />
        ))}
      </Layer>
    </Stage>
  );
};
export default CanvasOverlay;
