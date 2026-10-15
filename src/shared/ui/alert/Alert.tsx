import styles from "./Alert.module.css";

interface AlertProps {
  kind: "error" | "warning";
  title: string;
  description?: string;
}

export function Alert({ kind, title, description }: AlertProps) {
  return (
    <div className={styles.alert} data-kind={kind} role="alert">
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}
