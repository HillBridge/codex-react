import { Button } from "@/shared/ui/button";
import styles from "./StatusPanel.module.css";

export type StatusKind = "loading" | "empty" | "error" | "forbidden";

interface StatusPanelProps {
  kind: StatusKind;
  title: string;
  description?: string;
  onRetry?: () => void;
}

export function StatusPanel({ kind, title, description, onRetry }: StatusPanelProps) {
  return (
    <section
      aria-live={kind === "error" ? "assertive" : "polite"}
      className={styles.panel}
      role={kind === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true" className={styles.marker} data-kind={kind} />
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {onRetry ? (
        <Button onPress={onRetry} variant="secondary">
          重试
        </Button>
      ) : null}
    </section>
  );
}
