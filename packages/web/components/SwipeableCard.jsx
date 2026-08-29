'use client';

import { useState, useRef, useEffect } from 'react';
import { ProfileCard } from './ProfileCard';

const SWIPE_THRESHOLD = 120;
const EXIT_DISTANCE = 700;
const TAP_MOVEMENT_THRESHOLD = 8;

export function SwipeableCard({ profile, onSwipe, onTap, disabled, topRightSlot, triggerAction }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(null);
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(0);

  useEffect(() => {
    if (triggerAction && !exiting) {
      setExiting(triggerAction);
      const timer = setTimeout(() => {
        onSwipe(triggerAction);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [triggerAction, exiting, onSwipe]);

  const handlePointerDown = (e) => {
    if (disabled || exiting) return;
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    movedRef.current = Math.max(movedRef.current, Math.abs(dx), Math.abs(dy));
    setOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);

    if (movedRef.current < TAP_MOVEMENT_THRESHOLD) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    if (Math.abs(offset.x) > SWIPE_THRESHOLD) {
      const action = offset.x > 0 ? 'LIKE' : 'PASS';
      setExiting(action);
      setTimeout(() => onSwipe(action), 220);
    } else {
      setOffset({ x: 0, y: 0 });
    }
  };

  const rotation = offset.x * 0.04;
  const likeOpacity = Math.min(Math.max(offset.x / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-offset.x / SWIPE_THRESHOLD, 0), 1);
  const superLikeOpacity = Math.min(Math.max(Math.abs(offset.x) / (SWIPE_THRESHOLD * 1.5), 0), 1);

  const transform = exiting
    ? `translateX(${exiting === 'LIKE' ? EXIT_DISTANCE : exiting === 'FIRE_LIKE' ? EXIT_DISTANCE * 0.65 : -EXIT_DISTANCE}px) rotate(${exiting === 'LIKE' ? 25 : exiting === 'FIRE_LIKE' ? 15 : -25}deg)`
    : `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 flex items-center justify-center cursor-grab touch-none active:cursor-grabbing select-none"
      style={{
        transform,
        transition: dragging ? 'none' : 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <ProfileCard profile={profile} onOpenDetail={onTap} />

      {topRightSlot && (
        <div className="absolute right-4 top-4 z-30" onPointerDown={(e) => e.stopPropagation()}>
          {topRightSlot}
        </div>
      )}

      {/* Drag Badges */}
      <div
        className="pointer-events-none absolute left-8 top-10 rotate-[-15deg] rounded-2xl border-2 border-mehendi bg-mehendi/20 px-5 py-2 font-mono text-xl font-bold uppercase text-mehendi-light shadow-[0_0_20px_rgba(46,204,113,0.4)] backdrop-blur-md"
        style={{ opacity: likeOpacity }}
      >
        LIKE
      </div>
      <div
        className="pointer-events-none absolute right-8 top-10 rotate-[15deg] rounded-2xl border-2 border-sindoor bg-sindoor/20 px-5 py-2 font-mono text-xl font-bold uppercase text-sindoor-light shadow-[0_0_20px_rgba(230,57,80,0.4)] backdrop-blur-md"
        style={{ opacity: passOpacity }}
      >
        PASS
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 rounded-2xl border-2 border-gold bg-gold/20 px-5 py-2 font-mono text-xl font-bold uppercase text-gold shadow-[0_0_20px_rgba(240,162,2,0.4)] backdrop-blur-md"
        style={{ opacity: superLikeOpacity }}
      >
        SUPER LIKE
      </div>
    </div>
  );
}
