import { Toaster, toast } from "sonner";

export function ToastViewport() {
  return <Toaster closeButton position="top-right" richColors />;
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
