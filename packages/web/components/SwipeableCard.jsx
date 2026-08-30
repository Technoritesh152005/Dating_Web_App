'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ProfileCard } from './ProfileCard';

const SWIPE_THRESHOLD = 110;
const VELOCITY_THRESHOLD = 0.38; // px/ms quick flick threshold
const TAP_MOVEMENT_THRESHOLD = 8;

export function SwipeableCard({
  profile,
  onSwipe,
  onTap,
  disabled,
  topRightSlot,
  triggerAction,
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitingAction, setExitingAction] = useState(null);

  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const maxMovedRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const handledSwipeRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  const triggerExitAnimation = useCallback(
    (action) => {
      if (handledSwipeRef.current) return;
      handledSwipeRef.current = true;
      setExitingAction(action);

      const animationDuration = action === 'FIRE_LIKE' ? 360 : 320;
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          onSwipe?.(action);
        }
      }, animationDuration);
    },
    [onSwipe]
  );

  // Handle external button triggers (e.g. Pass, Like, SuperLike buttons)
  useEffect(() => {
    if (triggerAction && !exitingAction && !handledSwipeRef.current) {
      triggerExitAnimation(triggerAction);
    }
  }, [triggerAction, exitingAction, triggerExitAnimation]);

  const handlePointerDown = (e) => {
    if (disabled || exitingAction || handledSwipeRef.current) return;
    if (e.button !== undefined && e.button !== 0) return;

    isDraggingRef.current = true;
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    startRef.current = { x: startX, y: startY, time: Date.now() };
    offsetRef.current = { x: 0, y: 0 };
    maxMovedRef.current = 0;

    const handlePointerMove = (moveEvt) => {
      if (!isDraggingRef.current) return;

      const dx = moveEvt.clientX - startRef.current.x;
      const dy = moveEvt.clientY - startRef.current.y;
      const movedDist = Math.hypot(dx, dy);

      maxMovedRef.current = Math.max(maxMovedRef.current, movedDist);
      offsetRef.current = { x: dx, y: dy };
      setOffset({ x: dx, y: dy });
    };

    const handlePointerUp = (upEvt) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setIsDragging(false);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      const movedDist = maxMovedRef.current;
      const currentDx = offsetRef.current.x;
      const currentDy = offsetRef.current.y;
      const dt = Math.max(Date.now() - startRef.current.time, 1);
      const vx = currentDx / dt;
      const vy = currentDy / dt;

      // Handle Tap
      if (movedDist < TAP_MOVEMENT_THRESHOLD) {
        setOffset({ x: 0, y: 0 });
        offsetRef.current = { x: 0, y: 0 };
        return;
      }

      // Check Swipe Right (LIKE)
      if (currentDx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD) {
        triggerExitAnimation('LIKE');
        return;
      }

      // Check Swipe Left (PASS)
      if (currentDx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD) {
        triggerExitAnimation('PASS');
        return;
      }

      // Check Swipe Up (SUPER LIKE)
      if (currentDy < -SWIPE_THRESHOLD * 1.2 || vy < -VELOCITY_THRESHOLD * 1.2) {
        triggerExitAnimation('FIRE_LIKE');
        return;
      }

      // Snap back if threshold not met
      setOffset({ x: 0, y: 0 });
      offsetRef.current = { x: 0, y: 0 };
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // Compute Dynamic CSS Transforms & Animations
  const rotation = offset.x * 0.05;
  const likeOpacity = Math.min(Math.max(offset.x / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-offset.x / SWIPE_THRESHOLD, 0), 1);
  const superLikeOpacity = Math.min(Math.max(-offset.y / (SWIPE_THRESHOLD * 1.2), 0), 1);

  let transformStyle = `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg)`;
  let transitionStyle = isDragging
    ? 'none'
    : 'transform 380ms cubic-bezier(0.175, 0.885, 0.32, 1.25), opacity 320ms ease-out, filter 320ms ease-out';
  let opacityStyle = 1;
  let filterStyle = 'none';

  if (exitingAction) {
    const exitY = offset.y || 0;
    transitionStyle =
      'transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 340ms ease-out, filter 340ms ease-out';
    opacityStyle = 0;
    filterStyle = 'blur(8px)';

    if (exitingAction === 'LIKE') {
      transformStyle = `translate3d(140vw, ${exitY * 1.5}px, 0) rotate(42deg) scale(0.9)`;
    } else if (exitingAction === 'FIRE_LIKE') {
      transformStyle = 'translate3d(0, -140vh, 0) rotate(0deg) scale(1.15)';
      filterStyle = 'blur(4px)';
    } else {
      // PASS
      transformStyle = `translate3d(-140vw, ${exitY * 1.5}px, 0) rotate(-42deg) scale(0.9)`;
    }
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      className="absolute inset-0 flex items-center justify-center cursor-grab touch-none active:cursor-grabbing select-none"
      style={{
        transform: transformStyle,
        transition: transitionStyle,
        opacity: opacityStyle,
        filter: filterStyle,
        willChange: 'transform, opacity, filter',
      }}
    >
      <ProfileCard profile={profile} onOpenDetail={onTap} />

      {topRightSlot && (
        <div className="absolute right-4 top-4 z-30" onPointerDown={(e) => e.stopPropagation()}>
          {topRightSlot}
        </div>
      )}

      {/* Dynamic Swipe Action Badges */}
      <div
        className="pointer-events-none absolute left-8 top-10 rotate-[-15deg] rounded-2xl border-2 border-mehendi bg-mehendi/25 px-5 py-2 font-mono text-2xl font-extrabold uppercase text-mehendi-light shadow-[0_0_25px_rgba(46,204,113,0.5)] backdrop-blur-md transition-transform"
        style={{
          opacity: likeOpacity,
          transform: `scale(${0.8 + likeOpacity * 0.3}) rotate(-15deg)`,
        }}
      >
        LIKE
      </div>

      <div
        className="pointer-events-none absolute right-8 top-10 rotate-[15deg] rounded-2xl border-2 border-sindoor bg-sindoor/25 px-5 py-2 font-mono text-2xl font-extrabold uppercase text-sindoor-light shadow-[0_0_25px_rgba(230,57,80,0.5)] backdrop-blur-md transition-transform"
        style={{
          opacity: passOpacity,
          transform: `scale(${0.8 + passOpacity * 0.3}) rotate(15deg)`,
        }}
      >
        PASS
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 rounded-2xl border-2 border-gold bg-gold/25 px-5 py-2 font-mono text-2xl font-extrabold uppercase text-gold shadow-[0_0_25px_rgba(240,162,2,0.6)] backdrop-blur-md transition-transform"
        style={{
          opacity: superLikeOpacity,
          transform: `translate(-50%, 0) scale(${0.8 + superLikeOpacity * 0.3})`,
        }}
      >
        SUPER LIKE
      </div>
    </div>
  );
}

