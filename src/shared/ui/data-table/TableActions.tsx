import type { ReactNode } from "react";
import styles from "./DataTable.module.css";

// 操作列里多个按钮/链接的容器，统一间距与对齐。
export function TableActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
