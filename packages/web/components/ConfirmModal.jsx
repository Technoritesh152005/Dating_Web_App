'use client';

import { Button } from '@/components/user_interface/Button';
import { Card } from '@/components/user_interface/Card';

export function ConfirmModal({ open, title, description, confirmLabel, onConfirm, onCancel, danger = true }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-6 backdrop-blur-sm" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()}>
        <Card className="w-full max-w-sm p-6">
          <h3 className="font-display text-xl text-cream">{title}</h3>
          {description && <p className="mt-2 text-[14px] text-cream-dim">{description}</p>}
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${danger ? '!bg-sindoor !bg-none text-cream shadow-none hover:!bg-sindoor-dark' : ''}`}
              variant={danger ? 'secondary' : 'primary'}
            >
              {confirmLabel}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
