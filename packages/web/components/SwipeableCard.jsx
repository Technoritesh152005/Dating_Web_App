'use client';

import { useState, useRef } from 'react';
import { ProfileCard } from './ProfileCard';

const SWIPE_THRESHOLD = 120; // px of horizontal drag before it counts as a decision, not a nudge
const EXIT_DISTANCE = 600; // how far the card flies off-screen on release past threshold

export function SwipeableCard({ profile, onSwipe, disabled, topRightSlot }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(null); // 'LIKE' | 'PASS' | null
  const startRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    if (disabled || exiting) return;
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
    });
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);

    if (Math.abs(offset.x) > SWIPE_THRESHOLD) {
      const action = offset.x > 0 ? 'LIKE' : 'PASS';
      setExiting(action);
      // Let the fling-out transition play, then actually fire the swipe -
      // decouples the visual exit from the API call/state update timing,
      // so the card is visibly gone before the deck re-renders.
      setTimeout(() => onSwipe(action), 220);
    } else {
      setOffset({ x: 0, y: 0 }); // snap back - CSS transition (not dragging) handles the animation
    }
  };

  const rotation = offset.x * 0.05; // subtle rotation proportional to drag distance
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
        // stopPropagation on pointerDown specifically - without it, tapping
        // this menu would ALSO register as the start of a drag gesture on
        // the parent, since pointer events bubble.
        <div className="absolute right-4 top-4 z-10" onPointerDown={(e) => e.stopPropagation()}>
          {topRightSlot}
        </div>
      )}

      {/* LIKE / NOPE stamps - fade in with drag distance, rotated to feel
          hand-stamped rather than a flat UI label. */}
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
