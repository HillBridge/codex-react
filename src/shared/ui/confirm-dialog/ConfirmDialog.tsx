import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/shared/ui/button";
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
    <ModalOverlay
      className={styles.overlay}
      isOpen={isOpen}
      isDismissable={!isPending}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Modal className={styles.modal}>
        <Dialog role="alertdialog" className={styles.dialog}>
          <Heading slot="title" className={styles.title}>
            {title}
          </Heading>
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
      </Modal>
    </ModalOverlay>
  );
}
