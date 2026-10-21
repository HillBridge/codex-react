import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "确认",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      title={title}
      role="alertdialog"
      isDismissable={!isPending}
      onClose={onCancel}
    >
      {description ? <p className={styles.description}>{description}</p> : null}
      <div className={styles.actions}>
        <Button variant="secondary" isDisabled={isPending} onPress={onCancel}>
          取消
        </Button>
        <Button variant="danger" isDisabled={isPending} onPress={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
}
