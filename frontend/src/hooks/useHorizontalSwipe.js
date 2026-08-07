import { useCallback, useRef, useState } from 'react';

const DIRECTION_LOCK_PX = 12;
const HORIZONTAL_INTENT_RATIO = 2;
const MAX_DRAG_PX = 120;
const SWIPE_THRESHOLD_PX = 80;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function useHorizontalSwipe({ enabled, onSwipeLeft, onSwipeRight }) {
  const [dragX, setDragX] = useState(0);
  const startRef = useRef(null);
  const axisRef = useRef(null);
  const committedRef = useRef(false);

  const clearGesture = useCallback(() => {
    startRef.current = null;
    axisRef.current = null;
    setDragX(0);
  }, []);

  const onPointerDown = useCallback((event) => {
    if (!enabled || !['touch', 'pen'].includes(event.pointerType)) return;
    startRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
    axisRef.current = null;
    committedRef.current = false;
  }, [enabled]);

  const onPointerMove = useCallback((event) => {
    const start = startRef.current;
    if (!enabled || !start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.clientX;
    const deltaY = event.clientY - start.clientY;
    if (!axisRef.current && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= DIRECTION_LOCK_PX) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absY >= absX) {
        axisRef.current = 'vertical';
      } else if (absX >= absY * HORIZONTAL_INTENT_RATIO) {
        axisRef.current = 'horizontal';
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
    }
    if (axisRef.current === 'horizontal') {
      setDragX(clamp(deltaX, -MAX_DRAG_PX, MAX_DRAG_PX));
    }
  }, [enabled]);

  const finishPointer = useCallback((event) => {
    const start = startRef.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.clientX;
    const shouldCommit = axisRef.current === 'horizontal'
      && Math.abs(deltaX) >= SWIPE_THRESHOLD_PX
      && !committedRef.current;
    clearGesture();
    if (!shouldCommit) return;

    committedRef.current = true;
    if (deltaX < 0) onSwipeLeft();
    else onSwipeRight();
  }, [clearGesture, onSwipeLeft, onSwipeRight]);

  return {
    dragX,
    direction: dragX === 0 ? null : dragX < 0 ? 'left' : 'right',
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishPointer,
      onPointerCancel: clearGesture,
    },
  };
}
