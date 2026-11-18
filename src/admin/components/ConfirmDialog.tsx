import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, body, confirmLabel, busy, onConfirm, onCancel }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 bg-surface p-6 shadow-xl">
          <Dialog.Title className="type-subhead">{title}</Dialog.Title>
          <Dialog.Description className="type-body mt-3 text-steel">{body}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline-on-light" size="sm" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" className="bg-coral text-ink hover:bg-coral/85" onClick={onConfirm} disabled={busy}>
              {busy ? "Working…" : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
