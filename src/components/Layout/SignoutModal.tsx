'use client';

import { LogOut, AlertTriangle, Loader2 } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/Modal';

interface SignoutModalProps {
  isOpen: boolean;
  isSigningOut: boolean;
  userName?: string | null;
  userEmail?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignoutModal({
  isOpen,
  isSigningOut,
  userName,
  userEmail,
  onClose,
  onConfirm,
}: SignoutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => !isSigningOut && onClose()}>
      <ModalHeader title="Sign Out Confirmation" onClose={() => !isSigningOut && onClose()} />
      <ModalBody>
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground">
                Are you sure you want to sign out?
              </h4>
              <p className="text-xs text-muted-foreground">
                You are currently logged in as{' '}
                <span className="font-semibold text-foreground">{userName || 'Mentor'}</span> (
                {userEmail}).
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            You will need to sign in again with your email and password to access the mentor
            dashboard, student assignments, and follow-ups.
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={isSigningOut}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSigningOut}
          className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="size-4" />
              Sign Out
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}
