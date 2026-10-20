import { useEffect, useState, type ReactNode } from "react";
import {
  Button,
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import styles from "./Dialog.module.css";

// 内容异步加载时，等待多久后才先打开弹窗显示加载中。
export const DEFAULT_LOADING_DELAY_MS = 300;

interface DialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  // 默认 32rem；内容较宽（如表格）时用 wide。
  size?: "default" | "wide";
  role?: "dialog" | "alertdialog";
  isDismissable?: boolean;
  // 右上角的关闭按钮，默认不显示。
  showCloseButton?: boolean;
  // 内容正在首次加载。加载在 loadingDelay 内完成，就等到内容就绪再带着内容打开；
  // 超时才先打开，由 children 自己显示加载中。避免接口很快时“加载中”一闪而过造成闪动和高度跳变。
  isLoading?: boolean;
  loadingDelay?: number;
  children: ReactNode;
}

export function Dialog({
  isOpen,
  title,
  onClose,
  size = "default",
  role = "dialog",
  isDismissable = true,
  showCloseButton = false,
  isLoading = false,
  loadingDelay = DEFAULT_LOADING_DELAY_MS,
  children,
}: DialogProps) {
  // revealed：本次打开是否已经可以显示。一旦显示，之后即使 isLoading 再变回 true 也不会收起。
  const [revealed, setRevealed] = useState(false);
  if (!isOpen && revealed) setRevealed(false);
  if (isOpen && !isLoading && !revealed) setRevealed(true);

  const waiting = isOpen && isLoading && !revealed;
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setRevealed(true), loadingDelay);
    return () => clearTimeout(timer);
  }, [waiting, loadingDelay]);

  return (
    <ModalOverlay
      className={styles.overlay}
      isOpen={isOpen && (revealed || !isLoading)}
      isDismissable={isDismissable}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal
        className={[styles.modal, size === "wide" && styles.wide]
          .filter(Boolean)
          .join(" ")}
      >
        <AriaDialog role={role} className={styles.dialog}>
          {showCloseButton ? (
            <Button aria-label="关闭" className={styles.close} onPress={onClose}>
              ×
            </Button>
          ) : null}
          <Heading slot="title" className={styles.title}>
            {title}
          </Heading>
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
