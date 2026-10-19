import type { CSSProperties, ReactNode } from "react";
import styles from "./StatCard.module.css";

export interface Stat {
  label: string;
  value: ReactNode;
}

interface StatCardProps {
  title: string;
  stats: Stat[];
  // 标题右侧的操作区，如“查看全部”链接。
  action?: ReactNode;
  // 每行展示几项，默认 3；卡片很宽时可以调大，让所有项排成一行。
  columns?: number;
}

export function StatCard({ title, stats, action, columns = 3 }: StatCardProps) {
  return (
    <section aria-label={title} className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {action}
      </div>
      <dl className={styles.stats} style={{ "--stat-columns": columns } as CSSProperties}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
