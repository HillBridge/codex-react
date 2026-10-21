import { Toaster, toast } from "sonner";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";

export function ToastViewport() {
  // 手机上顶部是固定导航，提示放到底部，避免遮挡。
  const isMobile = useIsMobile();
  return (
    <Toaster
      closeButton
      mobileOffset={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      position={isMobile ? "bottom-center" : "top-right"}
      richColors
    />
  );
}

export function notifyError({
  message,
  requestId,
}: {
  message: string;
  requestId?: string;
}) {
  toast.error(message, { description: requestId ? `请求编号：${requestId}` : undefined });
}

export function notifySuccess(message: string) {
  toast.success(message);
}

// 传入固定 id 时，同一 id 的 toast 同时只会存在一条。
export function notifyWarning(message: string, options?: { id?: string }) {
  toast.warning(message, { id: options?.id });
}
