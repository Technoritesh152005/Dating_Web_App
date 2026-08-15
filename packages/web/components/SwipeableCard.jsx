'use client';

import { useState, useRef } from 'react';
import { ProfileCard } from './ProfileCard';

const SWIPE_THRESHOLD = 120; // px of horizontal drag before it counts as a decision, not a nudge
const EXIT_DISTANCE = 600; // how far the card flies off-screen on release past threshold
const TAP_MOVEMENT_THRESHOLD = 6; // px - below this, a pointer down/up counts as a tap, not a drag

export function SwipeableCard({ profile, onSwipe, onTap, disabled, topRightSlot }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(null); // 'LIKE' | 'PASS' | null
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(0); // total distance moved this gesture - what distinguishes a tap from a drag

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

    // A tap: barely moved, so treat it as "open the detail view" instead
    // of a swipe decision - a real gesture library distinguishes these by
    // total travel distance, not by which handler fired, since both taps
    // and drags fire the same pointerdown/up sequence.
    if (movedRef.current < TAP_MOVEMENT_THRESHOLD) {
      setOffset({ x: 0, y: 0 });
      onTap?.();
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

  const rotation = offset.x * 0.05;
  const likeOpacity = Math.min(Math.max(offset.x / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-offset.x / SWIPE_THRESHOLD, 0), 1);

  const transform = exiting
    ? `translateX(${exiting === 'LIKE' ? EXIT_DISTANCE : -EXIT_DISTANCE}px) rotate(${exiting === 'LIKE' ? 30 : -30}deg)`
    : `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{
        transform,
        transition: dragging ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <ProfileCard profile={profile} />

      {topRightSlot && (
        <div className="absolute right-4 top-4 z-10" onPointerDown={(e) => e.stopPropagation()}>
          {topRightSlot}
        </div>
      )}

      <div
        className="pointer-events-none absolute left-6 top-8 rotate-[-18deg] rounded-lg border-4 border-mehendi px-3 py-1 font-display text-2xl font-semibold uppercase text-mehendi"
        style={{ opacity: likeOpacity }}
      >
        Like
      </div>
      <div
        className="pointer-events-none absolute right-6 top-8 rotate-[18deg] rounded-lg border-4 border-sindoor px-3 py-1 font-display text-2xl font-semibold uppercase text-sindoor"
        style={{ opacity: passOpacity }}
      >
        Nope
      </div>
    </div>
  );
}
